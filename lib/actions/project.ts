"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { adminRun, type AdminState } from "@/lib/admin/action";
import {
  briefOwner,
  briefAnswers,
  questions,
  stages,
} from "@/lib/store/project";

export async function submitBrief(number: number, key: string, data: FormData) {
  const customer = await getCustomer();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { number },
      include: {
        items: { include: { product: { select: { briefSchema: true } } } },
      },
    });
    if (
      !order ||
      !briefOwner(order, customer?.id, key) ||
      order.paymentStatus !== "paid" ||
      !order.items.some((i) => i.type === "service")
    )
      throw new Error("سفارش در دسترس نیست.");
    const answers = briefAnswers(questions(order.items), data);
    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        projectStage: "awaiting_brief",
        briefSubmittedAt: null,
        paymentStatus: "paid",
      },
      data: {
        projectBrief: { answers },
        briefSubmittedAt: new Date(),
        projectStage: "kickoff",
      },
    });
    if (updated.count)
      await tx.orderNote.create({
        data: {
          orderId: order.id,
          body: "بریف پروژه تکمیل شد.",
          system: true,
          toCustomer: true,
        },
      });
  });
  revalidatePath("/account/orders", "layout");
  revalidatePath("/checkout/result", "layout");
}
export async function milestone(id: string, _prev: AdminState, fd: FormData) {
  return adminRun("manage_orders", async (user) => {
    const stage = String(fd.get("stage"));
    if (stage === "awaiting_brief" || !Object.hasOwn(stages, stage))
      throw new Error("مرحله نامعتبر");
    const body = String(fd.get("body") || "")
      .trim()
      .slice(0, 2000);
    await prisma.order.update({
      where: {
        id,
        paymentStatus: "paid",
        briefSubmittedAt: { not: null },
        items: { some: { type: "service" } },
      },
      data: {
        projectStage: stage,
        status: stage === "delivered" ? "completed" : "processing",
        notes: {
          create: {
            body: body || stages[stage as keyof typeof stages],
            authorName: user.name,
            toCustomer: true,
          },
        },
      },
    });
  });
}
