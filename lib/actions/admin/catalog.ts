"use server";
import { prisma } from "@/lib/db";
import { adminRun, field, FieldError, type AdminState } from "@/lib/admin/action";
import { z } from "zod";

export async function saveCatalog(kind: string, id: string, _prev: AdminState, fd: FormData) {
  const cap = kind === "coupons" ? "manage_coupons" : "manage_store";
  return adminRun(cap, async () => {
    const name = (key: string) => z.string().trim().min(1).max(200).parse(field.raw(fd, key));
    const int = (key: string) => z.coerce.number().int().min(0).max(2147483647).parse(field.raw(fd, key));
    const money = (key: string) => { const v = field.toman(fd,key); if(v === null || v > BigInt("9223372036854775807")) throw new FieldError(key,"مبلغ نامعتبر"); return v; };
    if (kind === "products") {
      const data = { title:name("title"), slug:field.slug(fd,"slug"), summary:field.text(fd,"summary"), description:field.text(fd,"description",50000), categoryId:name("categoryId"), type:z.enum(["digital","service"]).parse(field.raw(fd,"type")), priceRial:money("price"), sku:field.text(fd,"sku"), stock:int("stock"), lowStockAt:int("lowStockAt"), manageStock:field.flag(fd,"manageStock"), published:field.flag(fd,"published"), featured:field.flag(fd,"featured"), images:field.lines(fd,"images"), seoTitle:field.text(fd,"seoTitle"), seoDescription:field.text(fd,"seoDescription"), torobEnabled:field.flag(fd,"torobEnabled"), snappEnabled:field.flag(fd,"snappEnabled"), installments:field.flag(fd,"installments") };
      if(id) await prisma.storeProduct.update({where:{id},data}); else await prisma.storeProduct.create({data});
    } else if(kind === "categories"){
      const data={name:name("name"),slug:field.slug(fd,"slug"),description:field.text(fd,"description"),imageUrl:field.text(fd,"imageUrl"),torobName:field.text(fd,"torobName"),visible:field.flag(fd,"visible")};
      if(id) await prisma.storeCategory.update({where:{id},data}); else await prisma.storeCategory.create({data});
    } else if(kind === "attributes"){
      const data={name:name("name"),slug:field.slug(fd,"slug"),values:field.lines(fd,"values")};
      if(id) await prisma.productAttribute.update({where:{id},data}); else await prisma.productAttribute.create({data});
    } else if(kind === "variants"){
      const data={productId:name("productId"),title:name("title"),sku:field.text(fd,"sku"),priceRial:money("price"),stock:int("stock"),values:z.record(z.string()).parse(field.json(fd,"values",{})),active:field.flag(fd,"active")};
      if(id) await prisma.productVariant.update({where:{id},data}); else await prisma.productVariant.create({data});
    } else if(kind === "coupons"){
      const type=z.enum(["percent","fixed"]).parse(field.raw(fd,"type"));
      const data={code:name("code").toUpperCase(),type,amount:type==="percent"?BigInt(z.coerce.number().int().min(1).max(100).parse(field.raw(fd,"amount"))):money("amount"),minSubtotal:money("minSubtotal"),active:field.flag(fd,"active"),expiresAt:field.date(fd,"expiresAt")};
      if(id) await prisma.coupon.update({where:{id},data}); else await prisma.coupon.create({data});
    } else if(kind==="zones"){
      const data={name:name("name"),provinces:field.lines(fd,"provinces")};
      if(id) await prisma.shippingZone.update({where:{id},data}); else await prisma.shippingZone.create({data});
    } else if(kind==="methods"){
      const data={zoneId:name("zoneId"),title:name("title"),kind:z.enum(["flat","per_kg","courier"]).parse(field.raw(fd,"kind")),costRial:money("cost"),perKgRial:money("perKg"),active:field.flag(fd,"active")};
      if(id) await prisma.shippingMethod.update({where:{id},data}); else await prisma.shippingMethod.create({data});
    } else if(kind==="taxes"){
      const data={name:name("name"),rateBp:z.coerce.number().int().min(0).max(10000).parse(field.raw(fd,"rateBp")),provinces:field.lines(fd,"provinces"),appliesTo:z.enum(["all","digital","physical","service"]).parse(field.raw(fd,"appliesTo")),active:field.flag(fd,"active")};
      if(id) await prisma.taxRate.update({where:{id},data}); else await prisma.taxRate.create({data});
    } else throw new FieldError("kind","نوع نامعتبر");
  },{log:{action:"save",entity:kind,entityId:id}});
}
