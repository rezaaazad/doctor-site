"use client";

import { useState, useTransition } from "react";
import { submitBrief } from "@/lib/actions/project";
import type { Question } from "@/lib/store/project";

export function BriefForm({ number, accessKey, fields }: { number: number; accessKey: string; fields: Question[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError("");
        start(async () => {
          try {
            await submitBrief(number, accessKey, data);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "ثبت بریف انجام نشد.");
          }
        });
      }}
    >
      {fields.map((question) => (
        <label key={question.id}>
          {question.title}
          {question.required ? " *" : ""}
          <textarea className="field w-full" name={question.id} required={question.required} maxLength={2000} />
        </label>
      ))}
      {error ? <p className="text-sm font-bold text-urgency">{error}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "در حال ثبت…" : "ثبت بریف و شروع پروژه"}
      </button>
    </form>
  );
}
