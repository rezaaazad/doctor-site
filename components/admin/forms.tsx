"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminState } from "@/lib/admin/action";
import { useAdminFeedback } from "./feedback";
import { FormMessage } from "@/components/ui/form";
import { Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose } from "@/components/ui/dialog";

type Action = (prev: AdminState, formData: FormData) => Promise<AdminState>;

/**
 * Form bound to an admin server action. Shows the result message, follows `redirect`
 * from the result, and can reset itself after success.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  messagePosition = "bottom",
  onSuccess,
  id,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  messagePosition?: "top" | "bottom" | "none";
  onSuccess?: (state: AdminState) => void;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, null as AdminState);
  useAdminFeedback(state);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!state?.ok) return;
    if (state.redirect) router.push(state.redirect);
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form ref={ref} id={id} action={formAction} className={cn("admin-edit-form grid gap-4", className)}>
      {messagePosition === "top" ? <FormMessage state={state} /> : null}
      <FieldErrors state={state} />
      {children}
      {messagePosition === "bottom" ? <FormMessage state={state} /> : null}
    </form>
  );
}

/** Puts per-field errors next to inputs by name, via aria-invalid and a sibling message. */
function FieldErrors({ state }: { state: AdminState }) {
  useEffect(() => {
    document.querySelectorAll("[data-field-error]").forEach((el) => el.remove());
    document.querySelectorAll("[aria-invalid='true'][data-admin]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (!state?.errors) return;
    for (const [name, message] of Object.entries(state.errors)) {
      const input = document.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`);
      if (!input) continue;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("data-admin", "");
      const p = document.createElement("p");
      p.dataset.fieldError = "";
      p.className = "mt-1.5 text-[0.8rem] font-semibold text-urgency";
      p.textContent = message;
      input.insertAdjacentElement("afterend", p);
    }
  }, [state]);
  return null;
}

/** Small button that runs a server action after confirmation. */
export function ConfirmButton({
  action,
  confirm = "مطمئن هستید؟",
  children,
  className,
  variant = "outline",
  size = "sm",
  title,
}: {
  action: () => Promise<AdminState | void>;
  confirm?: string | false;
  children: React.ReactNode;
  className?: string;
  variant?: "outline" | "ghost" | "danger" | "ink" | "action" | "primary";
  size?: "sm" | "md";
  title?: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<AdminState>(null);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const router = useRouter();
  function execute(){
    setConfirmOpen(false);
    start(async()=>{
      const result=await action();
      if(result&&result.ok===false)setMessage(result);
      else{setMessage(null);if(result?.redirect)router.push(result.redirect);else router.refresh();}
    });
  }
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        title={title}
        disabled={pending}
        className={cn("btn", size === "sm" && "btn-sm", variant === "danger" ? "btn-outline !border-urgency/30 !text-urgency hover:!bg-urgency-soft" : `btn-${variant}`, className)}
        onClick={() => {
          if(confirm)setConfirmOpen(true);else execute();
        }}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {children}
      </button>
      {message?.message ? <span className="mt-1 text-[0.75rem] font-semibold text-urgency">{message.message}</span> : null}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogTitle>تأیید عملیات</DialogTitle><DialogDescription>{confirm}</DialogDescription><div className="mt-5 flex justify-end gap-2"><DialogClose asChild><button type="button" className="btn btn-outline">انصراف</button></DialogClose><button type="button" className="btn btn-primary" onClick={execute}>تأیید</button></div></DialogContent></Dialog>
    </span>
  );
}

type MediaItem = { id: string; url: string; filename: string; alt: string; width: number; height: number; mime: string };

/** Image URL field with upload and library picker. Submits the URL under `name`. */
export function MediaField({
  name,
  defaultValue = "",
  label,
  hint,
  accept = "image/*",
  privateFile=false,
  className,
  aspect = "aspect-video",
}: {
  name: string;
  defaultValue?: string;
  label?: string;
  hint?: string;
  accept?: string;
  privateFile?:boolean;
  className?: string;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isImage = /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(value) || value.startsWith("/media/");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      if(privateFile) fd.set("private","1");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; id?:string; url?: string; message?: string };
      const selected = privateFile && data.id ? "media:"+data.id : data.url;
      if (!data.ok || !selected) throw new Error(data.message || "بارگذاری نشد.");
      setValue(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "بارگذاری نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      {label ? <span className="field-label">{label}</span> : null}
      <div className="flex gap-3">
        <div className={cn("relative w-28 shrink-0 overflow-hidden rounded-xl border border-dashed border-line bg-sunken", aspect)}>
          {value && isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted">
              <ImagePlus className="size-5" aria-hidden />
            </span>
          )}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-white/70">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input name={name} value={value} onChange={(e) => setValue(e.target.value)} dir="ltr" className="input" placeholder="/media/… یا https://…" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="size-4" aria-hidden /> بارگذاری
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPicker(true)}>
              <Search className="size-4" aria-hidden /> کتابخانه
            </button>
            {value ? (
              <button type="button" className="btn btn-ghost btn-sm text-urgency" onClick={() => setValue("")}>
                <Trash2 className="size-4" aria-hidden /> حذف
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          {error ? <p className="text-[0.8rem] font-semibold text-urgency">{error}</p> : hint ? <p className="field-hint !mt-0">{hint}</p> : null}
        </div>
      </div>
      {picker ? (
        <MediaPicker files={privateFile}
          onClose={() => setPicker(false)}
          onPick={(m) => {
            setValue(m.url);
            setPicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function MediaPicker({ onClose, onPick, files=false }: { files?:boolean; onClose: () => void; onPick: (m: MediaItem) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/media?files=${files?"1":"0"}&q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { items: MediaItem[] };
      setItems(data.items ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [q,files]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="کتابخانه رسانه">
      <button type="button" className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-label="بستن" />
      <div className="relative flex max-h-[85svh] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-surface shadow-3">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <b className="flex-1">کتابخانه رسانه</b>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام فایل یا متن جایگزین" className="input !min-h-10 max-w-xs" autoFocus />
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="بستن">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-5">
          {items === null ? (
            <p className="col-span-full py-10 text-center text-muted">در حال بارگذاری…</p>
          ) : items.length === 0 ? (
            <p className="col-span-full py-10 text-center text-muted">تصویری پیدا نشد. از دکمه «بارگذاری» استفاده کنید.</p>
          ) : (
            items.map((m) => (
              <button key={m.id} type="button" onClick={() => onPick(m)} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-sunken hover:ring-2 hover:ring-primary" title={m.filename}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {files ? <span className="p-2 text-sm">{m.filename}</span> : <img src={m.url} alt={m.alt} className="size-full object-cover" loading="lazy" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Editable list of rows (e.g. specs, stats). Serialises to JSON in a hidden input named `name`. */
export function RowsField<T extends Record<string, string>>({
  name,
  columns,
  defaultValue,
  addLabel = "افزودن ردیف",
  label,
  hint,
}: {
  name: string;
  columns: { key: keyof T & string; label: string; placeholder?: string; dir?: "ltr" | "rtl"; width?: string; type?: "text" | "select"; options?: { value: string; label: string }[] }[];
  defaultValue: T[];
  addLabel?: string;
  label?: string;
  hint?: string;
}) {
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""])) as T;
  const [rows, setRows] = useState<T[]>(defaultValue.length ? defaultValue : []);
  return (
    <div>
      {label ? <span className="field-label">{label}</span> : null}
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-2 items-start gap-2 rounded-xl border border-line p-2 sm:flex sm:flex-wrap">
            {columns.map((c) =>
              c.type === "select" ? (
                <select
                  key={c.key}
                  value={row[c.key] ?? ""}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                  className="input !min-h-10"
                  style={{ width: c.width }}
                  aria-label={c.label}
                >
                  {c.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  key={c.key}
                  value={row[c.key] ?? ""}
                  placeholder={c.placeholder ?? c.label}
                  dir={c.dir}
                  aria-label={c.label}
                  onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                  className="input !min-h-11 min-w-0 flex-1 sm:min-w-24"
                  style={c.width ? { width: c.width, flex: "none" } : undefined}
                />
              ),
            )}
            <button type="button" className="btn btn-ghost btn-icon !size-10 shrink-0 text-muted hover:text-urgency" aria-label="حذف ردیف" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-outline btn-sm mt-2" onClick={() => setRows([...rows, blank()])}>
        + {addLabel}
      </button>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
