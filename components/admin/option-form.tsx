"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import type { OptionGroup, OptionRecord } from "@/lib/options-schema";
import type { AdminState } from "@/lib/admin/action";
import { cn } from "@/lib/utils";
import { ActionForm } from "@/components/admin/forms";
import { SubmitButton } from "@/components/ui/form";

type Props = {
  group: OptionGroup;
  values: OptionRecord;
  action: (prev: AdminState, formData: FormData) => Promise<AdminState>;
  compact?: boolean;
};

export function OptionGroupForm({ group, values, action, compact = false }: Props) {
  const sections: { name: string; fields: OptionGroup["fields"] }[] = [];
  for (const f of group.fields) {
    const name = f.section ?? "";
    const last = sections[sections.length - 1];
    if (last && last.name === name) last.fields.push(f);
    else sections.push({ name, fields: [f] });
  }
  return (
    <ActionForm action={action} className="gap-6">
      {sections.map((section, si) => (
        <fieldset key={si} className="grid gap-4">
          {section.name ? <legend className="mb-1 text-[0.8rem] font-bold text-primary">{section.name}</legend> : null}
          <div className={cn("grid gap-4", !compact && "md:grid-cols-2")}>
            {section.fields.map((f) => (
              <OptionField key={f.key} field={f} value={values[f.key]} />
            ))}
          </div>
        </fieldset>
      ))}
      <div className="sticky bottom-3 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-white/90 p-2.5 shadow-2 backdrop-blur">
        <SubmitButton variant="ink" pendingText="در حال ذخیره…">
          ذخیره تنظیمات
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

function OptionField({ field: f, value }: { field: OptionGroup["fields"][number]; value: unknown }) {
  const id = `opt-${f.key}`;
  const wide = f.type === "textarea" || f.type === "code";
  const label = (
    <label htmlFor={id} className="field-label">
      {f.label}
    </label>
  );
  const hint = f.hint ? <p className="field-hint">{f.hint}</p> : null;
  if (f.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-sunken/40 p-3 md:col-span-1">
        <input type="hidden" name={f.key} value="0" />
        <input id={id} type="checkbox" name={f.key} value="1" defaultChecked={Boolean(value)} className="peer sr-only" />
        <span className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-primary after:absolute after:top-0.5 after:right-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-4" />
        <span className="min-w-0">
          <b className="block text-[0.88rem]">{f.label}</b>
          {f.hint ? <span className="mt-0.5 block text-[0.78rem] leading-6 text-muted">{f.hint}</span> : null}
        </span>
      </label>
    );
  }
  if (f.type === "secret") return <SecretField id={id} name={f.key} label={f.label} hint={f.hint} isSet={value === "__set__"} />;
  if (f.type === "select") {
    return (
      <div>
        {label}
        <select id={id} name={f.key} defaultValue={String(value ?? f.default)} className="input">
          {f.choices?.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {hint}
      </div>
    );
  }
  if (f.type === "color") return <ColorField id={id} name={f.key} label={f.label} hint={f.hint} value={String(value ?? f.default)} />;
  if (f.type === "textarea" || f.type === "code") {
    return (
      <div className={cn(wide && "md:col-span-2")}>
        {label}
        <textarea id={id} name={f.key} defaultValue={String(value ?? "")} dir={f.type === "code" ? "ltr" : f.dir} rows={f.type === "code" ? 6 : 3} className={cn("input", f.type === "code" && "font-mono text-[0.8rem]")} />
        {hint}
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        id={id}
        name={f.key}
        defaultValue={String(value ?? "")}
        dir={f.dir ?? (f.type === "number" || f.type === "toman" || f.type === "url" ? "ltr" : undefined)}
        inputMode={f.type === "number" || f.type === "toman" ? "numeric" : undefined}
        type={f.type === "url" ? "url" : "text"}
        className="input"
      />
      {hint}
    </div>
  );
}

function SecretField({ id, name, label, hint, isSet }: { id: string; name: string; label: string; hint?: string; isSet: boolean }) {
  const [editing, setEditing] = useState(!isSet);
  const [show, setShow] = useState(false);
  const [clear, setClear] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <input id={id} name={name} type={show ? "text" : "password"} dir="ltr" autoComplete="off" className="input !pl-10" placeholder={isSet ? "مقدار جدید (خالی = بدون تغییر)" : ""} />
          <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 left-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-sunken" aria-label={show ? "پنهان" : "نمایش"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input type="hidden" name={name} value={clear ? "__clear__" : "__set__"} />
          <span className={cn("input flex items-center gap-2 !text-[0.85rem]", clear ? "text-urgency" : "text-success")}>
            <KeyRound className="size-4" aria-hidden />
            {clear ? "پاک می‌شود" : "ذخیره شده ••••••"}
          </span>
          <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => setEditing(true)}>
            تغییر
          </button>
          <button type="button" className="btn btn-ghost btn-sm shrink-0 text-urgency" onClick={() => setClear(!clear)}>
            {clear ? "انصراف" : "پاک کردن"}
          </button>
        </div>
      )}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

function ColorField({ id, name, label, hint, value }: { id: string; name: string; label: string; hint?: string; value: string }) {
  const [color, setColor] = useState(value);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"} onChange={(e) => setColor(e.target.value.toUpperCase())} className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-surface p-1" aria-label={label} />
        <input id={id} name={name} value={color} onChange={(e) => setColor(e.target.value)} dir="ltr" className="input font-mono" />
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
