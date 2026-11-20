"use client";

import { useActionState } from "react";
import { deleteFaq, deleteLogo, deletePackage, deletePost, deleteStat, deleteStep, saveFaq, saveLogo, savePackage, savePost, saveStat, saveStep } from "@/lib/actions-sales";
import { ConfirmButton, Field, FormMessage, SaveButton, SwitchField } from "@/components/admin/bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type State = { ok: boolean; message: string } | null;

export function PackageForm({
  item,
}: {
  item?: { id: string; name: string; price: string; summary: string; features: string[]; highlighted: boolean; visible: boolean; sortOrder: number };
}) {
  const [state, action] = useActionState(savePackage, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/10 p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="نام پکیج"><Input name="name" defaultValue={item?.name} required /></Field>
        <Field label="قیمت"><Input name="price" defaultValue={item?.price} required /></Field>
        <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
      </div>
      <Field label="خلاصه"><Textarea name="summary" defaultValue={item?.summary} /></Field>
      <Field label="موارد شامل" hint="هر خط یک مورد."><Textarea name="features" defaultValue={(item?.features ?? []).join("\n")} /></Field>
      <SwitchField name="highlighted" label="پیشنهاد ویژه" defaultOn={item?.highlighted ?? false} />
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function StepForm({ item }: { item?: { id: string; number: string; title: string; body: string; visible: boolean; sortOrder: number } }) {
  const [state, action] = useActionState(saveStep, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/10 p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="شماره"><Input name="number" defaultValue={item?.number} /></Field>
        <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
        <Field label="عنوان"><Input name="title" defaultValue={item?.title} required /></Field>
      </div>
      <Field label="شرح"><Textarea name="body" defaultValue={item?.body} /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function StatForm({ item }: { item?: { id: string; value: string; label: string; visible: boolean; sortOrder: number } }) {
  const [state, action] = useActionState(saveStat, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/10 p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="عدد"><Input name="value" defaultValue={item?.value} required /></Field>
      <Field label="برچسب"><Input name="label" defaultValue={item?.label} required /></Field>
      <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function LogoForm({ item }: { item?: { id: string; name: string; imageUrl: string; visible: boolean; sortOrder: number } }) {
  const [state, action] = useActionState(saveLogo, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/10 p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="نام"><Input name="name" defaultValue={item?.name} required /></Field>
      <Field label="تصویر (اختیاری)"><Input name="imageUrl" defaultValue={item?.imageUrl} dir="ltr" /></Field>
      <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function FaqForm({ item }: { item?: { id: string; question: string; answer: string; visible: boolean; sortOrder: number } }) {
  const [state, action] = useActionState(saveFaq, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/10 p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="پرسش"><Input name="question" defaultValue={item?.question} required /></Field>
      <Field label="پاسخ"><Textarea name="answer" defaultValue={item?.answer} /></Field>
      <Field label="ترتیب"><Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} dir="ltr" /></Field>
      <SwitchField name="visible" label="نمایان" defaultOn={item?.visible ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export function PostForm({
  item,
}: {
  item?: { id: string; slug: string; title: string; excerpt: string; body: string; coverUrl: string; published: boolean; seoTitle: string; seoDescription: string };
}) {
  const [state, action] = useActionState(savePost, null as State);
  return (
    <form action={action} className="grid max-w-3xl gap-3">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <Field label="عنوان"><Input name="title" defaultValue={item?.title} required /></Field>
      <Field label="نامک"><Input name="slug" defaultValue={item?.slug} dir="ltr" required /></Field>
      <Field label="خلاصه"><Textarea name="excerpt" defaultValue={item?.excerpt} /></Field>
      <Field label="متن" hint="پاراگراف‌ها با یک خط خالی."><Textarea name="body" className="min-h-48" defaultValue={item?.body} /></Field>
      <Field label="تصویر"><Input name="coverUrl" defaultValue={item?.coverUrl} dir="ltr" /></Field>
      <Field label="عنوان سئو"><Input name="seoTitle" defaultValue={item?.seoTitle} /></Field>
      <Field label="توضیح سئو"><Textarea name="seoDescription" defaultValue={item?.seoDescription} /></Field>
      <SwitchField name="published" label="منتشر شود" defaultOn={item?.published ?? true} />
      <SaveButton />
      <FormMessage state={state} />
    </form>
  );
}

export { deletePackage, deletePost, deleteFaq, deleteLogo, deleteStat, deleteStep };
