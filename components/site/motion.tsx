"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let activeLenis: Lenis | null = null;
export function getLenis() {
  return activeLenis;
}

export function SiteMotion({
  smooth,
  cursor,
  animate,
  word,
  children,
}: {
  smooth: boolean;
  cursor: boolean;
  animate: boolean;
  word: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) document.documentElement.dataset.reduce = "1";
    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 900px)").matches;
    if (cursor && fine && wide && !reduce) document.documentElement.classList.add("has-cursor");
    return () => document.documentElement.classList.remove("has-cursor");
  }, [cursor]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!smooth || reduce) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      autoRaf: false,
      anchors: true,
      allowNestedScroll: true,
      respectReducedMotion: true,
    });
    activeLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, [smooth]);

  return (
    <>
      {animate ? <Preloader word={word} /> : null}
      {cursor ? <Cursor /> : null}
      {children}
    </>
  );
}

function Preloader({ word }: { word: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("ds-introduced") === "1") return;
    sessionStorage.setItem("ds-introduced", "1");
    setOn(true);
    const timer = window.setTimeout(() => setOn(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);
  if (!on) return null;
  return (
    <div className="preloader" aria-hidden>
      <span className="preloader-bar" />
      <strong>{word}</strong>
    </div>
  );
}

function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches && window.matchMedia("(min-width: 900px)").matches;
    if (!fine || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
    };
    window.addEventListener("pointermove", move);
    let frame = 0;
    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <div ref={ring} className="cursor-move">
      <div className="cursor-ring" />
    </div>
  );
}

export function PageTransition({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const block = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = block.current;
    if (!enabled || !node) return;
    const hide = window.setTimeout(() => {
      node.style.display = "none";
    }, 1200);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.display = "none";
      return () => window.clearTimeout(hide);
    }
    const tween = gsap.fromTo(node, { scaleY: 1 }, { scaleY: 0, duration: 0.7, ease: "power4.inOut", transformOrigin: "top" });
    return () => {
      window.clearTimeout(hide);
      tween.kill();
    };
  }, [enabled]);
  if (!enabled) return children;
  return (
    <>
      <div ref={block} className="page-wipe" />
      {children}
    </>
  );
}
