import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encodeCsv } from "@/lib/admin/csv";
export async function GET(_request:Request,{params}:{params:Promise<{kind:string}>}){
  const {kind}=await params;
  await requireStaff("manage_backups");
  let rows:unknown[][];
  if(kind==="products"){
    await requireStaff("manage_store");
    const p=await prisma.storeProduct.findMany({select:{slug:true,title:true,summary:true,priceRial:true,category:{select:{slug:true}}}});
    rows=[["slug","title","summary","priceToman","category"],...p.map(x=>[x.slug,x.title,x.summary,x.priceRial/BigInt(10),x.category.slug])];
  }else if(kind==="customers"){
    await requireStaff("manage_customers");
    const p=await prisma.customer.findMany({select:{mobile:true,name:true,note:true}});
    rows=[["mobile","name","note"],...p.map(x=>[x.mobile,x.name,x.note])];
  }else if(kind==="orders"){
    await requireStaff("manage_orders");
    const p=await prisma.order.findMany({select:{number:true,trackingCode:true,carrier:true,status:true,totalRial:true}});
    rows=[["number","trackingCode","carrier","status","totalRial"],...p.map(x=>[x.number,x.trackingCode,x.carrier,x.status,x.totalRial])];
  }else if(kind==="content"){
    const [posts,pages,categories,products,menus,sections]=await Promise.all([prisma.blogPost.findMany(),prisma.landingPage.findMany(),prisma.storeCategory.findMany(),prisma.storeProduct.findMany({omit:{downloadUrl:true,downloadMedia:true}}),prisma.menuItem.findMany(),prisma.section.findMany()]);
    return new Response(JSON.stringify({posts,pages,categories,products,menus,sections},(_,v)=>typeof v==="bigint"?String(v):v),{headers:{"Content-Type":"application/json","Content-Disposition":"attachment; filename=content.json","Cache-Control":"no-store"}});
  }else return new Response("Not found",{status:404});
  return new Response("\uFEFF"+encodeCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename=${kind}.csv`,"Cache-Control":"no-store"}});
}
