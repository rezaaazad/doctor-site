# دکتر سایت

Persian agency site for doctor-site.ir: websites, online stores, apps, and SEO, with starting prices, a quote form, and a custom admin that can change every public text, price, project, and setting without a redeploy.

The public site is Persian and right-to-left. An EN control switches direction and shows English copy where it has been filled in. Fonts (Vazirmatn and Estedad) and images are served by this app. Nothing is loaded from a CDN at runtime.

## Local development

Requirements: Node.js 22, PostgreSQL 16.

```bash
cp .env.example .env
# set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (10+ characters), SESSION_SECRET (32+ characters)
npm install
npx prisma migrate deploy
npm run dev
```

Open http://127.0.0.1:43123. The first boot creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and seeds the Persian placeholder content. Later boots do not overwrite edits.

Admin: http://127.0.0.1:43123/admin

## Production

See [DEPLOY.md](DEPLOY.md). `docker compose up -d --build` runs the app, Postgres, and Caddy.

## Scripts

- `npm run dev` — development server on port 43123
- `npm run build` — production build
- `npm run start` — production server on port 3000
- `npm run lint` — ESLint
- `npx prisma migrate deploy` — apply database migrations
