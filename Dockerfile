# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV DATABASE_URL=postgresql://doctor:doctor@127.0.0.1:5432/doctor_site?schema=public
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates tini util-linux \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system nodejs \
  && useradd --system --gid nodejs --home /home/nextjs --create-home nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone /app
COPY --from=build /app/.next/static /app/.next/static
COPY --from=build /app/public /app/public
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/assets /app/assets
COPY docker/entrypoint.sh /entrypoint.sh
RUN rm -rf /app/node_modules
COPY --from=build /app/node_modules /app/node_modules
RUN chmod +x /entrypoint.sh \
  && mkdir -p /data/uploads \
  && chown -R nextjs:nodejs /app /data
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
