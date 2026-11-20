#!/bin/sh
set -eu

mkdir -p /data/uploads
chown nextjs:nodejs /data/uploads

node <<'JS'
const net = require("net");
const raw = process.env.DATABASE_URL || "";
let host = "db";
let port = 5432;
try {
  const url = new URL(raw);
  host = url.hostname || host;
  port = Number(url.port || 5432);
} catch {
  process.exit(1);
}
const started = Date.now();
function attempt() {
  const socket = net.connect({ host, port }, () => {
    socket.end();
    process.exit(0);
  });
  const fail = () => {
    socket.destroy();
    if (Date.now() - started > 60000) {
      console.error("database did not accept connections");
      process.exit(1);
    }
    setTimeout(attempt, 1000);
  };
  socket.setTimeout(2000);
  socket.on("timeout", fail);
  socket.on("error", fail);
}
attempt();
JS

cd /app
runuser -u nextjs -- npx prisma migrate deploy
exec runuser -u nextjs -- env HOME=/home/nextjs node server.js
