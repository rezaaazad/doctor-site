"use server";
import { guardAction } from "@/lib/auth";

import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import {
  assertRateLimit,
  assertSameOrigin,
  clearFailures,
  clientIp,
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  recordFailure,
  safeNext,
  verifyPassword,
} from "@/lib/auth";
import { SECTION_FORMS } from "@/lib/section-forms";
import { asObject, assertPlainContent, isRedirectError, RequestError } from "@/lib/utils";
import {
  appearanceSchema,
  contactSchema,
  heroSchema,
  menuSchema,
  passwordChangeSchema,
  profileSchema,
  projectSchema,
  seoSchema,
  serviceSchema,
  testimonialSchema,
  userSchema,
} from "@/lib/validators";

export type ActionState = { ok: boolean; message: string; url?: string } | null;

async function guard() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  await assertSameOrigin();
  return user;
}

function fail(error: unknown): ActionState {
  if (isRedirectError(error)) throw error;
  if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message || "داده نامعتبر است." };
  if (error instanceof RequestError) return { ok: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, message: "این مقدار تکراری است." };
  }
  console.error(error);
  return { ok: false, message: "ذخیره نشد. دوباره تلاش کنید." };
}

function flag(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "1" || value === "on" || value === "true";
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function refresh() {
  revalidatePath("/", "layout");
}

function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

function looksLikeImage(buf: Buffer, mime: string) {
  if (buf.length < 12) return false;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/gif") return buf.subarray(0, 4).toString("ascii") === "GIF8";
  if (mime === "image/webp") return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return buf.subarray(4, 8).toString("ascii") === "ftyp";
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") return buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00;
  return false;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email").trim().toLowerCase();
  const password = text(formData, "password");
  const next = safeNext(text(formData, "next"));
  try {
    const ip = await clientIp();
    await assertRateLimit(ip);
    const user = await verifyPassword(email, password);
    if (!user) {
      await recordFailure(ip);
      return { ok: false, message: "ایمیل یا رمز عبور نادرست است." };
    }
    await clearFailures(ip);
    await createSession(user.id);
  } catch (error) {
    return fail(error);
  }
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function updateAppearance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_appearance");
    const data = appearanceSchema.parse({
      accentColor: text(formData, "accentColor"),
      backgroundColor: text(formData, "backgroundColor"),
      surfaceColor: text(formData, "surfaceColor"),
      textColor: text(formData, "textColor"),
      mutedColor: text(formData, "mutedColor"),
      fontFamily: text(formData, "fontFamily"),
      logoUrl: text(formData, "logoUrl").trim(),
      faviconUrl: text(formData, "faviconUrl").trim(),
      cursorEnabled: flag(formData, "cursorEnabled"),
      smoothScroll: flag(formData, "smoothScroll"),
      animationsEnabled: flag(formData, "animationsEnabled"),
      grainEnabled: flag(formData, "grainEnabled"),
      webglEnabled: flag(formData, "webglEnabled"),
    });
    await prisma.siteSettings.update({ where: { id: "default" }, data });
    refresh();
    return { ok: true, message: "ظاهر ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function updateHero(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_appearance");
    const data = heroSchema.parse({
      heroShape: text(formData, "heroShape"),
      heroColorA: text(formData, "heroColorA"),
      heroColorB: text(formData, "heroColorB"),
      heroSpeed: Number(text(formData, "heroSpeed")),
      heroParticles: Number(text(formData, "heroParticles")),
      heroWords: text(formData, "heroWords"),
    });
    await prisma.siteSettings.update({ where: { id: "default" }, data });
    refresh();
    return { ok: true, message: "تنظیم صحنه ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_settings");
    const data = profileSchema.parse({
      siteName: text(formData, "siteName"),
      tagline: text(formData, "tagline"),
      description: text(formData, "description"),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      address: text(formData, "address"),
      hours: text(formData, "hours"),
      footerNote: text(formData, "footerNote"),
      copyright: text(formData, "copyright"),
      newsletterTitle: text(formData, "newsletterTitle"),
      enamadHtml: text(formData, "enamadHtml"),
      available: flag(formData, "available"),
      instagram: text(formData, "instagram").trim(),
      telegram: text(formData, "telegram").trim(),
      linkedin: text(formData, "linkedin").trim(),
      github: text(formData, "github").trim(),
      whatsapp: text(formData, "whatsapp").trim(),
    });
    const { instagram, telegram, linkedin, github, whatsapp, ...rest } = data;
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { ...rest, socials: { instagram, telegram, linkedin, github, whatsapp } },
    });
    refresh();
    return { ok: true, message: "هویت و تماس ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_appearance");
    const id = text(formData, "id");
    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "بخش پیدا نشد." };
    const visible = flag(formData, "visible");
    let content: unknown;
    if (text(formData, "mode") === "raw") {
      content = JSON.parse(text(formData, "raw") || "{}");
      assertPlainContent(content);
    } else {
      const base = asObject(existing.content);
      const form = SECTION_FORMS[existing.key];
      const next: Record<string, unknown> = { ...base };
      const en = asObject(base.en);
      for (const field of form?.fields ?? []) {
        if (field.type === "text" || field.type === "textarea") {
          next[field.name] = text(formData, `fa_${field.name}`);
          const enValue = text(formData, `en_${field.name}`).trim();
          if (enValue) en[field.name] = enValue;
          else delete en[field.name];
        } else if (field.type === "lines") {
          next[field.name] = text(formData, `fa_${field.name}`)
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          const enLines = text(formData, `en_${field.name}`)
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          if (enLines.length) en[field.name] = enLines;
          else delete en[field.name];
        } else {
          const readPairs = (prefix: string) => {
            const items = [];
            for (let i = 0; i < 4; i += 1) {
              const title = text(formData, `${prefix}_${field.name}_${i}_title`).trim();
              const body = text(formData, `${prefix}_${field.name}_${i}_body`).trim();
              if (title || body) items.push({ title, body });
            }
            return items;
          };
          next[field.name] = readPairs("fa");
          const enItems = readPairs("en");
          if (enItems.length) en[field.name] = enItems;
          else delete en[field.name];
        }
      }
      if (Object.keys(en).length) next.en = en;
      else delete next.en;
      content = next;
      assertPlainContent(content);
    }
    await prisma.section.update({
      where: { id },
      data: {
        visible,
        label: text(formData, "label").trim().slice(0, 80) || existing.label,
        content: content as Prisma.InputJsonValue,
      },
    });
    refresh();
    return { ok: true, message: "بخش ذخیره شد." };
  } catch (error) {
    if (error instanceof SyntaxError) return { ok: false, message: "JSON نامعتبر است." };
    return fail(error);
  }
}

