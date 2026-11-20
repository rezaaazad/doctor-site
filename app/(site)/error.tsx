"use client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="wrap pad py-16">
      <h1 className="h1">صفحه درست بار نشد.</h1>
      <button type="button" className="btn mt-6" onClick={reset}>دوباره</button>
    </div>
  );
}
