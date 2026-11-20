"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, null as ActionState);
  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="grid gap-2">
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required dir="ltr" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">رمز عبور</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state && !state.ok ? <p className="text-sm text-red-300">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "در حال بررسی…" : "ورود"}</Button>
    </form>
  );
}