async function reorder(kind: string, id: string, dir: "up" | "down") {
  if (kind === "section") {
    const current = await prisma.section.findUnique({ where: { id } });
    if (!current) return;
    const rows = await prisma.section.findMany({ where: { page: current.page }, orderBy: { sortOrder: "asc" } });
    await writeOrder(rows, id, dir, (rowId, sortOrder) => prisma.section.update({ where: { id: rowId }, data: { sortOrder } }));
    return;
  }
  if (kind === "menu") {
    const current = await prisma.menuItem.findUnique({ where: { id } });
    if (!current) return;
    const rows = await prisma.menuItem.findMany({ where: { location: current.location }, orderBy: { sortOrder: "asc" } });
    await writeOrder(rows, id, dir, (rowId, sortOrder) => prisma.menuItem.update({ where: { id: rowId }, data: { sortOrder } }));
    return;
  }
  if (kind === "service") {
    const rows = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
    await writeOrder(rows, id, dir, (rowId, sortOrder) => prisma.service.update({ where: { id: rowId }, data: { sortOrder } }));
    return;
  }
  if (kind === "testimonial") {
    const rows = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
    await writeOrder(rows, id, dir, (rowId, sortOrder) => prisma.testimonial.update({ where: { id: rowId }, data: { sortOrder } }));
    return;
  }
  if (kind === "project") {
    const rows = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
    await writeOrder(rows, id, dir, (rowId, sortOrder) => prisma.project.update({ where: { id: rowId }, data: { sortOrder } }));
  }
}

async function writeOrder<T extends { id: string }>(
  rows: T[],
  id: string,
  dir: "up" | "down",
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return;
  const swapWith = dir === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return;
  const next = rows.slice();
  const [item] = next.splice(index, 1);
  next.splice(swapWith, 0, item);
  await prisma.$transaction(next.map((row, order) => update(row.id, (order + 1) * 10)));
}

export async function moveRecord(formData: FormData) {
  try {
    await guardAction("manage_content");
    const id = text(formData, "id");
    const kind = text(formData, "kind");
    const dir = text(formData, "dir") === "up" ? "up" : "down";
    await reorder(kind, id, dir);
    refresh();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
  }
}

