"use client";

import { useEffect, useRef } from "react";

export function TrustHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = html;
    node.querySelectorAll("script").forEach((old) => {
      const script = document.createElement("script");
      for (const attr of old.attributes) script.setAttribute(attr.name, attr.value);
      script.text = old.text;
      old.replaceWith(script);
    });
  }, [html]);
  if (!html.trim()) return null;
  return <div ref={ref} className="trust-slot" />;
}
