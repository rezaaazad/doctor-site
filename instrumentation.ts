export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.SEED_ON_BOOT === "0") return;
  if (!process.env.DATABASE_URL) return;
  const { bootstrap } = await import("./lib/bootstrap");
  await bootstrap();
}