export async function saveMenu(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_appearance");
    const data = menuSchema.parse({
      label: text(formData, "label"),
      labelEn: text(formData, "labelEn"),
      href: text(formData, "href").trim(),
      location: text(formData, "location"),
      visible: flag(formData, "visible"),
    });
    const id = text(formData, "id");
    const parentId=text(formData,"parentId")||null;
    if(parentId){
      const items=await prisma.menuItem.findMany({select:{id:true,parentId:true,location:true}});
      const byId=new Map(items.map(i=>[i.id,i]));
      const visited=new Set([id]);let current:string|null=parentId;
      while(current){const parent=byId.get(current);if(!parent||parent.location!==data.location||visited.has(current))throw new RequestError("منوی والد نامعتبر است.");visited.add(current);current=parent.parentId;}
    }
    const extended={...data,parentId,icon:text(formData,"icon").slice(0,80),highlight:flag(formData,"highlight"),newTab:flag(formData,"newTab")};
    if (id) await prisma.menuItem.update({ where: { id }, data:extended });
    else {
      const last = await prisma.menuItem.aggregate({ where: { location: data.location }, _max: { sortOrder: true } });
      await prisma.menuItem.create({ data: { ...extended, sortOrder: (last._max.sortOrder ?? 0) + 10 } });
    }
    refresh();
    return { ok: true, message: "منو ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMenu(id: string) {
  await guardAction("manage_appearance");
  await prisma.menuItem.delete({ where: { id } });
  refresh();
}

export async function saveProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_content");
    const images = text(formData, "images")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const tags = text(formData, "tags")
      .split(/[,،\n]/)
      .map((line) => line.trim())
      .filter(Boolean);
    const data = projectSchema.parse({
      slug: text(formData, "slug").trim().toLowerCase(),
      title: text(formData, "title"),
      titleEn: text(formData, "titleEn"),
      subtitle: text(formData, "subtitle"),
      subtitleEn: text(formData, "subtitleEn"),
      excerpt: text(formData, "excerpt"),
      excerptEn: text(formData, "excerptEn"),
      body: text(formData, "body"),
      bodyEn: text(formData, "bodyEn"),
      coverUrl: text(formData, "coverUrl").trim(),
      images,
      tags,
      year: text(formData, "year"),
      client: text(formData, "client"),
      role: text(formData, "role"),
      url: text(formData, "url").trim(),
      featured: flag(formData, "featured"),
      published: flag(formData, "published"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
      seoTitle: text(formData, "seoTitle"),
      seoDescription: text(formData, "seoDescription"),
    });
    const id = text(formData, "id");
    if (id) {
      await prisma.project.update({ where: { id }, data });
      refresh();
      return { ok: true, message: "پروژه ذخیره شد." };
    }
    const created = await prisma.project.create({ data });
    refresh();
    redirect(`/admin/projects/${created.id}?saved=1`);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProject(id: string) {
  await guardAction("manage_content");
  await prisma.project.delete({ where: { id } });
  refresh();
  redirect("/admin/projects");
}

export async function saveService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_content");
    const data = serviceSchema.parse({
      number: text(formData, "number"),
      title: text(formData, "title"),
      titleEn: text(formData, "titleEn"),
      summary: text(formData, "summary"),
      summaryEn: text(formData, "summaryEn"),
      body: text(formData, "body"),
      bodyEn: text(formData, "bodyEn"),
      imageUrl: text(formData, "imageUrl"),
      priceLabel: text(formData, "priceLabel"),
      href: text(formData, "href") || "/services",
      includes: text(formData, "includes").split("\n").map((line) => line.trim()).filter(Boolean),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.service.update({ where: { id }, data });
    else await prisma.service.create({ data });
    refresh();
    return { ok: true, message: "خدمت ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteService(id: string) {
  await guardAction("manage_content");
  await prisma.service.delete({ where: { id } });
  refresh();
}

export async function saveTestimonial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_content");
    const data = testimonialSchema.parse({
      name: text(formData, "name"),
      role: text(formData, "role"),
      roleEn: text(formData, "roleEn"),
      quote: text(formData, "quote"),
      avatarUrl: text(formData, "avatarUrl"),
      quoteEn: text(formData, "quoteEn"),
      visible: flag(formData, "visible"),
      sortOrder: Number(text(formData, "sortOrder") || "0"),
    });
    const id = text(formData, "id");
    if (id) await prisma.testimonial.update({ where: { id }, data });
    else await prisma.testimonial.create({ data });
    refresh();
    return { ok: true, message: "نظر ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTestimonial(id: string) {
  await guardAction("manage_content");
  await prisma.testimonial.delete({ where: { id } });
  refresh();
}

export async function updateSeo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_seo");
    const data = seoSchema.parse({
      id: text(formData, "id"),
      title: text(formData, "title"),
      description: text(formData, "description"),
      keywords: text(formData, "keywords"),
      ogImage: text(formData, "ogImage").trim(),
    });
    await prisma.pageSeo.update({ where: { id: data.id }, data });
    refresh();
    return { ok: true, message: "سئو ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function uploadMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_media");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "فایلی انتخاب نشده." };
    if (file.size > 8 * 1024 * 1024) return { ok: false, message: "حداکثر حجم ۸ مگابایت است." };
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { ok: false, message: "فقط JPG، PNG، WebP، GIF، AVIF یا ICO." };
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(bytes, file.type)) return { ok: false, message: "محتوای فایل با نوع آن نمی‌خواند." };
    const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, storedName), bytes);
    await prisma.media.create({
      data: {
        filename: file.name.slice(0, 180),
        storedName,
        mime: file.type,
        size: bytes.length,
        alt: text(formData, "alt").trim().slice(0, 180),
      },
    });
    revalidatePath("/admin/media");
    return { ok: true, message: "بارگذاری شد.", url: `/media/${storedName}` };
  } catch (error) {
    return fail(error);
  }
}

