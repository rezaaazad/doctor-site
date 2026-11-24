import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { PageHeader, Panel, StatCard } from "@/components/admin/kit";
import { statusLabel } from "@/lib/store/status";

export default async function DashboardPage() {
  const user = await requireStaff("view_dashboard");
  const today = new Date(Math.floor((Date.now()+12600000)/86400000)*86400000-12600000);
  const paid = can(user.role,"view_reports") ? await prisma.order.findMany({where:{paidAt:{gte:new Date(today.getTime()-29*86400000)},paymentStatus:{in:["paid","partially_refunded","refunded"]}},select:{paidAt:true,totalRial:true,refundedRial:true}}) : [];
  const net = (days:number) => paid.reduce((sum,o)=>o.paidAt && o.paidAt.getTime()>=today.getTime()-(days-1)*86400000 ? sum+o.totalRial-o.refundedRial:sum,BigInt(0));
  const daily=Array.from({length:7},(_,i)=>{const start=today.getTime()-(6-i)*86400000; return {label:new Date(start).toLocaleDateString("fa-IR",{timeZone:"Asia/Tehran",weekday:"short"}),total:paid.reduce((sum,o)=>o.paidAt&&o.paidAt.getTime()>=start&&o.paidAt.getTime()<start+86400000?sum+o.totalRial-o.refundedRial:sum,BigInt(0))};});
  const peak=Math.max(1,...daily.map(d=>Number(d.total)));
  const sales = can(user.role,"manage_orders") ? await prisma.order.findMany({take:8,orderBy:{createdAt:"desc"},select:{id:true,number:true,status:true,totalRial:true}}) : [];
  const stock = can(user.role,"manage_store") ? await prisma.storeProduct.findMany({where:{manageStock:true,stock:{lte:prisma.storeProduct.fields.lowStockAt}},select:{id:true,title:true,stock:true},take:10}) : [];
  return <><PageHeader title={"سلام، "+user.name} description="پیشخوان فروشگاه"/><div className="grid gap-5">
    {can(user.role,"view_reports")&&<div className="grid gap-3 md:grid-cols-3">{[1,7,30].map((n,i)=><StatCard key={n} label={["فروش خالص امروز","۷ روز اخیر","۳۰ روز اخیر"][i]} value={formatToman(net(n))} tone="success"/>)}</div>}
    {can(user.role,"view_reports")&&<Panel title="روند فروش خالص" description="هفت روز اخیر"><div className="grid h-48 grid-cols-7 gap-2" dir="ltr">{daily.map((day,i)=><div key={i} className="flex min-w-0 flex-col items-center justify-end gap-2"><div className="flex h-full w-full items-end justify-center rounded-lg bg-sunken"><div title={formatToman(day.total)} aria-label={day.label+" "+formatToman(day.total)} className="w-3/5 rounded-t-md bg-primary" style={{height:Math.max(0,Number(day.total)/peak*100)+"%"}}/></div><small className="text-muted">{day.label}</small></div>)}</div></Panel>}
    {can(user.role,"manage_orders")&&<Panel title="آخرین سفارش‌ها">{sales.length===0?<p>سفارشی ثبت نشده است.</p>:sales.map(o=><Link key={o.id} href={"/admin/orders/"+o.id} className="flex flex-wrap justify-between border-b border-line py-3"><span>#{o.number} · {statusLabel(o.status)}</span><span>{formatToman(o.totalRial)}</span></Link>)}</Panel>}
    {can(user.role,"manage_store")&&<Panel title="هشدار موجودی">{stock.length===0?<p>محصول کم‌موجودی وجود ندارد.</p>:stock.map(p=><Link key={p.id} href="/admin/products" className="flex justify-between border-b border-line py-3">{p.title}<strong>{p.stock}</strong></Link>)}</Panel>}
  </div></>;
}
