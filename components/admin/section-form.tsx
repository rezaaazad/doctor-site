"use client";

import { useActionState } from "react";
import { updateSection, type ActionState } from "@/lib/actions";
import { SECTION_FORMS, type FieldDef } from "@/lib/section-forms";
import { asObject, asStringArray } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, OrderButtons, SaveButton, SwitchField } from "@/components/admin/bits";

export function SectionForm({
  section,
}: {
  section: { id: string; key: string; label: string; visible: boolean; content: Record<string, unknown> };
}) {
  const [state, action] = useActionState(updateSection, null as ActionState);
  const spec = SECTION_FORMS[section.key];
  const en = asObject(section.content.en);
  return (
    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{spec?.label || section.label}</h3>
        <OrderButtons kind="section" id={section.id} />
      </div>
      <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={section.id} />
      <Field label="نام بخش در پنل">
        <Input name="label" defaultValue={section.label} />
      </Field>
      <SwitchField key={`${section.id}-${section.visible}`} name="visible" label="نمایش در سایت" defaultOn={section.visible} />
      <div className="grid gap-4">
        {spec?.fields.map((field) => (
          <FaField key={field.name} field={field} content={section.content} />
        ))}
      </div>
      <details className="rounded-2xl border border-white/10 p-4">
        <summary className="cursor-pointer text-sm text-white/70">متن انگلیسی</summary>
        <div className="mt-4 grid gap-4">
          {spec?.fields.map((field) => (
            <EnField key={field.name} field={field} en={en} />
          ))}
        </div>
      </details>
      <details className="rounded-2xl border border-white/10 p-4">
        <summary className="cursor-pointer text-sm text-white/70">ویرایش پیشرفته JSON</summary>
        <Textarea name="raw" dir="ltr" className="mt-4 font-mono text-xs" defaultValue={JSON.stringify(section.content, null, 2)} />
        <Button type="submit" name="mode" value="raw" variant="outline" className="mt-3">ذخیره JSON</Button>
      </details>
      <FormMessage state={state} />
      <div><SaveButton>ذخیره بخش</SaveButton></div>
      </form>
    </div>
  );
}

function FaField({ field, content }: { field: FieldDef; content: Record<string, unknown> }) {
  if (field.type === "lines") {
    return (
      <Field label={field.label}>
        <Textarea name={`fa_${field.name}`} defaultValue={asStringArray(content[field.name]).join("\n")} />
      </Field>
    );
  }
  if (field.type === "pairs") {
    const rows = Array.isArray(content[field.name]) ? (content[field.name] as unknown[]) : [];
    return (
      <div className="grid gap-3">
        <p className="text-sm text-white/75">{field.label}</p>
        {Array.from({ length: 4 }, (_, index) => {
          const row = asObject(rows[index]);
          return (
            <div key={index} className="grid gap-2 rounded-2xl border border-white/10 p-3">
              <Input name={`fa_${field.name}_${index}_title`} defaultValue={typeof row.title === "string" ? row.title : ""} placeholder={`عنوان ${index + 1}`} />
              <Textarea name={`fa_${field.name}_${index}_body`} defaultValue={typeof row.body === "string" ? row.body : ""} />
            </div>
          );
        })}
      </div>
    );
  }
  const Control = field.type === "textarea" ? Textarea : Input;
  const value = content[field.name];
  return (
    <Field label={field.label}>
      <Control name={`fa_${field.name}`} defaultValue={typeof value === "string" ? value : ""} />
    </Field>
  );
}

function EnField({ field, en }: { field: FieldDef; en: Record<string, unknown> }) {
  if (field.type === "lines") {
    return (
      <Field label={field.label}>
        <Textarea dir="ltr" name={`en_${field.name}`} defaultValue={asStringArray(en[field.name]).join("\n")} />
      </Field>
    );
  }
  if (field.type === "pairs") {
    const rows = Array.isArray(en[field.name]) ? (en[field.name] as unknown[]) : [];
    return (
      <div className="grid gap-3">
        <p className="text-sm text-white/75">{field.label}</p>
        {Array.from({ length: 4 }, (_, index) => {
          const row = asObject(rows[index]);
          return (
            <div key={index} className="grid gap-2 rounded-2xl border border-white/10 p-3">
              <Input dir="ltr" name={`en_${field.name}_${index}_title`} defaultValue={typeof row.title === "string" ? row.title : ""} placeholder="Title" />
              <Textarea dir="ltr" name={`en_${field.name}_${index}_body`} defaultValue={typeof row.body === "string" ? row.body : ""} />
            </div>
          );
        })}
      </div>
    );
  }
  const Control = field.type === "textarea" ? Textarea : Input;
  const value = en[field.name];
  return (
    <Field label={field.label}>
      <Control dir="ltr" name={`en_${field.name}`} defaultValue={typeof value === "string" ? value : ""} />
    </Field>
  );
}
