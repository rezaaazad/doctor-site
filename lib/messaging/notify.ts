import { after } from "next/server";
import { prisma } from "@/lib/db";
import { getGroup } from "@/lib/options";
import { formatToman, toFaDigits } from "@/lib/money";
import { siteUrl } from "@/lib/utils";
import { statusLabel } from "@/lib/store/status";
import { adminEmails, sendEmail, sendTelegram } from "@/lib/messaging/channels";
import { adminMobiles, sendSms } from "@/lib/messaging/sms";
import { renderTemplate } from "@/lib/messaging/templates";

type Flags = Record<string, boolean>;
type Templates = Record<string, string>;

/** Runs side effects after the response is sent. Falls back to a detached promise outside a request. */
export function defer(task: () => Promise<unknown>) {
  const run = () => task().catch((error) => console.error("deferred task failed", error));
  try {
    after(run);
  } catch {
    void run();
  }
}

async function context() {
  const [flags, templates, settings] = await Promise.all([
    getGroup("notify") as Promise<unknown> as Promise<Flags>,
    getGroup("templates") as Promise<unknown> as Promise<Templates>,
    prisma.siteSettings.findUnique({ where: { id: "default" }, select: { siteName: true } }),
  ]);
  return { flags, templates, site: settings?.siteName || "دکتر سایت" };
}

export async function notifyLead(leadId: string) {
  const lead = await prisma.contactMessage.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const { flags, templates, site } = await context();
  const vars = {
    site,
    name: lead.name,
    mobile: lead.phone,
    subject: [lead.projectType, lead.budget, lead.subject].filter(Boolean).join(" · "),
    link: `${siteUrl()}/admin/leads/${lead.id}`,
  };
  const text = renderTemplate(templates.adminLead, vars);
  const jobs: Promise<unknown>[] = [];
  if (flags.leadTelegram) jobs.push(sendTelegram(`${text}\n\n${lead.message}`.slice(0, 3500)));
  if (flags.leadEmail) jobs.push(adminEmails().then((to) => sendEmail(to, renderTemplate(templates.emailLeadSubject, vars), `${text}\n\n${lead.message}\n${lead.email}`)));
  if (flags.leadSms) jobs.push(adminMobiles().then((list) => Promise.all(list.map((to) => sendSms(to, text)))));
  await Promise.allSettled(jobs);
}

async function orderVars(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  const { flags, templates, site } = await context();
  const vars = {
    site,
    name: order.name,
    mobile: order.mobile,
    number: toFaDigits(order.number),
    total: formatToman(order.totalRial),
    status: statusLabel(order.status),
    tracking: order.trackingCode,
    carrier: order.carrier,
    link: `${siteUrl()}/account/orders/${order.number}?k=${order.accessKey}`,
  };
  return { order, flags, templates, vars };
}

export async function pushCustomerNotification(customerId: string | null | undefined, title: string, body: string, href = "") {
  if (!customerId) return;
  await prisma.notification.create({ data: { customerId, title, body, href } }).catch(() => undefined);
}

export async function notifyOrderPaid(orderId: string) {
  const ctx = await orderVars(orderId);
  if (!ctx) return;
  const { order, flags, templates, vars } = ctx;
  const adminText = renderTemplate(templates.adminOrder, { ...vars, link: `${siteUrl()}/admin/orders/${order.id}` });
  const jobs: Promise<unknown>[] = [];
  if (flags.orderTelegram) jobs.push(sendTelegram(adminText));
  if (flags.orderEmail) jobs.push(adminEmails().then((to) => sendEmail(to, renderTemplate(templates.emailOrderSubject, vars), adminText)));
  if (flags.orderSmsAdmin) jobs.push(adminMobiles().then((list) => Promise.all(list.map((to) => sendSms(to, adminText)))));
  if (flags.orderSmsCustomer) jobs.push(sendSms(order.mobile, renderTemplate(templates.orderPaid, vars)));
  jobs.push(pushCustomerNotification(order.customerId, `سفارش ${vars.number} ثبت شد`, `مبلغ ${vars.total} پرداخت شد.`, `/account/orders/${order.number}`));
  await Promise.allSettled(jobs);
}

export async function notifyOrderStatus(orderId: string) {
  const ctx = await orderVars(orderId);
  if (!ctx) return;
  const { order, flags, templates, vars } = ctx;
  const template = order.status === "shipped" && order.trackingCode ? templates.orderShipped : templates.orderStatus;
  const jobs: Promise<unknown>[] = [pushCustomerNotification(order.customerId, `سفارش ${vars.number}: ${vars.status}`, order.trackingCode ? `کد رهگیری: ${order.trackingCode}` : "", `/account/orders/${order.number}`)];
  if (flags.statusSmsCustomer) jobs.push(sendSms(order.mobile, renderTemplate(template, vars)));
  await Promise.allSettled(jobs);
}

export async function notifyTicket(ticketId: string, fromStaff: boolean) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { customer: true } });
  if (!ticket) return;
  const { flags, templates, site } = await context();
  const vars = { site, number: toFaDigits(ticket.number), subject: ticket.subject, name: ticket.customer.name || ticket.customer.mobile };
  if (fromStaff) {
    await pushCustomerNotification(ticket.customerId, `پاسخ تیکت ${vars.number}`, ticket.subject, `/account/tickets/${ticket.number}`);
    if (flags.ticketSmsCustomer) await sendSms(ticket.customer.mobile, renderTemplate(templates.ticketReply, { ...vars, link: `${siteUrl()}/account/tickets/${ticket.number}` }));
  } else if (flags.ticketTelegram) {
    await sendTelegram(renderTemplate(templates.adminTicket, { ...vars, link: `${siteUrl()}/admin/tickets/${ticket.id}` }));
  }
}
