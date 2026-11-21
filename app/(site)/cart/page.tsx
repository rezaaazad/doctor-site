import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { CartPageClient } from "@/components/store/cart-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/cart", title: "سبد خرید", description: "مرور و ویرایش سبد خرید" });
}

export default function CartPage() {
  return (
    <div className="wrap pad pb-20">
      <div className="mb-8">
        <Link href="/store" className="text-[0.82rem] font-semibold text-primary hover:underline">
          ادامه خرید
        </Link>
        <h1 className="mt-2 font-display text-[2rem] font-extrabold">سبد خرید</h1>
      </div>
      <CartPageClient />
    </div>
  );
}