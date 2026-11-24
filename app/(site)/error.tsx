"use client";
import { EmptyState } from "@/components/ui/bits";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap pad py-16">
      <EmptyState title="صفحه درست بار نشد." body="لطفاً دوباره تلاش کنید." action={<button type="button" className="btn btn-primary" onClick={reset}>تلاش مجدد</button>}/>
    </div>
  );
}
