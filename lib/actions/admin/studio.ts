"use server";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { toLatinDigits } from "@/lib/money";
import { parseBlocks } from "@/lib/blocks";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminRun, field, type AdminState } from "@/lib/admin/action";

const rows = z.array(z.record(z.string().max(3000))).max(200);
const title = z.string().trim().min(1).max(200);
const money = (value: string) =>
  BigInt(
    z
      .string()
      .regex(/^\d{1,17}$/)
      .parse(toLatinDigits(value).replace(/[,٬\s]/g, "")),
  ) * BigInt(10);
export async function saveStudio(id: string, _prev: AdminState, fd: FormData) {
  return adminRun("manage_store", async () => {
    const text = (key: string) => field.text(fd, key);
    const list = (key: string) => rows.parse(field.json(fd, key, []));
    const type = z.enum(["digital", "service"]).parse(text("type"));
    const variants = list("variants");
    const axes = field.lines(fd, "axes");
    if (!axes.length && variants.length)
      throw new Error("نام ویژگی را وارد کنید.");
    const options = axes.map((name, i) => ({
      name,
      values: [
        ...new Set(
          variants.map((v) =>
            title.parse(v["axis" + i] || (axes.length === 1 ? v.title : "")),
          ),
        ),
      ],
    }));
    const addons = list("addons").map((a) => ({
      id: a.id || randomUUID(),
      title: title.parse(a.title),
      description: a.description || "",
      priceRial: money(a.price).toString(),
      required: a.required === "yes",
    }));
    const briefSchema = list("briefSchema").map((q) => ({
      id: q.id || randomUUID(),
      title: title.parse(q.title),
      required: q.required === "yes",
    }));
    const data = {
      type,
      blocks: parseBlocks(field.json(fd, "blocks", [])),
      title: title.parse(text("title")),
      slug: field.slug(fd, text("slug") ? "slug" : "title"),
      categoryId: title.parse(text("categoryId")),
      sku: text("sku"),
      brand: text("brand"),
      subtitle: text("subtitle"),
      summary: text("summary"),
      description: field.text(fd, "description", 50000),
      tags: field.lines(fd, "tags"),
      turnaroundLabel: text("turnaroundLabel"),
      badge: text("badge"),
      guarantee: text("guarantee"),
      licenseNote: text("licenseNote"),
      priceRial: money(text("price")),
      compareAtRial: field.toman(fd, "compareAt"),
      saleEndsAt: field.date(fd, "saleEndsAt"),
      installments: fd.has("installments"),
      torobEnabled: fd.has("torobEnabled"),
      snappEnabled: fd.has("snappEnabled"),
      published: fd.has("published"),
      featured: fd.has("featured"),
      manageStock: false,
      images: [text("cover"), ...field.lines(fd, "gallery")].filter(Boolean),
      downloadUrl: text("downloadUrl"),
      downloadMedia: text("downloadMedia").replace(/^media:/, ""),
      downloadLimit: field.int(fd, "downloadLimit"),
      downloadDays: field.int(fd, "downloadDays"),
      seoTitle: text("seoTitle"),
      seoDescription: text("seoDescription"),
      sortOrder: field.int(fd, "sortOrder"),
      maxPerOrder: field.int(fd, "maxPerOrder"),
      options,
      addons,
      briefSchema,
      specs: list("specs"),
    };
    const product = await prisma.$transaction(async (tx) => {
      const product = id
        ? await tx.storeProduct.update({ where: { id }, data })
        : await tx.storeProduct.create({ data });
      const kept: string[] = [];
      for (const [i, v] of variants.entries()) {
        const values = Object.fromEntries(
          options.map((o, j) => [o.name, v["axis" + j] || v.title]),
        );
        const data = {
          title: title.parse(v.title),
          sku: v.sku || "",
          priceRial: money(v.price),
          compareAtRial: v.compareAt ? money(v.compareAt) : null,
          imageUrl: v.imageUrl || "",
          values,
          active: v.active !== "no",
          sortOrder: i,
        };
        const row = v.id
          ? await tx.productVariant.update({
              where: { id: v.id, productId: product.id },
              data,
            })
          : await tx.productVariant.create({
              data: { ...data, productId: product.id },
            });
        kept.push(row.id);
      }
      await tx.productVariant.updateMany({
        where: { productId: product.id, id: { notIn: kept } },
        data: { active: false },
      });
      return product;
    });
    return { redirect: "/admin/products/" + product.id };
  });
}
export async function productOperation(
  id: string,
  operation: "copy" | "publish",
  _prev: AdminState,
  fd: FormData,
) {
  return adminRun("manage_store", async () => {
    if (operation === "publish") {
      await prisma.storeProduct.update({
        where: { id },
        data: { published: fd.get("publish") === "yes" },
      });
      return;
    }
    const source = await prisma.storeProduct.findUniqueOrThrow({
      where: { id },
      include: { variants: true },
    });
    const { variants, ...data } = source;
    let slug = source.slug + "-copy";
    for (
      let i = 2;
      await prisma.storeProduct.findUnique({
        where: { slug },
        select: { id: true },
      });
      i++
    )
      slug = source.slug + "-copy-" + i;
    const copy = await prisma.storeProduct.create({
      data: {
        ...data,
        licensedPlugin: false,
        id: undefined,
        code: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        slug,
        published: false,
        title: data.title + " (کپی)",
        salesCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        blocks: data.blocks ?? Prisma.DbNull,
        images: data.images ?? [],
        options: data.options ?? [],
        tags: data.tags ?? [],
        specs: data.specs ?? [],
        addons: data.addons ?? [],
        briefSchema: data.briefSchema ?? [],
        variants: {
          create: variants.map((v) => ({
            title: v.title,
            priceRial: v.priceRial,
            compareAtRial: v.compareAtRial,
            stock: v.stock,
            sku: v.sku,
            active: v.active,
            imageUrl: v.imageUrl,
            sortOrder: v.sortOrder,
            values: v.values ?? {},
          })),
        },
      },
    });
    return { redirect: "/admin/products/" + copy.id };
  });
}
