# Deploy doctor-site.ir

Target machine: a fresh Ubuntu 24.04 server with 2 CPUs and about 3.8 GB of RAM, Docker, and ports 80 and 443 open. The stack is three containers: the Next.js app, Postgres 16, and Caddy. Caddy gets HTTPS certificates for `doctor-site.ir` and `www.doctor-site.ir` after DNS points at the server. Before that, the site answers plain HTTP on the server IP.

## 1. Prepare the server

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in so the docker group applies, or run the compose commands with `sudo`.

The Next.js production build needs more RAM than 3.8 GB reliably leaves free. Add a 2 GB swap file before the first build:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Open the web ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Configure

```bash
git clone <your-repo-url> doctor-site
cd doctor-site
cp .env.example .env
```

Edit `.env`:

- `POSTGRES_PASSWORD` — long random database password
- `ADMIN_EMAIL` — the first admin’s email
- `ADMIN_PASSWORD` — at least 10 characters, with a letter and a number
- `SESSION_SECRET` — at least 32 random characters (`openssl rand -hex 32`)
- `SITE_URL` — `https://doctor-site.ir`
- `CADDY_EMAIL` — the address Let’s Encrypt uses for expiry notices
- `HTTP_PORT=80` and `HTTPS_PORT=443`
- `CADDYFILE=./Caddyfile`

`ADMIN_PASSWORD` is read only when the database has no admin yet. Changing it later in `.env` does not reset the password. Change it from the admin panel after the first login.

## 3. Build and start

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

The first start applies migrations, creates the admin from `.env`, and seeds the Persian placeholder content. Later starts keep your edits.

## 4. Preview by IP

Before DNS is pointed at the server, open `http://SERVER_IP`. That request does not go through HTTPS. The admin is `http://SERVER_IP/admin`.

Log in, change the admin password, and replace the sample testimonials before you announce the site.

## 5. Point DNS and turn on HTTPS

Create these records at the domain registrar:

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | server IPv4 |
| `www` | A | server IPv4 |

Wait until `dig +short doctor-site.ir` returns the server address. Caddy will retry the certificate. If the first attempt happened before DNS propagated, restart the proxy:

```bash
docker compose restart caddy
docker compose logs caddy
```

Then open `https://doctor-site.ir` and `https://www.doctor-site.ir`.

## 6. Updates

### Live server (doctor-site.ir): use `ops/release.sh`

The production Caddy container also serves an unrelated WordPress site (`reza.noorproxy.shop`) on the same Docker network, and `/opt/doctor-site` is not a git checkout. Release a reviewed commit with:

```bash
sudo bash ops/release.sh <full-40-character-commit-sha>
```

The script:

1. builds the image from a clean shallow clone of that exact commit (it never reads or changes `/opt/doctor-site` or its `.env`);
2. takes a `pg_dump` into `/var/backups/doctor-site/` and proves it restores into a throwaway, network-less Postgres container (keeps the last 14 dumps);
3. tags the running app image for rollback;
4. replaces **only** the `app` container (`up -d --no-deps --no-build`); `db` and `caddy` are not recreated;
5. checks `/api/health`, `/`, `/store` and `/admin/login` from inside the container, and starts the previous image again if any check fails.

The app entrypoint runs `prisma migrate deploy`. All migrations in this repo are additive (new tables/columns with defaults), so the previous image keeps working against the migrated database after a rollback. The boot seed only fills rows that are missing; it never overwrites edited content.

Never do these on the live server:

- `docker compose down` (takes down the shared network and the WordPress neighbour);
- replace `Caddyfile` with a version that lacks the `reza.noorproxy.shop` block;
- recreate `caddy` or `db` as part of an app release;
- open port 443 to the whole internet (the CDN firewall `centimelk-dockeruser-fw` allows only CDN ranges).

### Fresh server

```bash
git pull
docker compose up -d --build
```

Postgres data and uploaded media live in Docker volumes (`pgdata` and `uploads`) and survive rebuilds.

### After the first release of the store version

Log in to `/admin` and work through **Settings** (`/admin/settings`): identity and contact, theme, store, payment gateways (Zarinpal, Snapp Pay, Torob Pay, card-to-card, cash on delivery, test gateway), SMS (Kavenegar or Melipayamak, needed for customer OTP login), email (SMTP), Telegram and order notifications, Torob and Snapp Shop. Each gateway has a sandbox/stage switch; turn on the live mode only after a successful test order. The full admin guide is in `README.md`.

## 7. Backups

`ops/release.sh` takes a verified dump before every release. For a scheduled backup, a database dump can also be downloaded from **Admin → Tools → Backup** (`/admin/tools`), or run on the server:

```bash
docker compose exec -T db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > backup.dump
docker run --rm -v doctor-site_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads.tgz -C /data .
```

The volume name is prefixed with the compose project name. Check it with `docker volume ls`.

Restore a `.dump` with `pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"` inside the `db` container (pipe the file to `docker compose exec -T db ...`), and unpack uploads into the uploads volume. Private digital-product files live under `private/` in the same volume, so the uploads archive covers them too.

## 8. Where things live

- App container listens on port 3000 and is not published to the host. Only Caddy publishes 80 and 443.
- Uploads are stored in the `uploads` volume at `/data/uploads` and served from `/media/...`.
- `UPLOAD_DIR`, `DATABASE_URL` inside the app container, and the session cookie flags are set by Compose. Over plain HTTP the session cookie is not marked Secure, so admin login works on the IP preview. Over HTTPS it is marked Secure.

## 9. If the build is killed

`dmesg` showing `Killed process` means the machine ran out of memory. Confirm swap is on (`free -h`) and rebuild with nothing else heavy running:

```bash
docker compose build --no-cache app
docker compose up -d
```

The image build limits the Node heap to 1536 MB so it can coexist with the OS. Do not run the build while Postgres is under a large import.

## 10. Logs and health

```bash
docker compose logs app
docker compose logs caddy
curl -fsS http://127.0.0.1/api/health
```

A healthy app returns `{"ok":true}`.
