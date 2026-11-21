import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/kit";
import { ActionForm } from "@/components/admin/forms";
import { saveCatalog } from "@/lib/actions/admin/catalog";
import { formatToman } from "@/lib/money";
import { manageRecord } from "@/lib/actions/admin/records";
import { ORDER_STATUSES, statusLabel, COMMENT_STATUSES } from "@/lib/store/status";
import { canTransition } from "@/lib/store/orders";

type Row = Record<string, unknown>;
type Field = [key: string, label: string, type?: string, choices?: [string,string][]];
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-fg";
const button = "rounded-xl bg-primary text-white px-4 py-2 font-bold";
const yes: [string,string][] = [["1","بله"],["0","خیر"]];
const fields: Record<string, Field[]> = {
  products:[["title","نام محصول"],["slug","نامک"],["categoryId","دسته","select"],["type","نوع","select",[["digital","دیجیتال"],["physical","فیزیکی"],["service","خدمت"]]],["price","قیمت (تومان)","number"],["sku","شناسه"],["stock","موجودی","number"],["lowStockAt","حد هشدار","number"],["manageStock","کنترل موجودی","bool",yes],["published","انتشار","bool",yes],["featured","ویژه","bool",yes],["summary","خلاصه","textarea"],["description","توضیحات","textarea"],["images","تصاویر، هر خط یک نشانی","lines"],["seoTitle","عنوان سئو"],["seoDescription","توضیح سئو","textarea"],["torobEnabled","ترب","bool",yes],["snappEnabled","اسنپ","bool",yes],["installments","اقساط","bool",yes]],
  categories:[["name","نام"],["slug","نامک"],["description","توضیح","textarea"],["imageUrl","تصویر"],["torobName","نام ترب"],["visible","نمایش","bool",yes]],
  attributes:[["name","نام ویژگی"],["slug","نامک"],["values","مقادیر، هر خط یکی","lines"]],
  variants:[["productId","محصول","select"],["title","نام تنوع"],["sku","شناسه"],["price","قیمت تومان","number"],["stock","موجودی","number"],["values","مقادیر ویژگی (JSON)","json"],["active","فعال","bool",yes]],
  coupons:[["code","کد"],["type","نوع","select",[["percent","درصد"],["fixed","مبلغ ثابت"]]],["amount","مقدار (درصد یا تومان)","number"],["minSubtotal","حداقل خرید تومان","number"],["expiresAt","انقضا (UTC)","datetime-local"],["active","فعال","bool",yes]],
  zones:[["name","نام منطقه"],["provinces","استان‌ها، هر خط یکی","lines"]],
  methods:[["zoneId","منطقه","select"],["title","عنوان"],["kind","نوع","select",[["flat","ثابت"],["per_kg","وزنی"],["courier","پیک"]]],["cost","هزینه تومان","number"],["perKg","هزینه هر کیلو تومان","number"],["active","فعال","bool",yes]],
  taxes:[["name","نام"],["rateBp","نرخ (۹۰۰ = ۹٪)","number"],["provinces","استان‌ها","lines"],["appliesTo","نوع محصول","select",[["all","همه"],["physical","فیزیکی"],["digital","دیجیتال"],["service","خدمت"]]],["active","فعال","bool",yes]]
};
const labels: Record<string,string> = {products:"محصولات",categories:"دسته‌ها",attributes:"ویژگی‌ها",variants:"تنوع محصولات",coupons:"تخفیف‌ها",zones:"مناطق ارسال",methods:"روش‌های ارسال",taxes:"مالیات"};
function value(row:Row,key:string,type:string){
  const v = row[key] ?? (key==="price"?row.priceRial:key==="cost"?row.costRial:key==="perKg"?row.perKgRial:undefined);
  if(type==="bool")return v?"1":"0";
  if(type==="lines")return Array.isArray(v)?v.join("\n"):"";
  if(type==="json")return JSON.stringify(v??{});
  if(v instanceof Date)return v.toISOString().slice(0,16);
  if(typeof v==="bigint")return String(key==="amount"&&row.type==="percent"?v:v/BigInt(10));
  return String(v??(type==="number"?0:""));
}
async function catalog(kind:string){
  switch(kind){
    case "products":return prisma.storeProduct.findMany({orderBy:{createdAt:"desc"},take:100});
    case "categories":return prisma.storeCategory.findMany({orderBy:{name:"asc"}});
    case "attributes":return prisma.productAttribute.findMany();
    case "variants":return prisma.productVariant.findMany({take:100});
    case "coupons":return prisma.coupon.findMany({take:100});
    case "zones":return prisma.shippingZone.findMany();
    case "methods":return prisma.shippingMethod.findMany();
    case "taxes":return prisma.taxRate.findMany();
    default:return [];
  }
}
async function Catalog({kind}:{kind:string}){
  await requireStaff(kind==="coupons"?"manage_coupons":"manage_store");
  const rows:Row[]=await catalog(kind);
  const [categories,products,zones]=await Promise.all([prisma.storeCategory.findMany(),prisma.storeProduct.findMany({select:{id:true,title:true}}),prisma.shippingZone.findMany()]);
  const choices:Record<string,[string,string][]>={categoryId:categories.map(x=>[x.id,x.name]),productId:products.map(x=>[x.id,x.title]),zoneId:zones.map(x=>[x.id,x.name])};
  return <Panel title={labels[kind]}><div className="grid gap-3">{[{} as Row,...rows].map((r,i)=><details key={String(r.id??"new")} className="rounded-xl border border-line p-3"><summary className="cursor-pointer font-bold">{i===0?"افزودن "+labels[kind]:String(r.title??r.name??r.code??r.id)}</summary><ActionForm action={saveCatalog.bind(null,kind,String(r.id??""))} className="mt-4 grid gap-4 md:grid-cols-2">{fields[kind].map(([key,label,type="text",opts])=><label key={key} className="grid gap-1 text-sm font-semibold">{label}{type==="select"||type==="bool"?<select name={key} className={input} defaultValue={value(r,key,type)}>{(opts??choices[key]??[]).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>:["textarea","lines","json"].includes(type)?<textarea className={input} rows={4} name={key} defaultValue={value(r,key,type)}/>:<input className={input} type={type} name={key} defaultValue={value(r,key,type)}/>}</label>)}<div><button className={button}>ذخیره</button></div></ActionForm></details>)}</div></Panel>;
}
const aliases:Record<string,string>={posts:"blog",pages:"landings",homepage:"content",menus:"menu",library:"pricing",leads:"messages"};
export default async function SectionPage({params}:{params:Promise<{section?:string[]}>}){
  const path=(await params).section?.join("/")??"";
  if(Object.hasOwn(aliases,path))redirect("/admin/"+aliases[path]);
  if(path==="settings/payments")redirect("/admin/settings");
  const kind=path.startsWith("store/")?path.slice(6):path;
  if(kind==="shipping")return <><PageHeader title="حمل‌ونقل و مالیات"/><div className="grid gap-5">{["zones","methods","taxes"].map(k=><Catalog key={k} kind={k}/>)}</div></>;
  if(Object.hasOwn(fields,kind))return <><PageHeader title={labels[kind]} actions={kind==="products"?<Link href="/admin/store/variants">مدیریت تنوع</Link>:undefined}/><Catalog kind={kind}/></>;
  if(path==="reports"){
    await requireStaff("view_reports");
    const rows=await prisma.order.groupBy({by:["paymentStatus"],_sum:{totalRial:true,refundedRial:true},_count:{_all:true}});
    return <><PageHeader title="گزارش فروش"/><Panel>{rows.map(r=><div key={r.paymentStatus} className="flex justify-between border-b border-line p-3"><span>{r.paymentStatus} · {r._count._all} سفارش</span><strong>{formatToman((r._sum.totalRial??BigInt(0))-(r._sum.refundedRial??BigInt(0)))}</strong></div>)}</Panel></>;
  }
  if(path==="orders"){
    await requireStaff("manage_orders");
    const orders=await prisma.order.findMany({orderBy:{createdAt:"desc"},take:100,select:{id:true,number:true,name:true,status:true,paymentStatus:true,totalRial:true,createdAt:true}});
    return <><PageHeader title="سفارش‌ها"/><Panel><div className="grid gap-2">{orders.map(o=><Link className="flex flex-wrap justify-between rounded-xl border border-line p-3" href={"/admin/orders/"+o.id} key={o.id}><strong>#{o.number} · {o.name}</strong><span>{statusLabel(o.status)} · {formatToman(o.totalRial)}</span></Link>)}</div></Panel></>;
  }
  if(path.startsWith("orders/")){
    const user=await requireStaff("manage_orders"); const o=await prisma.order.findUnique({where:{id:path.split("/")[1]},include:{items:true,notes:true,refunds:true}});if(!o)notFound();
    return <><PageHeader title={"سفارش "+o.number} back={{href:"/admin/orders",label:"سفارش‌ها"}}/><Panel title={o.name}><p>{statusLabel(o.status)} · {formatToman(o.totalRial)}</p><ul>{o.items.map(i=><li key={i.id}>{i.title} × {i.quantity} · {formatToman(i.totalRial)}</li>)}</ul><ActionForm action={manageRecord.bind(null,"orderStatus",o.id)}><select name="status" className={input} defaultValue={o.status}>{Object.entries(ORDER_STATUSES).filter(([k])=>canTransition(o.status,k)&&k!=="refunded").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><button className={button}>تغییر وضعیت</button></ActionForm><ActionForm action={manageRecord.bind(null,"note",o.id)}><textarea name="body" className={input} required placeholder="یادداشت داخلی"/><button className={button}>ثبت یادداشت</button></ActionForm>{o.notes.map(n=><p key={n.id}>{n.body}</p>)}{["admin","shop_manager"].includes(user.role)&&<ActionForm action={manageRecord.bind(null,"refund",o.id)}><input name="amount" className={input} placeholder="مبلغ بازپرداخت انجام‌شده (تومان)" required/><input name="body" className={input} placeholder="دلیل" required/><label><input type="checkbox" name="confirmed" required/> بازپرداخت خارج از سامانه انجام شده است</label><button className={button}>ثبت بازپرداخت دستی</button></ActionForm>}</Panel></>;
  }
  if(path==="comments"){
    await requireStaff("moderate_comments");const rows=await prisma.comment.findMany({orderBy:{createdAt:"desc"},take:100});
    return <><PageHeader title="نظرات و بررسی‌ها"/><Panel>{rows.map(r=><ActionForm key={r.id} action={manageRecord.bind(null,"comment",r.id)} className="border-b border-line py-3"><strong>{r.name}</strong><p>{r.body}</p><select name="status" className={input} defaultValue={r.status}>{Object.entries(COMMENT_STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><button className={button}>ذخیره وضعیت</button></ActionForm>)}</Panel></>;
  }
  if(path==="customers"){
    await requireStaff("manage_customers");const rows=await prisma.customer.findMany({take:100,select:{id:true,name:true,mobile:true,blocked:true,note:true}});
    return <><PageHeader title="مشتریان"/><Panel>{rows.map(r=><ActionForm key={r.id} action={manageRecord.bind(null,"customer",r.id)} className="border-b border-line py-3"><strong>{r.name} · {r.mobile}</strong><textarea className={input} name="body" defaultValue={r.note}/><label><input name="blocked" type="checkbox" defaultChecked={r.blocked}/> مسدود</label><button className={button}>ذخیره</button></ActionForm>)}</Panel></>;
  }
  if(path==="activity"){await requireStaff("view_activity");const rows=await prisma.activityLog.findMany({orderBy:{createdAt:"desc"},take:100});return <><PageHeader title="گزارش فعالیت"/><Panel>{rows.map(r=><p className="border-b border-line py-2" key={r.id}>{r.userName} · {r.action} · {r.entity} · {r.createdAt.toLocaleString("fa-IR")}</p>)}</Panel></>;}
  notFound();
}
