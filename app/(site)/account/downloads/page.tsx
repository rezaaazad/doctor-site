import {labels,paidPurchases} from "@/lib/licenses/delivery";
import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/downloads", title: "دانلودها" });
}

export default async function DownloadsPage() {
  const customer = await requireCustomer("/account/downloads");
  const licenses=await prisma.pluginLicense.findMany({where:{customerId:customer.id},orderBy:{startsAt:"desc"},include:{purchases:{take:1,include:{item:{select:{product:{select:{slug:true,published:true}}}}}}}});
  const allowed=new Set((await prisma.pluginLicense.findMany({where:{customerId:customer.id,blocked:"",purchases:paidPurchases},select:{id:true}})).map(l=>l.id));
  const grants = await prisma.downloadGrant.findMany({
    where: { order: { customerId: customer.id } },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { number: true } },orderItem:{select:{product:{select:{licenseNote:true,guarantee:true}}}} },
  });
  return (
    <section className="card p-5">
      <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">فایل‌های دانلودی</h1>
      {licenses.map(l=><article className="card my-3 grid min-w-0 gap-3 p-4" key={l.id}><h2 className="font-bold">{l.title}</h2><p>{l.tier} · نسخه {l.version} · <bdi className="break-all">{l.host}</bdi></p><p>پایان اعتبار: <time dateTime={l.expiresAt.toISOString()}>{l.expiresAt.toLocaleString("fa-IR",{timeZone:"UTC"})} UTC</time></p><p>{!allowed.has(l.id)?"تحویل متوقف شده":l.expiresAt < new Date()?"اعتبار پایان یافته":labels[l.state]}</p>{allowed.has(l.id)&&l.state==="ready"&&l.expiresAt>=new Date()&&<a className="btn btn-primary" href={"/api/licenses/"+l.id+"/download"}>دانلود ZIP قابل نصب</a>}<p>در وردپرس با ووکامرس فعال، از افزونه‌ها ← افزودن ← بارگذاری افزونه نصب کنید. پس از تمدید فایل قبلی را با ZIP جدید جایگزین کنید.</p>{allowed.has(l.id)&&l.purchases[0]?.item.product?.published&&<Link className="btn btn-outline" href={"/store/"+l.purchases[0].item.product.slug+"?renew="+l.id}>تمدید همین مجوز</Link>}</article>)}
      {grants.length === 0 && licenses.length===0 ? (
        <div className="account-empty"><p>فایل‌های خریداری‌شده بعد از پرداخت در این بخش قرار می‌گیرند.</p><Link href="/store" className="btn btn-outline">مشاهده فروشگاه</Link></div>
      ) : (
        <ul className="divide-y divide-line">
          {grants.map((g) => {
            const expired = g.expiresAt && g.expiresAt.getTime() < Date.now();
            const ok = g.remaining > 0 && !expired;
            return (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-[0.88rem]">
                <div>
                  <p className="font-bold">{g.title}</p>
                  {g.orderItem.product?.guarantee && <p>پشتیبانی: {g.orderItem.product.guarantee}</p>}
                  {g.orderItem.product?.licenseNote && <p className="text-sm">شرایط مجوز: {g.orderItem.product.licenseNote}</p>}
                  <p className="text-muted">سفارش #{g.order.number.toLocaleString("fa-IR")}</p>
                  <p className="text-[0.8rem] text-muted">
                    باقی‌مانده: {g.remaining.toLocaleString("fa-IR")}
                    {g.expiresAt ? ` · تا ${new Date(g.expiresAt).toLocaleDateString("fa-IR")}` : ""}
                  </p>
                </div>
                {ok ? (
                  <a href={`/api/download/${g.token}`} className="btn btn-primary btn-sm">
                    دانلود
                  </a>
                ) : (
                  <span className="text-urgency">{expired ? "مهلت دانلود پایان یافته" : "دفعات دانلود تمام شده"}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}