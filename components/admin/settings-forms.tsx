"use client";

import { useActionState, useState } from "react";
import { updateAppearance, updateHero, updateProfile, uploadMedia, type ActionState } from "@/lib/actions";
import type { Settings } from "@/lib/site";
import { FONTS, HERO_SHAPES } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SaveButton, SwitchField } from "@/components/admin/bits";

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Field label={label}>
      <span className="flex gap-2">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(event) => setValue(event.target.value)} className="h-11 w-14 cursor-pointer rounded-xl bg-transparent" aria-label={label} />
        <Input name={name} value={value} onChange={(event) => setValue(event.target.value)} dir="ltr" />
      </span>
    </Field>
  );
}

export function AppearanceForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(updateAppearance, null as ActionState);
  return (
    <form action={action} className="grid max-w-3xl gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="accentColor" label="رنگ تأکیدی" defaultValue={settings.accentColor} />
        <ColorField name="backgroundColor" label="پس‌زمینه" defaultValue={settings.backgroundColor} />
        <ColorField name="surfaceColor" label="سطح" defaultValue={settings.surfaceColor} />
        <ColorField name="textColor" label="متن" defaultValue={settings.textColor} />
        <ColorField name="mutedColor" label="متن فرعی" defaultValue={settings.mutedColor} />
        <Field label="فونت">
          <select name="fontFamily" defaultValue={settings.fontFamily} className="admin-field">
            {FONTS.map((font) => <option key={font} value={font}>{font === "Vazirmatn" ? "وزیرمتن" : "استعداد"}</option>)}
          </select>
        </Field>
      </div>
      <Field label="نشانی لوگو" hint="خالی یعنی نشان نوشتاری. از رسانه هم می‌توانید انتخاب کنید.">
        <Input name="logoUrl" defaultValue={settings.logoUrl} dir="ltr" />
      </Field>
      <Field label="نشانی فاوآیکون">
        <Input name="faviconUrl" defaultValue={settings.faviconUrl} dir="ltr" />
      </Field>
      <div className="grid gap-3">
        <SwitchField name="cursorEnabled" label="نشانگر سفارشی" defaultOn={settings.cursorEnabled} />
        <SwitchField name="smoothScroll" label="اسکرول نرم" defaultOn={settings.smoothScroll} />
        <SwitchField name="animationsEnabled" label="انیمیشن و گذار صفحه" defaultOn={settings.animationsEnabled} />
        <SwitchField name="grainEnabled" label="بافت دانه" defaultOn={settings.grainEnabled} />
        <SwitchField name="webglEnabled" label="صحنه سه‌بعدی" defaultOn={settings.webglEnabled} />
      </div>
      <FormMessage state={state} />
      <SaveButton>ذخیره ظاهر</SaveButton>
    </form>
  );
}

export function HeroForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(updateHero, null as ActionState);
  return (
    <form action={action} className="grid max-w-3xl gap-5">
      <Field label="شکل حجم">
        <select name="heroShape" defaultValue={settings.heroShape} className="admin-field">
          {HERO_SHAPES.map((shape) => (
            <option key={shape} value={shape}>{shape === "liquid" ? "مایع" : shape === "knot" ? "گره" : "روبان"}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="heroColorA" label="رنگ اول" defaultValue={settings.heroColorA} />
        <ColorField name="heroColorB" label="رنگ دوم" defaultValue={settings.heroColorB} />
      </div>
      <Field label="سرعت" hint="از ۰ تا ۳">
        <Input name="heroSpeed" type="number" min={0} max={3} step={0.1} defaultValue={settings.heroSpeed} dir="ltr" />
      </Field>
      <Field label="تعداد ذرات" hint="۰ تا ۶۰۰۰. موبایل خودش کمتر می‌کشد.">
        <Input name="heroParticles" type="number" min={0} max={6000} step={100} defaultValue={settings.heroParticles} dir="ltr" />
      </Field>
      <Field label="کلمه‌هایی که ذرات می‌سازند" hint="با ویرگول جدا کنید.">
        <Input name="heroWords" defaultValue={settings.heroWords} />
      </Field>
      <FormMessage state={state} />
      <SaveButton>ذخیره صحنه</SaveButton>
    </form>
  );
}

export function ProfileForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(updateProfile, null as ActionState);
  return (
    <form action={action} className="grid max-w-3xl gap-5">
      <Field label="نام سایت"><Input name="siteName" defaultValue={settings.siteName} /></Field>
      <Field label="شعار"><Input name="tagline" defaultValue={settings.tagline} /></Field>
      <Field label="توضیح کوتاه"><Textarea name="description" defaultValue={settings.description} /></Field>
      <SwitchField name="available" label="آماده پذیرش پروژه" defaultOn={settings.available} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ایمیل"><Input name="email" defaultValue={settings.email} dir="ltr" /></Field>
        <Field label="تلفن"><Input name="phone" defaultValue={settings.phone} dir="ltr" /></Field>
      </div>
      <Field label="نشانی"><Input name="address" defaultValue={settings.address} /></Field>
      <Field label="ساعت پاسخ"><Input name="hours" defaultValue={settings.hours} /></Field>
      <Field label="یادداشت پاورقی"><Textarea name="footerNote" defaultValue={settings.footerNote} /></Field>
      <Field label="عنوان خبرنامه"><Input name="newsletterTitle" defaultValue={settings.newsletterTitle} /></Field>
      <Field label="خط کپی‌رایت"><Input name="copyright" defaultValue={settings.copyright} /></Field>
      <Field label="کد اینماد و ساماندهی" hint="اسنیپت خام HTML را همین‌جا بگذارید. همان‌طور در پاورقی نشان داده می‌شود.">
        <Textarea name="enamadHtml" defaultValue={settings.enamadHtml} dir="ltr" className="min-h-40 font-mono text-xs" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اینستاگرام"><Input name="instagram" defaultValue={settings.socials.instagram} dir="ltr" /></Field>
        <Field label="تلگرام"><Input name="telegram" defaultValue={settings.socials.telegram} dir="ltr" /></Field>
        <Field label="لینکدین"><Input name="linkedin" defaultValue={settings.socials.linkedin} dir="ltr" /></Field>
        <Field label="گیت‌هاب"><Input name="github" defaultValue={settings.socials.github} dir="ltr" /></Field>
        <Field label="واتساپ"><Input name="whatsapp" defaultValue={settings.socials.whatsapp} dir="ltr" /></Field>
      </div>
      <FormMessage state={state} />
      <SaveButton>ذخیره هویت</SaveButton>
    </form>
  );
}

export function UploadButton({ onUploaded }: { onUploaded?: (url: string) => void }) {
  const [state, action] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await uploadMedia(prev, formData);
    if (result?.ok && result.url) onUploaded?.(result.url);
    return result;
  }, null as ActionState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <Field label="فایل تصویر">
        <Input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon" required />
      </Field>
      <Field label="متن جایگزین">
        <Input name="alt" />
      </Field>
      <SaveButton>بارگذاری</SaveButton>
      <FormMessage state={state} />
    </form>
  );
}
