"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCustomer, logoutCustomer, requireCustomer } from "@/lib/customer-auth";
import { PROVINCES } from "@/lib/iran";
import { normalizeMobile } from "@/lib/money";
import { RequestError } from "@/lib/utils";
import { recomputeProductRating } from "@/lib/store/reviews";

const trim = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function saveAccountDetailsAction(_prev: unknown, formData: FormData) {
  const customer = await requireCustomer("/account/details");
  const name = trim(formData.get("name"), 120);
  const email = trim(formData.get("email"), 160);
  const nationalCode = trim(formData.get("nationalCode"), 20).replace(/\D/g, "");
  const smsOptIn = ["1", "on", "true"].includes(String(formData.get("smsOptIn") ?? ""));
  await prisma.customer.update({
    where: { id: customer.id },
    data: { name, email, nationalCode, smsOptIn },
  });
  revalidatePath("/account", "layout");
  return { ok: true, message: "ذخیره شد." };
}

export async function saveAddressAction(_prev: unknown, formData: FormData) {
  const customer = await requireCustomer("/account/addresses");
  const id = trim(formData.get("id"), 40);
  const receiver = trim(formData.get("receiver"), 120);
  const mobile = normalizeMobile(trim(formData.get("mobile"), 20));
  const province = trim(formData.get("province"), 40);
  const city = trim(formData.get("city"), 80);
  const line = trim(formData.get("line"), 500);
  const postalCode = trim(formData.get("postalCode"), 20).replace(/\D/g, "");
  const title = trim(formData.get("title"), 60);
  const isDefault = ["1", "on", "true"].includes(String(formData.get("isDefault") ?? ""));
  if (!receiver || !mobile || !province || !city || !line) throw new RequestError("فیلدهای ستاره‌دار را پر کنید.");
  if (!(PROVINCES as readonly string[]).includes(province)) throw new RequestError("استان نامعتبر است.");
  if (isDefault) await prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
  if (id) {
    await prisma.address.updateMany({ where: { id, customerId: customer.id }, data: { receiver, mobile, province, city, line, postalCode, title, isDefault } });
  } else {
    await prisma.address.create({ data: { customerId: customer.id, receiver, mobile, province, city, line, postalCode, title, isDefault } });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "آدرس ذخیره شد." };
}

export async function deleteAddressFormAction(addressId: string) {
  await deleteAddressAction(addressId);
}

export async function deleteAddressAction(addressId: string) {
  const customer = await requireCustomer("/account/addresses");
  await prisma.address.deleteMany({ where: { id: String(addressId).slice(0, 40), customerId: customer.id } });
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function openTicketAction(_prev: unknown, formData: FormData) {
  const customer = await requireCustomer("/account/tickets");
  const subject = trim(formData.get("subject"), 160);
  const body = trim(formData.get("body"), 4000);
  const department = trim(formData.get("department"), 40) || "support";
  const orderId = trim(formData.get("orderId"), 40);
  if (subject.length < 4 || body.length < 8) throw new RequestError("موضوع و متن تیکت را کامل بنویسید.");
  const ticket = await prisma.ticket.create({
    data: {
      customerId: customer.id,
      subject,
      department,
      orderId: orderId || undefined,
      messages: { create: { body, authorName: customer.name || customer.mobile, fromStaff: false } },
    },
  });
  revalidatePath("/account/tickets");
  return { ok: true, message: "تیکت ثبت شد.", id: ticket.id };
}

export async function replyTicketFormAction(ticketId: string, formData: FormData) {
  await replyTicketAction(ticketId, null, formData);
}

export async function replyTicketAction(ticketId: string, _prev: unknown, formData: FormData) {
  const customer = await requireCustomer(`/account/tickets/${ticketId}`);
  const body = trim(formData.get("body"), 4000);
  if (body.length < 2) throw new RequestError("پیام خالی است.");
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, customerId: customer.id } });
  if (!ticket || ticket.status === "closed") throw new RequestError("این تیکت بسته شده است.");
  await prisma.$transaction([
    prisma.ticketMessage.create({ data: { ticketId, body, authorName: customer.name || customer.mobile, fromStaff: false } }),
    prisma.ticket.update({ where: { id: ticketId }, data: { status: "customer_reply", updatedAt: new Date() } }),
  ]);
  revalidatePath(`/account/tickets/${ticketId}`);
  return { ok: true };
}

export async function submitProductReviewAction(_prev: unknown, formData: FormData) {
  const customer = await requireCustomer("/account/reviews");
  const productId = trim(formData.get("productId"), 40);
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
  const body = trim(formData.get("body"), 2000);
  if (!productId || !rating) throw new RequestError("محصول و امتیاز لازم است.");
  const product = await prisma.storeProduct.findUnique({ where: { id: productId }, select: { id: true, published: true } });
  if (!product?.published) throw new RequestError("محصول نامعتبر است.");
  const paid = await prisma.orderItem.findFirst({
    where: { productId, order: { customerId: customer.id, paymentStatus: "paid" } },
    select: { id: true },
  });
  if (!paid) throw new RequestError("فقط بعد از خرید می‌توانید نظر بدهید.");
  await prisma.comment.create({
    data: {
      targetType: "product",
      targetId: productId,
      customerId: customer.id,
      name: customer.name || customer.mobile,
      body,
      rating,
      status: "pending",
      verified: true,
    },
  });
  await recomputeProductRating(productId);
  revalidatePath("/account/reviews");
  return { ok: true, message: "نظر شما پس از بررسی نمایش داده می‌شود." };
}

export async function markNotificationsReadAction(ids: string[]) {
  const customer = await requireCustomer("/account/notifications");
  const clean = ids.map((id) => String(id).slice(0, 40)).filter(Boolean);
  if (!clean.length) return { ok: true };
  await prisma.notification.updateMany({ where: { id: { in: clean }, customerId: customer.id }, data: { readAt: new Date() } });
  revalidatePath("/account/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const customer = await requireCustomer("/account/notifications");
  await prisma.notification.updateMany({ where: { customerId: customer.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/account/notifications");
}

export async function markAllNotificationsReadFormAction() {
  await markAllNotificationsReadAction();
}

export async function logoutAccountAction() {
  await logoutCustomer();
  redirect("/");
}

export async function accountDashboardData() {
  const customer = await getCustomer();
  if (!customer) return null;
  const [orders, unread, tickets, wishlist, downloads] = await Promise.all([
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.notification.count({ where: { customerId: customer.id, readAt: null } }),
    prisma.ticket.count({ where: { customerId: customer.id, status: { in: ["open", "answered"] } } }),
    prisma.wishlistItem.count({ where: { customerId: customer.id } }),
    prisma.downloadGrant.count({ where: { order: { customerId: customer.id }, remaining: { gt: 0 } } }),
  ]);
  return { orders, unread, tickets, wishlist, downloads, wallet: Number(customer.walletRial) };
}