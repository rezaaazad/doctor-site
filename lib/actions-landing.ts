"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { assertSameOrigin, getSessionUser } from "@/lib/auth";

async function guard() {
  await assertSameOrigin();
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export async function saveLanding(formData: FormData) {
  await guard();
  const faqs = text(formData, "faqs").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [q, ...rest] = line.split("|");
    return { q: (q || "").trim(), a: rest.join("|").trim() };
  }).filter((item) => item.q && item.a);
  const data = {
    slug: text(formData, "slug").trim(),
    title: text(formData, "title").trim(),
    h1: text(formData, "h1").trim(),
    excerpt: text(formData, "excerpt").trim(),
    body: text(formData, "body").trim(),
    faqs,
    seoTitle: text(formData, "seoTitle").trim(),
    seoDescription: text(formData, "seoDescription").trim(),
    keywords: text(formData, "keywords").trim(),
    published: formData.get("published") === "on",
    sortOrder: Number(text(formData, "sortOrder") || "0"),
  };
  const id = text(formData, "id");
  if (id) await prisma.landingPage.update({ where: { id }, data });
  else await prisma.landingPage.create({ data });
  revalidatePath("/", "layout");
  revalidatePath(`/${data.slug}`);
  redirect("/admin/landings");
}
