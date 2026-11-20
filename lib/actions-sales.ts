"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isRedirectError, RequestError } from "@/lib/utils";
import { blogSchema, faqSchema, logoSchema, packageSchema, processSchema, statSchema } from "@/lib/validators";

type ActionState = { ok: boolean; message: string } | null;

async function guard() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  await assertSameOrigin();
  return user;
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function flag(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "1" || value === "on" || value === "true";
}

function lines(formData: FormData, name: string) {
  return text(formData, name).split("\n").map((line) => line.trim()).filter(Boolean);
}

function fail(error: unknown): ActionState {
  if (isRedirectError(error)) throw error;
  if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message || "داده نامعتبر است." };
  if (error instanceof RequestError) return { ok: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, message: "این مقدار تکراری است." };
  }
  console.error(error);
  return { ok: false, message: "ذخیره نشد." };
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function savePackage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = packageSchema.parse({
      name: text(formData, "name"),
      price: text(formData, "price"),
      summary: text(formData, "summary"),
      features: lines(formData, "features"),
      highlighted: flag(formData, "highlighted"),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.package.update({ where: { id }, data });
    else await prisma.package.create({ data });
    refresh();
    return { ok: true, message: "تعرفه ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePackage(id: string) {
  await guard();
  await prisma.package.delete({ where: { id } });
  refresh();
}

export async function saveStep(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = processSchema.parse({
      number: text(formData, "number"),
      title: text(formData, "title"),
      body: text(formData, "body"),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.processStep.update({ where: { id }, data });
    else await prisma.processStep.create({ data });
    refresh();
    return { ok: true, message: "مرحله ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteStep(id: string) {
  await guard();
  await prisma.processStep.delete({ where: { id } });
  refresh();
}

export async function saveStat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = statSchema.parse({
      value: text(formData, "value"),
      label: text(formData, "label"),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.stat.update({ where: { id }, data });
    else await prisma.stat.create({ data });
    refresh();
    return { ok: true, message: "عدد ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteStat(id: string) {
  await guard();
  await prisma.stat.delete({ where: { id } });
  refresh();
}

export async function saveLogo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = logoSchema.parse({
      name: text(formData, "name"),
      imageUrl: text(formData, "imageUrl").trim(),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.clientLogo.update({ where: { id }, data });
    else await prisma.clientLogo.create({ data });
    refresh();
    return { ok: true, message: "لوگو ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteLogo(id: string) {
  await guard();
  await prisma.clientLogo.delete({ where: { id } });
  refresh();
}

export async function saveFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = faqSchema.parse({
      question: text(formData, "question"),
      answer: text(formData, "answer"),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.faq.update({ where: { id }, data });
    else await prisma.faq.create({ data });
    refresh();
    return { ok: true, message: "پرسش ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteFaq(id: string) {
  await guard();
  await prisma.faq.delete({ where: { id } });
  refresh();
}

export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guard();
    const data = blogSchema.parse({
      slug: text(formData, "slug").trim().toLowerCase(),
      title: text(formData, "title"),
      excerpt: text(formData, "excerpt"),
      body: text(formData, "body"),
      coverUrl: text(formData, "coverUrl").trim(),
      published: flag(formData, "published"),
      seoTitle: text(formData, "seoTitle"),
      seoDescription: text(formData, "seoDescription"),
    });
    const id = text(formData, "id");
    if (id) {
      await prisma.blogPost.update({ where: { id }, data });
      refresh();
      return { ok: true, message: "یادداشت ذخیره شد." };
    }
    const created = await prisma.blogPost.create({ data });
    refresh();
    redirect(`/admin/blog/${created.id}`);
  } catch (error) {
    return fail(error);
  }
}

export async function deletePost(id: string) {
  await guard();
  await prisma.blogPost.delete({ where: { id } });
  refresh();
  redirect("/admin/blog");
}
