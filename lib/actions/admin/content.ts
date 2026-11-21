"use server";
import { prisma } from "@/lib/db";
import { adminRun, field, snapshot, FieldError, type AdminState } from "@/lib/admin/action";
import { parseBlocks, plainText } from "@/lib/blocks";
import { cropMedia } from "@/lib/media";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

export async function saveEditorial(kind:"post"|"page",id:string,_prev:AdminState,fd:FormData){
  return adminRun("publish_content",async user=>{
    const title=z.string().trim().min(1).max(250).parse(field.raw(fd,"title"));
    const blocks=parseBlocks(field.json(fd,"blocks",[]));
    const status=z.enum(["draft","published","scheduled"]).parse(field.raw(fd,"status"));
    const date=field.date(fd,"publishAt");
    if(status==="scheduled"&&(!date||date<=new Date()))throw new FieldError("publishAt","زمان انتشار باید در آینده باشد.");
    const body=blocks.map(b=>b.type==="heading"?"#".repeat(b.level)+" "+b.text:plainText([b])).filter(Boolean).join("\n\n");
    const common={title,slug:field.slug(fd,"slug"),excerpt:field.text(fd,"excerpt"),body,blocks:blocks as Prisma.InputJsonValue,seoTitle:field.text(fd,"seoTitle"),seoDescription:field.text(fd,"seoDescription")};
    return prisma.$transaction(async tx=>{
      if(kind==="post"){
        const data={...common,status:status==="scheduled"?"published":status,published:status!=="draft",publishedAt:status==="scheduled"?date!:date??new Date(),coverUrl:field.text(fd,"coverUrl"),authorName:user.name,terms:{set:field.lines(fd,"terms").map(id=>({id}))}};
        if(id){const old=await tx.blogPost.findUniqueOrThrow({where:{id},include:{terms:true}});await snapshot(tx,"post",id,old,user.name);await tx.blogPost.update({where:{id},data});}
        else {const {terms,...rest}=data;const row=await tx.blogPost.create({data:{...rest,terms:{connect:terms.set}}});return {redirect:"/admin/blog/"+row.id};}
      }else{
        const data={...common,h1:field.text(fd,"h1")||title,status,published:status==="published",publishAt:status==="scheduled"?date:null};
        if(id){const old=await tx.landingPage.findUniqueOrThrow({where:{id}});await snapshot(tx,"page",id,old,user.name);await tx.landingPage.update({where:{id},data});}
        else {const row=await tx.landingPage.create({data});return {redirect:"/admin/landings/"+row.id};}
      }
    });
  },{log:{action:"save",entity:kind,entityId:id}});
}
export async function saveTerm(id:string,_prev:AdminState,fd:FormData){
  return adminRun("manage_content",async()=>{
    const data={name:z.string().min(1).max(150).parse(field.raw(fd,"name")),slug:field.slug(fd,"slug"),taxonomy:z.enum(["category","tag"]).parse(field.raw(fd,"taxonomy")),description:field.text(fd,"description")};
    if(id)await prisma.term.update({where:{id},data});else await prisma.term.create({data});
  },{log:{action:"save",entity:"term",entityId:id}});
}
export async function cropImage(id:string,_prev:AdminState,fd:FormData){
  return adminRun("manage_media",async()=>{
    const number=(key:string,min:number)=>z.coerce.number().int().min(min).max(20000).parse(field.raw(fd,key));
    await cropMedia(id,{x:number("x",0),y:number("y",0),width:number("width",1),height:number("height",1)});
    return "نسخه برش‌خورده ایجاد شد.";
  },{log:{action:"crop",entity:"media",entityId:id}});
}

export async function restoreEditorial(revisionId:string){
  return adminRun("publish_content",async user=>{
    await prisma.$transaction(async tx=>{
      const revision=await tx.revision.findUniqueOrThrow({where:{id:revisionId}});
      const r=z.object({title:z.string(),slug:z.string(),excerpt:z.string(),body:z.string(),seoTitle:z.string(),seoDescription:z.string(),blocks:z.unknown().optional()}).parse(revision.data);
      const data={title:r.title,slug:r.slug,excerpt:r.excerpt,body:r.body,seoTitle:r.seoTitle,seoDescription:r.seoDescription,blocks:parseBlocks(r.blocks) as Prisma.InputJsonValue};
      if(revision.entityType==="post"){
        const old=await tx.blogPost.findUniqueOrThrow({where:{id:revision.entityId},include:{terms:true}});
        await snapshot(tx,"post",old.id,old,user.name);
        await tx.blogPost.update({where:{id:old.id},data:{...data,status:"draft",published:false}});
      }else if(revision.entityType==="page"){
        const old=await tx.landingPage.findUniqueOrThrow({where:{id:revision.entityId}});
        await snapshot(tx,"page",old.id,old,user.name);
        await tx.landingPage.update({where:{id:old.id},data:{...data,status:"draft",published:false,publishAt:null}});
      }else throw new FieldError("revision","نسخه نامعتبر");
    });
    return "محتوا به صورت پیش‌نویس بازیابی شد.";
  },{log:{action:"restore",entity:"revision",entityId:revisionId}});
}
