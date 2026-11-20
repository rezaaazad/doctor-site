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

```bash
git pull
docker compose up -d --build
```

Postgres data and uploaded media live in Docker volumes (`pgdata` and `uploads`) and survive rebuilds.

## 7. Backups

```bash
docker compose exec db pg_dump -U doctor doctor_site > backup.sql
docker run --rm -v doctor-site_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads.tgz -C /data .
```

The volume name is prefixed with the compose project name. Check it with `docker volume ls`.

Restore the database with `psql` inside the `db` container, and unpack uploads into the uploads volume.

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
