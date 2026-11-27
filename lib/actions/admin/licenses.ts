"use server";
import { prisma } from "@/lib/db";
import {
  adminRun,
  field,
  FieldError,
  type AdminState,
} from "@/lib/admin/action";
import { tiers } from "@/lib/licenses/domain";
export async function createPluginProduct(_prev: AdminState, fd: FormData) {
  return adminRun(
    "manage_store",
    async () => {
      const existing = await prisma.storeProduct.findFirst({
        where: { licensedPlugin: true },
      });
      if (existing) return { redirect: "/admin/products/" + existing.id };
      const names = ["شروع", "حرفه‌ای", "کسب‌وکار"];
      const prices = [990000, 2990000, 6990000].map((p) => BigInt(p * 10));
      const product = await prisma.storeProduct.create({
        data: {
          categoryId: field.text(fd, "category"),
          slug: "smart-commerce-assistant",
          title: "دستیار هوشمند مدیر فروشگاه ووکامرس",
          type: "digital",
          licensedPlugin: true,
          priceRial: prices[0],
          published: false,
          summary: "گفت‌وگو با مدیر و تحلیل فروش ووکامرس",
          description:
            "شروع: گفت‌وگوی متنی، مقایسه فروش و پیش‌نویس توضیح محصول. حرفه‌ای: امکانات شروع، ساخت کوپن با تأیید مدیر، یادآوری پرداخت، ثبت هزینه و گزارش حاشیه سود. کسب‌وکار: امکانات حرفه‌ای، برآورد تقاضا، یادآوری زمان‌بندی‌شده و گزارش چند فروشگاه.",
          options: [{ name: "پلن", values: names }],
          variants: {
            create: tiers.map((tier, i) => ({
              title: names[i],
              values: { پلن: names[i] },
              priceRial: prices[i],
              pluginTier: tier,
              pluginDays: 365,
              sortOrder: i,
            })),
          },
        },
      });
      return { redirect: "/admin/products/" + product.id };
    },
    { log: { action: "create", entity: "licensed-product" } },
  );
}
export async function configurePlugin(_prev: AdminState, fd: FormData) {
  return adminRun(
    "manage_store",
    async () => {
      const productId = field.text(fd, "product");
      await prisma.$transaction(async (tx) => {
        const product = await tx.storeProduct.findUniqueOrThrow({
          where: { id: productId, type: "digital" },
          include: { variants: true },
        });
        const ids = tiers.map((t) => field.text(fd, t));
        if (
          new Set(ids).size !== 3 ||
          ids.some(
            (id) => !product.variants.some((v) => v.id === id && v.active),
          )
        )
          throw new FieldError(
            "product",
            "سه تنوع فعال و متفاوت از همین محصول انتخاب کنید.",
          );
        if (product.variants.some((v) => v.active && !ids.includes(v.id)))
          throw new FieldError(
            "product",
            "تنوع‌های اضافی را ابتدا غیرفعال کنید.",
          );
        await tx.storeProduct.update({
          where: { id: productId },
          data: { licensedPlugin: true },
        });
        await tx.productVariant.updateMany({
          where: { productId },
          data: { pluginTier: "" },
        });
        for (const [i, t] of tiers.entries()) {
          const days = Number(fd.get(t + "Days"));
          if (!Number.isInteger(days) || days < 1 || days > 3650)
            throw new FieldError(
              t + "Days",
              "مدت باید بین ۱ تا ۳۶۵۰ روز باشد.",
            );
          await tx.productVariant.update({
            where: { id: ids[i] },
            data: { pluginTier: t, pluginDays: days },
          });
        }
      });
    },
    {
      log: {
        action: "configure",
        entity: "licensed-product",
        entityId: field.text(fd, "product"),
      },
    },
  );
}
export async function licenseOperation(
  id: string,
  _prev: AdminState,
  fd: FormData,
) {
  return adminRun(
    "manage_orders",
    async (user) => {
      const reason = field.text(fd, "reason", 500);
      if (!reason) throw new FieldError("reason", "دلیل عملیات را وارد کنید.");
      const op = field.text(fd, "op");
      if (!["rebuild", "block"].includes(op))
        throw new FieldError("op", "عملیات نامعتبر");
      await prisma.pluginLicense.update({
        where: { id, ...(op === "rebuild" ? { blocked: "" } : {}) },
        data: {
          ...(op === "block"
            ? { blocked: reason, lease: "" }
            : {
                state: "pending",
                lease: "",
                attempts: 0,
                nextAttempt: new Date(),
                error: "",
              }),
          events: {
            create: {
              body:
                user.name +
                " · " +
                (op === "block" ? "توقف تحویل" : "درخواست بازسازی") +
                " · " +
                reason,
            },
          },
        },
      });
    },
    {
      log: {
        action: field.text(fd, "op"),
        entity: "plugin-license",
        entityId: id,
        summary: field.text(fd, "reason", 500),
      },
    },
  );
}
