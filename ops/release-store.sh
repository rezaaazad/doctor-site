#!/usr/bin/env bash
# One-time release of the reviewed storefront. Run as root on the Doctor Site VPS.
set -Eeuo pipefail
umask 077
revision=89960fd7ccf5d803500f722bb171f4cd9cce31de
project=/opt/doctor-site
config=$project/docker-compose.yml
[[ $EUID == 0 ]] || { echo "Run as root"; exit 1; }
exec 9>/run/lock/doctor-site-release.lock
flock -n 9 || { echo "Release already running"; exit 1; }
cd "$project"
compose=(docker compose --project-directory "$project" -p doctor-site -f "$config")
app=$("${compose[@]}" ps -q app)
db=$("${compose[@]}" ps -q db)
[[ -n "$app" && -n "$db" ]]
[[ $(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.config_files"}}' "$app") == "$config" ]]
[[ $(docker inspect -f '{{.State.Health.Status}}' "$db") == healthy ]]
old=$(docker inspect -f '{{.Image}}' "$app")
tmp=$(mktemp -d)
restore=
cleanup() {
  if [[ -n "$restore" ]]; then docker rm -fv "$restore" >/dev/null; fi
  rm -rf -- "$tmp"
}
trap cleanup EXIT

# Build only tracked source, independently of the live checkout and its .env.
git init -q "$tmp/src"
git -C "$tmp/src" fetch -q --depth=1 https://github.com/rezaaazad/doctor-site.git "$revision"
[[ $(git -C "$tmp/src" rev-parse FETCH_HEAD) == "$revision" ]]
git -C "$tmp/src" checkout -q --detach FETCH_HEAD
docker build -t "doctor-site-release:$revision" "$tmp/src"
rollback="doctor-site-release:before-$(date -u +%Y%m%d%H%M%S)"
docker tag "$old" "$rollback"

install -d -m 700 /var/backups/doctor-site
archive=$(mktemp /var/backups/doctor-site/pre-store-XXXXXXXX.dump)
docker exec "$db" sh -ec 'exec pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$archive.partial"
mv "$archive.partial" "$archive"

# Restore into a disposable isolated cluster with the same PostgreSQL image.
restore=$(docker run -d --network none -e POSTGRES_HOST_AUTH_METHOD=trust "$(docker inspect -f '{{.Image}}' "$db")")
for ((i=0; i<60; i++)); do
  if docker exec "$restore" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$restore" createdb -U postgres restore_check
docker exec -i "$restore" pg_restore --exit-on-error --no-owner --no-acl -U postgres -d restore_check < "$archive"
echo "Verified backup: $archive"

override=$tmp/image.yml
use_image() {
  printf 'services:\n  app:\n    image: "%s"\n' "$1" > "$override"
  "${compose[@]}" -f "$override" up -d --no-deps --no-build --pull never --wait --wait-timeout 240 app
}
check_store() {
  docker exec "$("${compose[@]}" ps -q app)" node -e '
    fetch("http://127.0.0.1:3000/store").then(async r => {
      const html = await r.text();
      if (!r.ok || !/<h1[^>]*>فروشگاه محصولات دیجیتال<\/h1>/.test(html)) process.exitCode=1;
    }).catch(() => {process.exitCode=1})'
}
if ! use_image "doctor-site-release:$revision" || ! check_store; then
  echo "Store health check failed. Restoring previous application image." >&2
  use_image "$rollback"
  exit 1
fi
echo "Store verified on app. Released $revision; prior image: $rollback"
