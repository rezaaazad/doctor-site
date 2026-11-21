"use server";
import { prisma } from "@/lib/db";
import { adminRun,field,FieldError,type AdminState } from "@/lib/admin/action";
import { parseCsv } from "@/lib/admin/csv";
import { z } from "zod";
import { normalizeMobile } from "@/lib/money";

export async function importCsv(kind:string,_prev:AdminState,fd:FormData){
  if(!["products","customers","orders"].includes(kind))return {ok:false,message:"نوع نامعتبر"};
  return adminRun(kind==="products"?"manage_store":kind==="customers"?"manage_customers":"manage_orders",async()=>{
    const file=fd.get("file");
    if(!(file instanceof File)||file.size>2000000)throw new FieldError("file","فایل CSV حداکثر ۲ مگابایت");
    const [header,...rows]=parseCsv(await file.text());
    if(!header||rows.length>1000||rows.some(r=>r.length!==header.length))throw new FieldError("file","حداکثر هزار ردیف معتبر");
    const required=kind==="products"?["slug","title","summary","priceToman","category"]:kind==="customers"?["mobile","name","note"]:["number","trackingCode","carrier"];
    if(new Set(header).size!==header.length||required.some(key=>!header.includes(key)))throw new FieldError("file","ستون‌های CSV با نمونه خروجی مطابقت ندارند.");
    await prisma.$transaction(async tx=>{
      for(const row of rows){
        const x=Object.fromEntries(header.map((h,i)=>[h,row[i]]));
        if(kind==="products"){
          const slug=z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).parse(x.slug);
          const category=await tx.storeCategory.findUniqueOrThrow({where:{slug:x.category}});
          const priceRial=BigInt(z.string().regex(/^\d{1,17}$/).parse(x.priceToman))*BigInt(10);
          const data={title:z.string().min(1).max(250).parse(x.title),summary:x.summary??"",categoryId:category.id,priceRial};
          await tx.storeProduct.upsert({where:{slug},update:data,create:{...data,slug,published:false}});
        }else if(kind==="customers"){
          const mobile=normalizeMobile(x.mobile??"");
          if(!mobile)throw new FieldError("file","شماره موبایل نامعتبر");
          await tx.customer.upsert({where:{mobile},update:{name:x.name??"",note:x.note??""},create:{mobile,name:x.name??"",note:x.note??""}});
        }else{
          const number=z.coerce.number().int().positive().parse(x.number);
          await tx.order.update({where:{number},data:{trackingCode:x.trackingCode??"",carrier:x.carrier??""}});
        }
      }
    });
    return field.text(fd,"kind")||"ورود اطلاعات انجام شد.";
  },{log:{action:"import",entity:kind}});
}
