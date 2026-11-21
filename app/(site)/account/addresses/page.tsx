import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { AddressForm } from "@/components/account/forms";
import { deleteAddressFormAction } from "@/lib/actions/account";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/addresses", title: "آدرس‌ها" });
}

export default async function AddressesPage() {
  const customer = await requireCustomer("/account/addresses");
  const addresses = await prisma.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">آدرس‌های من</h1>
        {addresses.length === 0 ? <p className="mb-4 text-muted">آدرسی ثبت نشده است.</p> : (
          <ul className="mb-6 divide-y divide-line">
            {addresses.map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="text-[0.88rem] leading-7">
                    <b>{a.title || "آدرس"}</b> {a.isDefault ? <span className="badge badge-success ms-2">پیش‌فرض</span> : null}
                    <br />
                    {a.receiver} · {a.mobile}
                    <br />
                    {a.province}، {a.city} — {a.line}
                  </p>
                  <form action={deleteAddressFormAction.bind(null, a.id)}>
                    <button type="submit" className="btn btn-ghost btn-sm text-urgency">حذف</button>
                  </form>
                </div>
                <AddressForm address={a} />
              </li>
            ))}
          </ul>
        )}
        <h2 className="mb-3 font-bold">افزودن آدرس جدید</h2>
        <AddressForm />
      </section>
    </div>
  );
}
