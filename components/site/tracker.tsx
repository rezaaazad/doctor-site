"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    const payload = JSON.stringify({ path, referrer: document.referrer || "" });
    void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
  }, [path]);
  return null;
}
