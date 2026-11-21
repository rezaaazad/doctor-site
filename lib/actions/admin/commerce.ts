"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { adminRun, field, FieldError, snapshot, type AdminState } from "@/lib/admin/action";
import { rialToToman, tomanToRial } from "@/lib/money";
import { recordRefund, setOrderStatus } from "@/lib/store/orders";
import { adminPaymentOp } from "@/lib/payments";
import { pingTorob } from "@/lib/feeds/torob";
import { asStringArray } from "@/lib/utils";

export async function saveProductFormAction(formData: FormData) {
  await saveProductAction(null, formData);
}

export async function saveProductAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun(
    "manage_store",
    async (user) => {
      const id = field.text(formData, "id", 40);
      const slug = field.slug(formData, "slug");
      const title = field.text(formData, "title", 200);
      if (!title) throw new FieldError("title", "عنوان لازم است.");
      const categoryId = field.text(formData, "categoryId", 40);
      const price = field.toman(formData, "price");
      if (price === null) throw new FieldError("price", "قیمت لازم است.");
      const compare = field.toman(formData, "compareAt");
      const data = {
        slug,
        title,
        subtitle: field.text(formData, "subtitle", 200),
        summary: field.text(formData, "summary", 2000),
        description: field.raw(formData, "description").slice(0, 20000),
        categoryId,
        type: field.text(formData, "type", 20) || "digital",
        priceRial: price,
        compareAtRial: compare,
        saleEndsAt: field.date(formData, "saleEndsAt"),
        published: field.flag(formData, "published"),
        featured: field.flag(formData, "featured"),
        badge: field.text(formData, "badge", 40),
        sku: field.text(formData, "sku", 80),
        manageStock: field.flag(formData, "manageStock"),
        stock: field.int(formData, "stock"),
        allowBackorder: field.flag(formData, "allowBackorder"),
        installments: field.flag(formData, "installments"),
        weightGrams: field.int(formData, "weightGrams"),
        torobEnabled: field.flag(formData, "torobEnabled"),
        snappEnabled: field.flag(formData, "snappEnabled"),
        seoTitle: field.text(formData, "seoTitle", 160),
        seoDescription: field.text(formData, "seoDescription", 320),
        sortOrder: field.int(formData, "sortOrder"),
      };
      const row = id
        ? await prisma.storeProduct.update({ where: { id }, data })
        : await prisma.storeProduct.create({ data });
      await snapshot(prisma, "product", row.id, row, user.name);
      if (row.published) await pingTorob([row.id]).catch(() => undefined);
      return { ok: true, message: "محصول ذخیره شد.", redirect: `/admin/products/${row.id}` };
    },
    { log: { action: "save", entity: "product", summary: "محصول" }, revalidate: ["/store", "/admin/products"] },
  );
}

export async function deleteProductFormAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await deleteProductAction(id);
}

export async function deleteProductAction(id: string): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    await prisma.storeProduct.delete({ where: { id: id.slice(0, 40) } });
    return "محصول حذف شد.";
  }, { revalidate: ["/admin/products", "/store"] });
}

export async function saveCategoryFormAction(formData: FormData) {
  await saveCategoryAction(null, formData);
}

export async function saveCategoryAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    const id = field.text(formData, "id", 40);
    const slug = field.slug(formData, "slug");
    const data = {
      slug,
      name: field.text(formData, "name", 120),
      description: field.text(formData, "description", 2000),
      icon: field.text(formData, "icon", 8),
      featured: field.flag(formData, "featured"),
      visible: field.flag(formData, "visible"),
      sortOrder: field.int(formData, "sortOrder"),
      seoTitle: field.text(formData, "seoTitle", 160),
      seoDescription: field.text(formData, "seoDescription", 320),
      torobName: field.text(formData, "torobName", 120),
    };
    if (id) await prisma.storeCategory.update({ where: { id }, data });
    else await prisma.storeCategory.create({ data });
    return "دسته ذخیره شد.";
  }, { revalidate: ["/admin/store/categories", "/store"] });
}

export async function saveAttributeFormAction(formData: FormData) {
  await saveAttributeAction(null, formData);
}

export async function saveAttributeAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    const id = field.text(formData, "id", 40);
    const slug = field.slug(formData, "slug");
    const values = field.lines(formData, "values");
    const data = { slug, name: field.text(formData, "name", 80), values, sortOrder: field.int(formData, "sortOrder") };
    if (id) await prisma.productAttribute.update({ where: { id }, data });
    else await prisma.productAttribute.create({ data });
    return "ویژگی ذخیره شد.";
  }, { revalidate: ["/admin/store/attributes"] });
}

export async function saveCouponFormAction(formData: FormData) {
  await saveCouponAction(null, formData);
}

