"use server";
import { prisma } from "@/lib/db";
import { SECTIONS, sectionDef } from "@/lib/sections";
import { adminRun,field,FieldError,type AdminState } from "@/lib/admin/action";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
export async function saveHomepage(key:string,_prev:AdminState,fd:FormData){
  return adminRun("manage_appearance",async()=>{
    const def=sectionDef("home",key);
    if(!def||!SECTIONS.includes(def))throw new FieldError("key","بخش نامعتبر");
    const old=await prisma.section.findUnique({where:{page_key:{page:"home",key}}});
    const content={...def.defaults,...(old?.content&&typeof old.content==="object"&&!Array.isArray(old.content)?old.content:{})};
    for(const f of def.fields){
      if(f.type==="number")content[f.key]=z.coerce.number().int().min(0).max(f.max??100000).parse(field.raw(fd,f.key));
      else if(f.type==="boolean")content[f.key]=field.flag(fd,f.key);
      else if(f.type==="list")content[f.key]=z.array(z.record(z.string())).max(f.max??24).parse(field.json(fd,f.key,[]));
      else if(f.type==="select")content[f.key]=z.string().refine(v=>f.options?.some(([id])=>id===v)).parse(field.raw(fd,f.key));
      else content[f.key]=field.text(fd,f.key,20000);
    }
    const data={content:content as Prisma.InputJsonValue,visible:field.flag(fd,"visible"),sortOrder:z.coerce.number().int().min(0).max(10000).parse(field.raw(fd,"sortOrder"))};
    await prisma.section.upsert({where:{page_key:{page:"home",key}},update:data,create:{...data,page:"home",key,label:def.label}});
  },{log:{action:"save",entity:"homepage",entityId:key}});
}
