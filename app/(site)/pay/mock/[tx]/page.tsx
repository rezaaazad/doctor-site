import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { mockPayDecisionAction } from "@/lib/actions/shop";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tx: string }> };

export default async function MockPayPage({ params }: Props) {
  const { tx } = await params;
  const payment = await prisma.payment.findUnique({ where: { transactionId: tx }, include: { order: true } });
  if (!payment || !payment.authority.startsWith("mock_")) notFound();

  async function approve() {
    "use server";
    const result = await mockPayDecisionAction(tx, true);
    if (!result.ok) throw new Error(result.message);
    redirect(result.callback);
  }

  async function decline() {
    "use server";
    const result = await mockPayDecisionAction(tx, false);
    if (!result.ok) throw new Error(result.message);
    redirect(result.callback);
  }

  return (
    <div className="wrap pad flex min-h-[70vh] items-center justify-center pb-20">
      <article className="card max-w-md p-8 text-center">
        <p className="text-[0.82rem] font-bold text-primary">درگاه آزمایشی</p>
        <h1 className="mt-2 font-display text-[1.5rem] font-extrabold">شبیه‌سازی پرداخت</h1>
        <p className="mt-3 text-muted">
          سفارش {payment.order.number.toLocaleString("fa-IR")} — {formatToman(payment.amountRial)}
        </p>
        <div className="mt-8 grid gap-3">
          <form action={approve}>
            <button type="submit" className="btn btn-action btn-lg w-full">
              پرداخت موفق
            </button>
          </form>
          <form action={decline}>
            <button type="submit" className="btn btn-outline w-full">
              انصراف / ناموفق
            </button>
          </form>
        </div>
      </article>
    </div>
  );
}