export async function saveCouponAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_coupons", async () => {
    const id = field.text(formData, "id", 40);
    const code = field.text(formData, "code", 40).toUpperCase();
    const amount = field.toman(formData, "amount") ?? BigInt(0);
    const data = {
      code,
      description: field.text(formData, "description", 200),
      type: field.text(formData, "type", 20) || "percent",
      amount,
      maxDiscount: field.toman(formData, "maxDiscount"),
      minSubtotal: field.toman(formData, "minSubtotal") ?? BigInt(0),
      usageLimit: field.int(formData, "usageLimit") || null,
      perCustomer: field.int(formData, "perCustomer") || null,
      active: field.flag(formData, "active"),
      expiresAt: field.date(formData, "expiresAt"),
      customerMobile: field.text(formData, "customerMobile", 20),
    };
    if (id) await prisma.coupon.update({ where: { id }, data });
    else await prisma.coupon.create({ data });
    return "کد تخفیف ذخیره شد.";
  }, { revalidate: ["/admin/coupons"] });
}

export async function saveShippingZoneFormAction(formData: FormData) {
  await saveShippingZoneAction(null, formData);
}

export async function saveShippingZoneAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    const id = field.text(formData, "id", 40);
    const name = field.text(formData, "name", 120);
    const provinces = field.lines(formData, "provinces");
    const sortOrder = field.int(formData, "sortOrder");
    const zone = id ? await prisma.shippingZone.update({ where: { id }, data: { name, provinces, sortOrder } }) : await prisma.shippingZone.create({ data: { name, provinces, sortOrder } });
    const methodTitle = field.text(formData, "methodTitle", 120);
    if (methodTitle) {
      const methodId = field.text(formData, "methodId", 40);
      const methodData = {
        zoneId: zone.id,
        title: methodTitle,
        kind: field.text(formData, "methodKind", 20) || "flat",
        costRial: field.toman(formData, "methodCost") ?? BigInt(0),
        perKgRial: field.toman(formData, "methodPerKg") ?? BigInt(0),
        freeAbove: field.toman(formData, "methodFreeAbove"),
        minDays: field.int(formData, "minDays", 1),
        maxDays: field.int(formData, "maxDays", 3),
        active: field.flag(formData, "methodActive"),
        sortOrder: field.int(formData, "methodSort"),
      };
      if (methodId) await prisma.shippingMethod.update({ where: { id: methodId }, data: methodData });
      else await prisma.shippingMethod.create({ data: methodData });
    }
    const taxName = field.text(formData, "taxName", 80);
    if (taxName) {
      const taxId = field.text(formData, "taxId", 40);
      const taxData = {
        name: taxName,
        rateBp: field.int(formData, "rateBp"),
        provinces: field.lines(formData, "taxProvinces"),
        active: field.flag(formData, "taxActive"),
        sortOrder: field.int(formData, "taxSort"),
      };
      if (taxId) await prisma.taxRate.update({ where: { id: taxId }, data: taxData });
      else await prisma.taxRate.create({ data: taxData });
    }
    return "تنظیمات حمل و مالیات ذخیره شد.";
  }, { revalidate: ["/admin/store/shipping"] });
}

export async function updateOrderFormAction(formData: FormData) {
  await updateOrderAction(null, formData);
}

export async function updateOrderAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_orders", async (user) => {
    const orderId = field.text(formData, "orderId", 40);
    const status = field.text(formData, "status", 40);
    await setOrderStatus(orderId, status, {
      authorName: user.name,
      trackingCode: field.text(formData, "trackingCode", 80),
      carrier: field.text(formData, "carrier", 80),
      note: field.text(formData, "note", 2000),
    });
    return { ok: true, message: "سفارش به‌روز شد." };
  }, { revalidate: ["/admin/orders"] });
}

export async function refundOrderFormAction(formData: FormData) {
  await refundOrderAction(null, formData);
}

export async function refundOrderAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("refund_orders", async (user) => {
    const orderId = field.text(formData, "orderId", 40);
    const amount = field.toman(formData, "amount");
    if (!amount) throw new FieldError("amount", "مبلغ لازم است.");
    await recordRefund(orderId, amount * BigInt(10), {
      method: field.text(formData, "method", 40) || "manual",
      reason: field.text(formData, "reason", 500),
      authorName: user.name,
      toWallet: field.flag(formData, "toWallet"),
    });
    return "استرداد ثبت شد.";
  }, { revalidate: ["/admin/orders"] });
}

export async function paymentOpFormAction(formData: FormData) {
  await paymentOpAction(null, formData);
}

export async function paymentOpAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("refund_orders", async () => {
    const paymentId = field.text(formData, "paymentId", 40);
    const op = field.text(formData, "op", 20) as "settle" | "revert" | "cancel" | "status";
    const message = await adminPaymentOp(paymentId, op);
    return message;
  }, { revalidate: ["/admin/orders"] });
}

