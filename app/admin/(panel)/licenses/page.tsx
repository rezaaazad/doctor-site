import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { releaseVersion, tiers } from "@/lib/licenses/domain";
import { labels } from "@/lib/licenses/delivery";
import { ActionForm } from "@/components/admin/forms";
import {
  createPluginProduct,
  configurePlugin,
} from "@/lib/actions/admin/licenses";
export default async function Licenses({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireStaff("manage_orders");
  const { q = "", tier, state, valid, product, page } = await searchParams;
  const n = Math.max(1, parseInt(page) || 1);
  const where = {
    tier: tiers.some((t) => t === tier) ? tier : undefined,
    state: state || undefined,
    expiresAt:
      valid === "active"
        ? { gte: new Date() }
        : valid === "expired"
          ? { lt: new Date() }
          : undefined,
    OR: [
      { host: { contains: q } },
      {
        purchases: {
          some: {
            item: {
              order: {
                OR: [
                  { name: { contains: q } },
                  { mobile: { contains: q } },
                  ...(/^\d{1,9}$/.test(q) ? [{ number: Number(q) }] : []),
                ],
              },
            },
          },
        },
      },
    ],
  };
  const licenses = await prisma.pluginLicense.findMany({
    where,
    take: 31,
    skip: (n - 1) * 30,
    orderBy: { startsAt: "desc" },
  });
  const manage = can(user.role, "manage_store");
  const products = manage
    ? await prisma.storeProduct.findMany({
        where: { type: "digital" },
        select: { id: true, title: true, licensedPlugin: true },
        orderBy: { title: "asc" },
      })
    : [];
  const selected =
    products.find((p) => p.id === product) ||
    products.find((p) => p.licensedPlugin);
  const variants = selected
    ? await prisma.productVariant.findMany({
        where: { productId: selected.id, active: true },
      })
    : [];
  const cats = manage
    ? await prisma.storeCategory.findMany({ select: { id: true, name: true } })
    : [];
  const health = await readFile(
    path.join(process.env.PLUGIN_STORAGE || "/data/licenses", "health.json"),
    "utf8",
  )
    .then((s) => JSON.parse(s))
    .catch(() => null);
  return (
    <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 [overflow-wrap:anywhere]">
      <h1 className="text-xl font-bold">لایسنس‌های افزونه</h1>
      <section className="card p-4">
        نسخه {releaseVersion} · پردازشگر{" "}
        {health && Date.now() - health.at < 120000 ? "فعال" : "در انتظار اتصال"}{" "}
        · کلید {health?.key ? "آماده" : "بررسی شود"} · فایل مادر{" "}
        {health?.source ? "آماده" : "بررسی شود"} · فضای خصوصی{" "}
        {health?.storage ? "آماده" : "بررسی شود"}
      </section>
      <form className="card flex flex-wrap gap-3 p-4">
        <input
          className="input"
          name="q"
          defaultValue={q}
          aria-label="جستجو"
          placeholder="دامنه، مشتری یا شماره سفارش"
        />
        <select name="tier" defaultValue={tier} aria-label="پلن">
          <option value="">همه پلن‌ها</option>
          {tiers.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select name="state" defaultValue={state} aria-label="وضعیت صدور">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(labels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="valid" defaultValue={valid} aria-label="اعتبار">
          <option value="">همه اعتبارها</option>
          <option value="active">معتبر</option>
          <option value="expired">منقضی</option>
        </select>
        <button className="btn btn-primary">جستجو</button>
      </form>
      {licenses.slice(0, 30).map((l) => (
        <Link
          key={l.id}
          className="card flex flex-wrap justify-between gap-2 p-4"
          href={"/admin/licenses/" + l.id}
        >
          <bdi>{l.host}</bdi>
          <b>{l.tier}</b>
          <span>{l.blocked ? "تحویل متوقف" : labels[l.state]}</span>
        </Link>
      ))}
      {!licenses.length && <p>مجوزی پیدا نشد.</p>}
      <nav>
        {[n > 1 ? n - 1 : 0, licenses.length > 30 ? n + 1 : 0]
          .filter(Boolean)
          .map((i) => (
            <Link
              key={i}
              href={
                "?" +
                new URLSearchParams({
                  ...{
                    q,
                    tier: tier || "",
                    state: state || "",
                    valid: valid || "",
                  },
                  page: String(i),
                })
              }
            >
              {" "}
              صفحه {i}{" "}
            </Link>
          ))}
      </nav>
      {manage && (
        <details className="card p-4">
          <summary>تعریف محصول و اتصال پلن‌ها</summary>
          <ActionForm action={createPluginProduct}>
            <label>
              دسته محصول
              <select name="category">
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-outline">
              ساخت یا باز کردن پیش‌نویس پیشنهادی
            </button>
          </ActionForm>
          <form>
            <select name="product" defaultValue={selected?.id}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button>انتخاب محصول</button>
          </form>
          {selected && (
            <ActionForm action={configurePlugin}>
              <input type="hidden" name="product" value={selected.id} />
              {tiers.map((t) => (
                <label key={t}>
                  {t}
                  <select
                    name={t}
                    required
                    defaultValue={
                      variants.find((v) => v.pluginTier === t)?.id || ""
                    }
                  >
                    <option value="">تنوع محصول</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input"
                    name={t + "Days"}
                    aria-label="مدت اعتبار به روز"
                    min={1}
                    max={3650}
                    defaultValue={
                      variants.find((v) => v.pluginTier === t)?.pluginDays ||
                      365
                    }
                  />
                </label>
              ))}
              <button className="btn btn-primary">
                اتصال محصول به صدور لایسنس
              </button>
            </ActionForm>
          )}
        </details>
      )}
    </main>
  );
}
