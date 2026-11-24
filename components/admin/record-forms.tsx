"use client";

import { useActionState } from "react";
import {
  changePassword,
  createAdmin,
  saveMenu,
  saveProject,
  saveService,
  saveTestimonial,
  updateMediaAlt,
  updateSeo,
  type ActionState,
} from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton, Field, FormMessage, SaveButton, SwitchField } from "@/components/admin/bits";
import { deleteMedia } from "@/lib/actions";

export function MenuForm({
  item,
  parents = [],
}: {
  item?: { id: string; label: string; labelEn: string; href: string; location: string; visible: boolean; parentId?: string|null; icon?: string; highlight?:boolean; newTab?:boolean };
  parents?: {id:string;label:string}[];
}) {
  const [state, action] = useActionState(saveMenu, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="برچسب"><Input name="label" defaultValue={item?.label} required /></Field>
        <Field label="English"><Input name="labelEn" defaultValue={item?.labelEn} dir="ltr" /></Field>
        <Field label="پیوند"><Input name="href" defaultValue={item?.href ?? "/"} dir="ltr" required /></Field>
        <Field label="جایگاه">
          <select name="location" defaultValue={item?.location ?? "header"} className="admin-field">
            <option value="header">هدر</option>
            <option value="footer">پاورقی</option>
          </select>
        </Field>
      </div>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <Field label="منوی والد"><select name="parentId" className="admin-field" defaultValue={item?.parentId??""}><option value="">بدون والد</option>{parents.filter(p=>p.id!==item?.id).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
      <Field label="آیکون"><Input name="icon" defaultValue={item?.icon}/></Field>
      <SwitchField name="highlight" label="برجسته" defaultOn={item?.highlight}/>
      <SwitchField name="newTab" label="باز شدن در زبانه جدید" defaultOn={item?.newTab}/>
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function ServiceForm({
  item,
}: {
  item?: {
    id: string;
    number: string;
    title: string;
    titleEn: string;
    summary: string;
    summaryEn: string;
    body: string;
    bodyEn: string;
    priceLabel?: string;
    includes?: string[];
    href?: string;
    visible: boolean;
    sortOrder: number;
  };
}) {
  const [state, action] = useActionState(saveService, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="شماره"><Input name="number" defaultValue={item?.number ?? "06"} /></Field>
        <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
        <Field label="عنوان"><Input name="title" defaultValue={item?.title} required /></Field>
        <Field label="متن بزرگ روی کارت"><Input name="titleEn" defaultValue={item?.titleEn} /></Field>
      </div>
      <Field label="خلاصه"><Textarea name="summary" defaultValue={item?.summary} /></Field>
      <Field label="Summary"><Textarea name="summaryEn" defaultValue={item?.summaryEn} dir="ltr" /></Field>
      <Field label="شروع قیمت"><Input name="priceLabel" defaultValue={item?.priceLabel} placeholder="از ۱۸ میلیون تومان" /></Field>
      <Field label="پیوند"><Input name="href" defaultValue={item?.href ?? "/services"} dir="ltr" /></Field>
      <Field label="شرح"><Textarea name="body" defaultValue={item?.body} /></Field>
      <Field label="چه چیزهایی شامل می‌شود" hint="هر خط یک مورد."><Textarea name="includes" defaultValue={(item?.includes ?? []).join("\n")} /></Field>
      <Field label="Body"><Textarea name="bodyEn" defaultValue={item?.bodyEn} dir="ltr" /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function TestimonialForm({
  item,
}: {
  item?: { id: string; name: string; role: string; roleEn: string; quote: string; quoteEn: string; visible: boolean; sortOrder: number };
}) {
  const [state, action] = useActionState(saveTestimonial, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="نام"><Input name="name" defaultValue={item?.name} required /></Field>
        <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
        <Field label="سمت"><Input name="role" defaultValue={item?.role} /></Field>
        <Field label="Role"><Input name="roleEn" defaultValue={item?.roleEn} dir="ltr" /></Field>
      </div>
      <Field label="نقل‌قول"><Textarea name="quote" defaultValue={item?.quote} /></Field>
      <Field label="Quote"><Textarea name="quoteEn" defaultValue={item?.quoteEn} dir="ltr" /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function SeoForm({ item }: { item: { id: string; path: string; title: string; description: string; keywords: string; ogImage: string } }) {
  const [state, action] = useActionState(updateSeo, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      <input type="hidden" name="id" value={item.id} />
      <p className="text-xs text-muted" dir="ltr">{item.path}</p>
      <Field label="عنوان"><Input name="title" defaultValue={item.title} required /></Field>
      <Field label="توضیح"><Textarea name="description" defaultValue={item.description} required /></Field>
      <Field label="کلیدواژه‌ها"><Input name="keywords" defaultValue={item.keywords} /></Field>
      <Field label="تصویر OG"><Input name="ogImage" defaultValue={item.ogImage} dir="ltr" /></Field>
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

type ProjectFields = {
  id?: string;
  slug?: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  body?: string;
  bodyEn?: string;
  coverUrl?: string;
  images?: string[];
  tags?: string[];
  year?: string;
  client?: string;
  role?: string;
  url?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
};

export function ProjectForm({ project }: { project?: ProjectFields }) {
  const [state, action] = useActionState(saveProject, null as ActionState);
  return (
    <form action={action} className="grid max-w-4xl gap-4">
      {project?.id ? <input type="hidden" name="id" value={project.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="عنوان"><Input name="title" defaultValue={project?.title} required /></Field>
        <Field label="Title"><Input name="titleEn" defaultValue={project?.titleEn} dir="ltr" /></Field>
        <Field label="نامک"><Input name="slug" defaultValue={project?.slug} dir="ltr" required /></Field>
        <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} dir="ltr" /></Field>
        <Field label="زیرعنوان"><Input name="subtitle" defaultValue={project?.subtitle} /></Field>
        <Field label="Subtitle"><Input name="subtitleEn" defaultValue={project?.subtitleEn} dir="ltr" /></Field>
        <Field label="سال"><Input name="year" defaultValue={project?.year} /></Field>
        <Field label="کارفرما"><Input name="client" defaultValue={project?.client} /></Field>
        <Field label="نقش"><Input name="role" defaultValue={project?.role} /></Field>
        <Field label="نشانی بیرونی"><Input name="url" defaultValue={project?.url} dir="ltr" /></Field>
      </div>
      <Field label="خلاصه"><Textarea name="excerpt" defaultValue={project?.excerpt} required /></Field>
      <Field label="Excerpt"><Textarea name="excerptEn" defaultValue={project?.excerptEn} dir="ltr" /></Field>
      <Field label="متن" hint="پاراگراف‌ها را با یک خط خالی جدا کنید."><Textarea name="body" defaultValue={project?.body} className="min-h-48" required /></Field>
      <Field label="Body"><Textarea name="bodyEn" defaultValue={project?.bodyEn} className="min-h-40" dir="ltr" /></Field>
      <Field label="تصویر شاخص"><Input name="coverUrl" defaultValue={project?.coverUrl} dir="ltr" /></Field>
      <Field label="گالری" hint="هر خط یک نشانی."><Textarea name="images" defaultValue={(project?.images ?? []).join("\n")} dir="ltr" /></Field>
      <Field label="برچسب‌ها" hint="با ویرگول."><Input name="tags" defaultValue={(project?.tags ?? []).join("، ")} /></Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="عنوان سئو"><Input name="seoTitle" defaultValue={project?.seoTitle} /></Field>
        <Field label="توضیح سئو"><Textarea name="seoDescription" defaultValue={project?.seoDescription} /></Field>
      </div>
      <SwitchField name="featured" label="در ریل هیرو" defaultOn={project?.featured ?? false} />
      <SwitchField name="published" label="منتشر شده" defaultOn={project?.published ?? true} />
      <SaveButton>{project?.id ? "ذخیره پروژه" : "ساخت پروژه"}</SaveButton>
      <FormMessage state={state} />
    </form>
  );
}

export function MediaAltForm({ id, alt }: { id: string; alt: string }) {
  const [state, action] = useActionState(updateMediaAlt, null as ActionState);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <Input name="alt" defaultValue={alt} placeholder="متن جایگزین" />
      <div className="flex flex-wrap gap-2">
        <SaveButton>ذخیره متن</SaveButton>
        <ConfirmButton action={deleteMedia.bind(null, id)} />
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function CreateUserForm() {
  const [state, action] = useActionState(createAdmin, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      <h2 className="font-bold">مدیر جدید</h2>
      <Field label="نام"><Input name="name" required /></Field>
      <Field label="ایمیل"><Input name="email" type="email" dir="ltr" required /></Field>
      <Field label="رمز" hint="حداقل ۱۰ نویسه، با حرف و عدد."><Input name="password" type="password" required /></Field>
      <SaveButton>ساخت</SaveButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null as ActionState);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-line p-4">
      <h2 className="font-bold">تغییر رمز</h2>
      <Field label="رمز فعلی"><Input name="current" type="password" required /></Field>
      <Field label="رمز جدید"><Input name="next" type="password" required /></Field>
      <SaveButton>تغییر رمز</SaveButton>
      <FormMessage state={state} />
    </form>
  );
}