export async function exportProductsCsvAction(): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    const rows = await prisma.storeProduct.findMany({ include: { category: true } });
    const header = "slug,title,category,price_toman,published,type\n";
    const body = rows
      .map((r) => [r.slug, r.title.replace(/,/g, " "), r.category.name, rialToToman(r.priceRial), r.published, r.type].join(","))
      .join("\n");
    return { ok: true, message: "خروجی آماده است.", data: header + body };
  });
}

export async function importProductsCsvFormAction(formData: FormData) {
  await importProductsCsvAction(null, formData);
}

export async function exportProductsCsvFormAction() {
  await exportProductsCsvAction();
}

export async function salesReportCsvFormAction() {
  await salesReportCsvAction();
}

export async function importProductsCsvAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_store", async () => {
    const csv = field.raw(formData, "csv");
    const lines = csv.split("\n").slice(1).filter(Boolean);
    let count = 0;
    for (const line of lines.slice(0, 500)) {
      const [slug, title, categorySlug, priceToman, published, type] = line.split(",").map((s) => s.trim());
      if (!slug || !title) continue;
      const category = await prisma.storeCategory.findFirst({ where: { slug: categorySlug || "plugins" } });
      if (!category) continue;
      await prisma.storeProduct.upsert({
        where: { slug },
        create: { slug, title, summary: title, categoryId: category.id, priceRial: tomanToRial(priceToman || "0"), published: published === "true", type: type || "digital" },
        update: { title, priceRial: tomanToRial(priceToman || "0"), published: published === "true", type: type || "digital" },
      });
      count++;
    }
    return `${count} محصول به‌روز شد.`;
  }, { revalidate: ["/admin/products", "/store"] });
}

export async function updateCustomerFormAction(formData: FormData) {
  await updateCustomerAction(null, formData);
}

export async function updateCustomerAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_customers", async () => {
    const id = field.text(formData, "id", 40);
    await prisma.customer.update({
      where: { id },
      data: {
        name: field.text(formData, "name", 120),
        email: field.text(formData, "email", 160),
        blocked: field.flag(formData, "blocked"),
        note: field.text(formData, "note", 2000),
        walletRial: tomanToRial(field.text(formData, "walletToman", 20) || "0"),
      },
    });
    return "مشتری ذخیره شد.";
  }, { revalidate: ["/admin/customers"] });
}

export async function salesReportCsvAction(): Promise<AdminState> {
  return adminRun("view_reports", async () => {
    const since = new Date(Date.now() - 30 * 86400_000);
    const orders = await prisma.order.findMany({ where: { paymentStatus: "paid", createdAt: { gte: since } }, include: { items: true } });
    const rows = orders.map((o) => `${o.number},${o.createdAt.toISOString()},${rialToToman(o.totalRial)},${o.gateway},${o.status}`).join("\n");
    return { ok: true, message: "گزارش ۳۰ روز", data: `number,date,total_toman,gateway,status\n${rows}` };
  });
}

export async function moderateCommentFormAction(formData: FormData) {
  await moderateCommentAction(null, formData);
}

export async function moderateCommentAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("moderate_comments", async () => {
    const id = field.text(formData, "id", 40);
    const status = field.text(formData, "status", 20);
    if (!["approved", "spam", "pending"].includes(status)) throw new FieldError("status", "وضعیت نامعتبر.");
    await prisma.comment.update({ where: { id }, data: { status } });
    return "نظر به‌روز شد.";
  }, { revalidate: ["/admin/comments"] });
}

export async function staffTicketReplyFormAction(formData: FormData) {
  await staffTicketReplyAction(null, formData);
}

export async function staffTicketReplyAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_tickets", async (staff) => {
    const id = field.text(formData, "id", 40);
    const body = field.text(formData, "body", 8000);
    if (!body) throw new FieldError("body", "متن لازم است.");
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new FieldError("id", "تیکت یافت نشد.");
    await prisma.$transaction([
      prisma.ticketMessage.create({ data: { ticketId: id, body, authorName: staff.name || staff.email, fromStaff: true } }),
      prisma.ticket.update({ where: { id }, data: { status: "answered", updatedAt: new Date() } }),
    ]);
    return "پاسخ ثبت شد.";
  }, { revalidate: ["/admin/tickets"] });
}

export async function updateTicketStatusFormAction(formData: FormData) {
  await updateTicketStatusAction(null, formData);
}

export async function updateTicketStatusAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  return adminRun("manage_tickets", async () => {
    const id = field.text(formData, "id", 40);
    const status = field.text(formData, "status", 20);
    if (!["open", "answered", "closed", "customer_reply"].includes(status)) throw new FieldError("status", "وضعیت نامعتبر.");
    await prisma.ticket.update({ where: { id }, data: { status, updatedAt: new Date() } });
    return "وضعیت تیکت به‌روز شد.";
  }, { revalidate: ["/admin/tickets"] });
}