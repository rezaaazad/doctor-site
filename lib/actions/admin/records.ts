"use server";
import { prisma } from "@/lib/db";
import { adminRun, field, FieldError, type AdminState } from "@/lib/admin/action";
import { addOrderNote, setOrderStatus, recordRefund } from "@/lib/store/orders";
import { z } from "zod";
import type { Capability } from "@/lib/roles";

export async function manageRecord(kind:string,id:string,_prev:AdminState,fd:FormData){
  const caps:Record<string,Capability>={orderStatus:"manage_orders",note:"manage_orders",refund:"refund_orders",comment:"moderate_comments",customer:"manage_customers",staffRole:"manage_users"};
  if(!Object.hasOwn(caps,kind)) return {ok:false,message:"عملیات نامعتبر"};
  return adminRun(caps[kind],async user=>{
    const body=field.text(fd,"body");
    switch(kind){
      case "orderStatus": {
        const status=z.enum(["pending","on_hold","processing","shipped","delivered","completed","cancelled","failed"]).parse(field.raw(fd,"status"));
        await setOrderStatus(id,status,{authorName:user.name});break;
      }
      case "note": await addOrderNote(id,z.string().min(1).parse(body),{authorName:user.name});break;
      case "refund": {
        if(!field.flag(fd,"confirmed")||!body)throw new FieldError("confirmed","تأیید بازپرداخت و دلیل لازم است.");
        const amount=field.toman(fd,"amount");
        if(!amount||amount<=BigInt(0))throw new FieldError("amount","مبلغ نامعتبر");
        await recordRefund(id,amount,{method:"manual",reason:body,authorName:user.name});break;
      }
      case "comment": await prisma.comment.update({where:{id},data:{status:z.enum(["pending","approved","spam","trash"]).parse(field.raw(fd,"status"))}});break;
      case "customer": await prisma.customer.update({where:{id},data:{note:body,blocked:field.flag(fd,"blocked")}});break;
      case "staffRole": {
        if(id===user.id)throw new FieldError("role","نقش حساب خودتان را نمی‌توانید تغییر دهید.");
        await prisma.adminUser.update({where:{id},data:{role:z.enum(["admin","editor","shop_manager","support"]).parse(field.raw(fd,"role"))}});
        break;
      }
    }
  },{log:{action:kind,entity:kind,entityId:id}});
}
