import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { COMMENT_STATUSES } from "@/lib/store/status";
import { ReviewForm } from "@/components/account/forms";
import { Stars } from "@/components/ui/stars";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/reviews", title: "دیدگاه‌های من" });
}

export default async function ReviewsPage() {
  const customer = await requireCustomer("/account/reviews");
  const [comments, purchasable] = await Promise.all([
    prisma.comment.findMany({ where: { customerId: customer.id, targetType: "product" }, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.findMany({
      where: { order: { customerId: customer.id, paymentStatus: "paid" }, productId: { not: null } },
      select: { product: { select: { id: true, title: true } } },
      distinct: ["productId"],
    }),
  ]);
  const products = purchasable.map((p) => p.product).filter((p): p is { id: string; title: string } => Boolean(p?.id && p.title));
  return (
    <div className="grid gap-6">
      <ReviewForm products={products} />
      <section className="card p-5">
        <h2 className="mb-3 font-bold">نظرهای ثبت‌شده</h2>
        {comments.length === 0 ? (
          <p className="text-muted">نظری ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line">
            {comments.map((c) => (
              <li key={c.id} className="py-4">
                {c.rating ? <Stars value={c.rating} size={14} /> : null}
                <p className="mt-2 text-[0.88rem]">{c.body}</p>
                <p className="mt-1 text-[0.8rem] text-muted">{COMMENT_STATUSES[c.status]?.label ?? c.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}