export async function updateMediaAlt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_media");
    await prisma.media.update({
      where: { id: text(formData, "id") },
      data: { alt: text(formData, "alt").trim().slice(0, 180) },
    });
    return { ok: true, message: "متن جایگزین ذخیره شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMedia(id: string) {
  await guardAction("manage_media");
  const media = await prisma.media.delete({ where: { id } });
  await unlink(path.join(uploadDir(), media.storedName)).catch(() => undefined);
  revalidatePath("/admin/media");
}

export async function useMedia(formData: FormData) {
  await guardAction("manage_appearance");
  const url = text(formData, "url");
  const target = text(formData, "target");
  if (!url.startsWith("/media/")) return;
  if (target === "logo") await prisma.siteSettings.update({ where: { id: "default" }, data: { logoUrl: url } });
  if (target === "favicon") await prisma.siteSettings.update({ where: { id: "default" }, data: { faviconUrl: url } });
  refresh();
}

export async function setMessageRead(formData: FormData) {
  await guardAction("manage_leads");
  await prisma.contactMessage.update({
    where: { id: text(formData, "id") },
    data: { read: flag(formData, "read") },
  });
  revalidatePath("/admin/messages");
}

export async function deleteMessage(id: string) {
  await guardAction("manage_leads");
  await prisma.contactMessage.delete({ where: { id } });
  refresh();
  redirect("/admin/messages");
}

export async function createAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await guardAction("manage_users");
    const data = userSchema.parse({
      name: text(formData, "name"),
      email: text(formData, "email").trim().toLowerCase(),
      password: text(formData, "password"),
    });
    await prisma.adminUser.create({
      data: { name: data.name, email: data.email, passwordHash: await hashPassword(data.password) },
    });
    revalidatePath("/admin/users");
    return { ok: true, message: "مدیر ساخته شد." };
  } catch (error) {
    return fail(error);
  }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await guard();
    const data = passwordChangeSchema.parse({
      current: text(formData, "current"),
      next: text(formData, "next"),
    });
    const verified = await verifyPassword(user.email, data.current);
    if (!verified) return { ok: false, message: "رمز فعلی نادرست است." };
    await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.next) } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await createSession(user.id);
    return { ok: true, message: "رمز عوض شد. نشست‌های دیگر بسته شدند." };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAdmin(id: string) {
  const user = await guardAction("manage_users");
  if (id === user.id) return;
  const count = await prisma.adminUser.count();
  if (count <= 1) return;
  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function submitContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const data = contactSchema.parse({
      name: text(formData, "name"),
      email: text(formData, "email"),
      phone: text(formData, "phone"),
      subject: text(formData, "subject"),
      projectType: text(formData, "projectType"),
      budget: text(formData, "budget"),
      message: text(formData, "message"),
      company: text(formData, "company"),
    });
    if (data.company.trim()) return { ok: true, message: "پیام رسید." };
    const ip = await clientIp();
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.contactMessage.count({ where: { ip, createdAt: { gte: since } } });
    if (recent >= 5) return { ok: false, message: "پیام‌های زیادی فرستاده شده. کمی بعد دوباره تلاش کنید." };
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject || data.projectType,
        projectType: data.projectType,
        budget: data.budget,
        message: data.message || `${data.projectType} — ${data.budget}`,
        ip,
      },
    });
    revalidatePath("/admin/messages");
    const section = await prisma.section.findUnique({ where: { page_key: { page: "contact", key: "contactIntro" } } });
    const content = asObject(section?.content);
    const jar = await cookies();
    const en = asObject(content.en);
    const success =
      jar.get("locale")?.value === "en" && typeof en.success === "string" && en.success.trim()
        ? en.success
        : typeof content.success === "string" && content.success.trim()
          ? content.success
          : "پیام رسید.";
    return { ok: true, message: success };
  } catch (error) {
    return fail(error);
  }
}

export async function subscribeNewsletter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const email = text(formData, "email").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "ایمیل معتبر نیست." };
    await prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
    return { ok: true, message: "ثبت شد. ممنون." };
  } catch (error) {
    return fail(error);
  }
}
