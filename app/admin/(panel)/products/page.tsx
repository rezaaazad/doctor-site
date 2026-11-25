import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asStringArray } from "@/lib/utils";
import { formatToman } from "@/lib/money";
import { ActionForm } from "@/components/admin/forms";
import { productOperation } from "@/lib/actions/admin/studio";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaff("manage_store");
  const { q = "", page } = await searchParams;
  const n = Math.max(1, parseInt(page || "1") || 1);
  const rows = await prisma.storeProduct.findMany({
    where: {
      type: { in: ["service", "digital"] },
      title: { contains: q, mode: "insensitive" },
    },
    include: { category: true, _count: { select: { variants: true } } },
    orderBy: { code: "desc" },
    take: 31,
    skip: (n - 1) * 30,
  });
  return (
    <section className="card grid gap-4 p-5">
      <header className="flex flex-wrap justify-between">
        <h1>محصولات فروشگاه</h1>
        <Link className="btn btn-primary" href="/admin/products/new">
          افزودن محصول جدید
        </Link>
      </header>
      <form>
        <label>
          جستجوی محصول <input className="input" name="q" defaultValue={q} />
        </label>
        <button className="btn">جستجو</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead>
            <tr>
              {["محصول", "نوع", "دسته", "قیمت", "تنوع", "انتشار", "عملیات"].map(
                (h) => (
                  <th key={h}>{h}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((p) => (
              <tr key={p.id}>
                <td>
                  {asStringArray(p.images)[0] && (
                    <Image
                      unoptimized
                      alt=""
                      width="48"
                      height="48"
                      src={asStringArray(p.images)[0]}
                    />
                  )}{" "}
                  {p.title}
                </td>
                <td>
                  <span className="badge">
                    {p.type === "service" ? "خدمت" : "دیجیتال"}
                  </span>
                </td>
                <td>{p.category.name}</td>
                <td>{formatToman(p.priceRial)}</td>
                <td>{p._count.variants}</td>
                <td>
                  <ActionForm
                    action={productOperation.bind(null, p.id, "publish")}
                  >
                    <button
                      name="publish"
                      value={p.published ? "no" : "yes"}
                      aria-pressed={p.published}
                    >
                      {p.published ? "منتشرشده" : "پیش‌نویس"}
                    </button>
                  </ActionForm>
                </td>
                <td>
                  <Link href={"/admin/products/" + p.id}>ویرایش</Link>
                  <ActionForm
                    action={productOperation.bind(null, p.id, "copy")}
                  >
                    <button>ساخت کپی</button>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav>
        {n > 1 && (
          <Link href={"?q=" + encodeURIComponent(q) + "&page=" + (n - 1)}>
            قبلی{" "}
          </Link>
        )}
        {rows.length > 30 && (
          <Link href={"?q=" + encodeURIComponent(q) + "&page=" + (n + 1)}>
            بعدی
          </Link>
        )}
      </nav>
    </section>
  );
}
