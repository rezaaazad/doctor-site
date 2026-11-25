"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { moveRecord, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useAdminFeedback } from "./feedback";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  useAdminFeedback(state);
  if (!state) return null;
  return (
    <p role="status" className={state.ok ? "text-sm text-primary" : "text-sm text-urgency"}>
      {state.message}
    </p>
  );
}

export function SaveButton({ children = "ذخیره" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <span className="admin-save-bar"><Button type="submit" disabled={pending}>
      {pending ? "در حال ذخیره…" : children}
    </Button></span>
  );
}

export function SwitchField({ name, label, defaultOn = false }: { name: string; label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="text-sm">{label}</span>
      <input type="hidden" name={name} value={on ? "1" : "0"} />
      <Switch checked={on} onCheckedChange={setOn} aria-label={label} />
    </div>
  );
}

export function OrderButtons({ kind, id }: { kind: string; id: string }) {
  return (
    <div className="flex gap-2">
      <form action={moveRecord}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="up" />
        <Button type="submit" variant="ghost" size="sm">بالا</Button>
      </form>
      <form action={moveRecord}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="dir" value="down" />
        <Button type="submit" variant="ghost" size="sm">پایین</Button>
      </form>
    </div>
  );
}

export function ConfirmButton({
  action,
  label = "حذف",
  title = "حذف شود؟",
}: {
  action: () => Promise<void>;
  label?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="danger" size="sm">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>این مورد از سایت حذف می‌شود.</DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">انصراف</Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => start(async () => {
              await action();
              setOpen(false);
            })}
          >
            {pending ? "…" : "حذف"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
