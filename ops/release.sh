#!/usr/bin/env bash
# Release a reviewed revision of doctor-site to the VPS. Run as root on the server:
#   sudo bash ops/release.sh <full-40-char-commit-sha>
#
# Safety pattern (same as ops/release-store.sh):
#   - builds only tracked source of the pinned revision in a temp dir (never touches /opt/doctor-site or its .env)
#   - pg_dump of the live database, verified by restoring it into a throwaway isolated Postgres container
#   - replaces ONLY the app container (--no-deps); db and caddy (shared with the WordPress neighbour) are untouched
#   - health checks after start; on failure the previous app image is started again
# Prisma migrations run in the app entrypoint and are additive, so the previous image still works after rollback.
set -Eeuo pipefail
umask 077

revision=${1:-}
[[ $revision =~ ^[0-9a-f]{40}$ ]] || { echo "Usage: $0 <full-commit-sha>"; exit 1; }
repo=${RELEASE_REPO:-https://github.com/rezaaazad/doctor-site.git}
project=/opt/doctor-site
config=$project/docker-compose.yml
backups=/var/backups/doctor-site
keep_backups=${KEEP_BACKUPS:-14}

[[ $EUID == 0 ]] || { echo "Run as root"; exit 1; }
exec 9>/run/lock/doctor-site-release.lock
flock -n 9 || { echo "Release already running"; exit 1; }
cd "$project"

compose=(docker compose --project-directory "$project" -p doctor-site -f "$config")
app=$("${compose[@]}" ps -q app)
db=$("${compose[@]}" ps -q db)
[[ -n "$app" && -n "$db" ]] || { echo "app/db containers not found"; exit 1; }
[[ $(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.config_files"}}' "$app") == "$config" ]]
[[ $(docker inspect -f '{{.State.Health.Status}}' "$db") == healthy ]] || { echo "db is not healthy"; exit 1; }
old=$(docker inspect -f '{{.Image}}' "$app")

tmp=$(mktemp -d)
restore=
cleanup() {
  if [[ -n "$restore" ]]; then docker rm -fv "$restore" >/dev/null 2>&1 || true; fi
  rm -rf -- "$tmp"
}
trap cleanup EXIT

echo "==> Fetching $revision"
git init -q "$tmp/src"
git -C "$tmp/src" fetch -q --depth=1 "$repo" "$revision"
[[ $(git -C "$tmp/src" rev-parse FETCH_HEAD) == "$revision" ]]
git -C "$tmp/src" checkout -q --detach FETCH_HEAD

echo "==> Building image (this machine is low on RAM; keep other load off)"
docker build -t "doctor-site-release:$revision" "$tmp/src"
rollback="doctor-site-release:before-$(date -u +%Y%m%d%H%M%S)"
docker tag "$old" "$rollback"

echo "==> Backing up the database"
install -d -m 700 "$backups"
archive=$(mktemp "$backups/pre-release-XXXXXXXX.dump")
docker exec "$db" sh -ec 'exec pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$archive.partial"
mv "$archive.partial" "$archive"

restore=$(docker run -d --network none -e POSTGRES_HOST_AUTH_METHOD=trust "$(docker inspect -f '{{.Image}}' "$db")")
for ((i=0; i<60; i++)); do
  if docker exec "$restore" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$restore" createdb -U postgres restore_check
docker exec -i "$restore" pg_restore --exit-on-error --no-owner --no-acl -U postgres -d restore_check < "$archive"
tables=$(docker exec "$restore" psql -U postgres -d restore_check -Atc "select count(*) from information_schema.tables where table_schema='public'")
[[ $tables -gt 5 ]] || { echo "Restored backup looks empty ($tables tables)"; exit 1; }
docker rm -fv "$restore" >/dev/null; restore=
echo "Verified backup: $archive ($tables tables)"
ls -1t "$backups"/pre-*.dump 2>/dev/null | tail -n +$((keep_backups + 1)) | xargs -r rm -f --

override=$tmp/image.yml
use_image() {
  printf 'services:\n  app:\n    image: "%s"\n' "$1" > "$override"
  "${compose[@]}" -f "$override" up -d --no-deps --no-build --pull never --wait --wait-timeout 300 app
}
check_site() {
  docker exec "$("${compose[@]}" ps -q app)" node -e '
    const paths = ["/api/health", "/", "/store", "/admin/login"];
    (async () => {
      for (const p of paths) {
        const r = await fetch("http://127.0.0.1:3000" + p, { redirect: "manual" });
        if (r.status !== 200) { console.error(p, r.status); process.exitCode = 1; return; }
        if (p === "/") {
          const html = await r.text();
          if (!html.includes("dir=\"rtl\"")) { console.error("home html unexpected"); process.exitCode = 1; return; }
        }
      }
    })().catch((e) => { console.error(e); process.exitCode = 1; });'
}

echo "==> Starting the new app container (db and caddy are not touched)"
if ! use_image "doctor-site-release:$revision" || ! check_site; then
  echo "Health check failed. Restoring previous application image $rollback" >&2
  use_image "$rollback"
  echo "Rolled back. Database backup from before this release: $archive" >&2
  echo "Only if the data itself must be rolled back:" >&2
  echo "  docker exec -i \$(docker compose -p doctor-site ps -q db) sh -c 'pg_restore --clean --if-exists --no-owner -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"' < $archive" >&2
  exit 1
fi

# Plain `docker compose up -d app` later should keep running this release instead of rebuilding old source.
docker tag "doctor-site-release:$revision" doctor-site-app:latest
echo "Released $revision. Previous image: $rollback. Backup: $archive"
