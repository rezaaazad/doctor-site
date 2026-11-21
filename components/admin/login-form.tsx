"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginStaffAction } from "@/lib/actions/admin/session";
import type { AdminState } from "@/lib/admin/action";
import { Field, FormMessage, Input, SubmitButton } from "@/components/ui/form";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action] = useActionState(loginStaffAction, null as AdminState);
  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
      <Field label="ایمیل" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required dir="ltr" placeholder="you@example.com" />
      </Field>
      <Field label="رمز عبور" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="ink" size="lg" className="w-full" pendingText="در حال بررسی…">
        <LockKeyhole className="size-4" aria-hidden />
        ورود به پنل
      </SubmitButton>
    </form>
  );
}
