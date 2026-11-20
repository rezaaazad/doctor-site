"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

const LiquidScene = dynamic(() => import("./liquid-scene").then((mod) => mod.LiquidScene), { ssr: false });

class Boundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Sculpture({
  enabled,
  shape,
  colorA,
  colorB,
  speed,
  particles,
  words,
}: {
  enabled: boolean;
  shape: string;
  colorA: string;
  colorB: string;
  speed: number;
  particles: number;
  words: string;
}) {
  const [mode, setMode] = useState<"wait" | "webgl" | "fallback">("wait");
  const [mobile, setMobile] = useState(true);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMobile(narrow);
    if (!enabled) {
      setMode("fallback");
      return;
    }
    if (reduce) setActive(false);
    const timer = window.setTimeout(() => setMode("webgl"), 80);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    const node = document.querySelector("[data-hero-stage]");
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  const list = words.split(/[,،]/).map((word) => word.trim()).filter(Boolean);
  const count = Math.max(0, Math.min(mobile ? 380 : 1200, particles));

  return (
    <div className="absolute inset-0">
      <div className="grid h-full place-items-center" aria-hidden style={{ opacity: mode === "webgl" ? 0 : 1 }}>
        <svg viewBox="0 0 200 200" width="78%" height="78%">
          <defs>
            <radialGradient id="metal" cx="35%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#f4f4f2" />
              <stop offset="18%" stopColor="#8d929c" />
              <stop offset="55%" stopColor="#16181d" />
              <stop offset="100%" stopColor="#070708" />
            </radialGradient>
          </defs>
          <path
            fill="url(#metal)"
            d="M100 18c28 4 48 18 58 40 10 22 8 40-2 58-12 22-10 36-28 48-20 14-48 18-70 6-24-12-40-34-42-60-2-28 14-58 40-74 12-8 28-14 44-18z"
          />
          <path d="M46 78c18-22 48-30 74-18" fill="none" stroke={colorA} strokeWidth="1.4" opacity="0.9" />
        </svg>
      </div>
      {mode === "webgl" ? (
        <div className="absolute inset-0">
          <Boundary onFail={() => setMode("fallback")}>
            <LiquidScene
              shape={shape}
              colorA={colorA}
              colorB={colorB}
              speed={speed}
              count={count}
              words={list}
              mobile={mobile}
              active={active}
            />
          </Boundary>
        </div>
      ) : null}
    </div>
  );
}
