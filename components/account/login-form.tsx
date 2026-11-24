"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { requestOtpAction, verifyOtpAction } from "@/lib/actions/shop";

export function AccountLoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"mobile" | "code">("mobile");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [retryIn, setRetryIn] = useState(0);
  const [pending, start] = useTransition();

  const send = () => {
    start(async () => {
      const result = await requestOtpAction(mobile);
      setMessage(result.message);
      if (result.ok) {
        setStep("code");
        setDevCode(result.devCode);
        setRetryIn(result.retryIn ?? 60);
      }
    });
  };

  const verify = () => {
    start(async () => {
      const result = await verifyOtpAction(mobile, code, next);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      router.push(result.redirect);
      router.refresh();
    });
  };

  return (
    <AccountLoginCard message={message} pending={pending} step={step} mobile={mobile} setMobile={setMobile} code={code} setCode={setCode} devCode={devCode} retryIn={retryIn} send={send} verify={verify} setStep={setStep} />
  );
}

function AccountLoginCard({
  message,
  pending,
  step,
  mobile,
  setMobile,
  code,
  setCode,
  devCode,
  retryIn,
  send,
  verify,
  setStep,
}: {
  message: string;
  pending: boolean;
  step: "mobile" | "code";
  mobile: string;
  setMobile: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  devCode?: string;
  retryIn: number;
  send: () => void;
  verify: () => void;
  setStep: (s: "mobile" | "code") => void;
}) {
  return (
    <div className="card mx-auto max-w-md p-6 md:p-8">
      <h1 className="font-display text-[1.5rem] font-extrabold">ورود یا ثبت‌نام</h1>
      <p className="mt-2 text-[0.88rem] leading-7 text-muted">کد یک‌بارمصرف به موبایل شما پیامک می‌شود. نیازی به رمز عبور نیست.</p>
      {step === "mobile" ? (
        <>
          <label className="mt-6 grid gap-2 text-[0.85rem] font-semibold">
            شماره موبایل
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="field text-base" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" />
          </label>
          <button type="button" disabled={pending || mobile.length < 10} onClick={send} className="btn btn-primary btn-lg mt-4 w-full">
            {pending ? "در حال ارسال…" : "دریافت کد"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-[0.85rem] text-muted">
            کد برای <b dir="ltr">{mobile}</b> ارسال شد.
            <button type="button" className="ms-2 text-primary hover:underline" onClick={() => setStep("mobile")}>
              تغییر شماره
            </button>
          </p>
          <label className="mt-4 grid gap-2 text-[0.85rem] font-semibold">
            کد ۵ رقمی
            <input value={code} onChange={(e) => setCode(e.target.value)} className="field text-center text-[1.25rem] tracking-[0.3em]" dir="ltr" inputMode="numeric" maxLength={5} autoComplete="one-time-code" />
          </label>
          {devCode ? <p className="mt-2 text-[0.8rem] text-success">کد توسعه: {devCode}</p> : null}
          <button type="button" disabled={pending || code.length < 5} onClick={verify} className="btn btn-primary btn-lg mt-4 w-full">
            {pending ? "در حال ورود…" : "ورود"}
          </button>
          <button type="button" disabled={pending || retryIn > 0} onClick={send} className="btn btn-ghost mt-2 w-full text-[0.85rem]">
            {retryIn > 0 ? `ارسال مجدد تا ${retryIn} ثانیه` : "ارسال مجدد کد"}
          </button>
        </>
      )}
      {message ? <p className="mt-4 text-center text-[0.85rem] text-muted">{message}</p> : null}
    </div>
  );
}