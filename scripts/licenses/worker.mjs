import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID, createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
const db = new PrismaClient();
const root = process.env.PLUGIN_STORAGE || "/data/licenses";
const folder = path.join(root, "artifacts");
const maxAttempts = 4;
let lastHeartbeat = 0;
async function heartbeat() {
  if (Date.now() - lastHeartbeat < 30000) return;
  lastHeartbeat = Date.now();
  const key = await promisify(execFile)(
    "openssl",
    [
      "rsa",
      "-in",
      process.env.PLUGIN_SIGNING_KEY_FILE || "",
      "-check",
      "-noout",
    ],
    { timeout: 3000 },
  ).then(
    () => true,
    () => false,
  );
  const source = await readFile(
    path.join(root, "releases", "0.2.0", "owner.zip"),
  ).then(
    (data) =>
      createHash("sha256").update(data).digest("hex") ===
      "0b4daad01741f4fce55670c919cf7bfa7dea9fbbf8413cc8521321dc6e4e0188",
    () => false,
  );
  const temp = path.join(root, randomUUID() + ".json");
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await access(folder, 2);
  await writeFile(
    temp,
    JSON.stringify({ at: lastHeartbeat, key, source, storage: true }),
    { mode: 0o600 },
  );
  await rename(temp, path.join(root, "health.json"));
}
async function processNext() {
  const lease = randomUUID();
  // A killed worker becomes reclaimable. A fresh lease fences all previous attempts.
  const [job] =
    await db.$queryRaw`UPDATE "PluginLicense" SET state='building', lease=${lease}, attempts=attempts+1,
    "nextAttempt"=NOW()+INTERVAL '2 minutes' WHERE id=(SELECT id FROM "PluginLicense"
    WHERE state IN ('pending','building') AND blocked='' AND "nextAttempt"<=NOW()
    ORDER BY "nextAttempt",id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
  if (!job) return false;
  const file = lease + ".zip";
  const tmp = path.join(folder, lease + ".tmp");
  let reason =
    "ساخت فایل ناموفق بود؛ فایل مادر، checksum یا کلید امضا را بررسی کنید.";
  try {
    if (job.attempts > maxAttempts) throw Error("attempts exhausted");
    await mkdir(folder, { recursive: true, mode: 0o700 });
    await promisify(execFile)(
      "python3",
      [
        "scripts/licenses/build.py",
        root,
        job.version,
        tmp,
        job.tier,
        job.host,
        String(Math.floor(job.expiresAt.getTime() / 1000)),
      ],
      { timeout: 60000 },
    );
    reason = "ثبت فایل در فضای خصوصی ناموفق بود.";
    const checksum = createHash("sha256")
      .update(await readFile(tmp))
      .digest("hex");
    await rename(tmp, path.join(folder, file));
    await db.$transaction(async (tx) => {
      const saved = await tx.pluginLicense.updateMany({
        where: { id: job.id, lease, blocked: "" },
        data: {
          artifact: file,
          state: "ready",
          checksum,
          builtAt: new Date(),
          lease: "",
          error: "",
        },
      });
      if (saved.count)
        await tx.licenseEvent.create({
          data: {
            licenseId: job.id,
            body: "ساخت موفق " + job.version + " SHA-256 " + checksum,
          },
        });
      else await rm(path.join(folder, file), { force: true });
    });
  } catch {
    await db.$transaction(async (tx) => {
      const saved = await tx.pluginLicense.updateMany({
        where: { id: job.id, lease },
        data: {
          lease: "",
          state: job.attempts >= maxAttempts ? "failed" : "pending",
          error: reason,
          nextAttempt: new Date(Date.now() + 15000 * job.attempts),
        },
      });
      if (saved.count)
        await tx.licenseEvent.create({
          data: { licenseId: job.id, body: reason },
        });
    });
  } finally {
    await rm(tmp, { force: true }).catch(() => {});
  }
  return true;
}
try {
  do {
    await heartbeat().catch(() => {});
    const worked = await processNext();
    if (process.argv.includes("--once")) break;
    if (!worked) await sleep(3000);
  } while (true);
} finally {
  await db.$disconnect();
}
