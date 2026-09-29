"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { shouldStartProgress } from "@/lib/navigation-progress";

/**
 * 画面上部の進み具合のバー(P7-11)。リンクを押した瞬間に出て、次の画面が表示されると伸びきって消える。
 * 画面の切り替えに時間がかかっても「押したのに反応がない」ように見えないようにする。
 * (loading.tsx を使うと、存在しないページでも 404 ではなく 200 が返るようになるため使わない)
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<"idle" | "start" | "loading" | "done">("idle");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // リンクを押したときに始める(ほかの処理より先に気づけるよう、捕捉の段階で見る)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const start = shouldStartProgress({
        href: anchor.getAttribute("href"),
        target: anchor.getAttribute("target"),
        download: anchor.hasAttribute("download"),
        button: e.button,
        modified: e.metaKey || e.ctrlKey || e.shiftKey || e.altKey,
        defaultPrevented: e.defaultPrevented,
        currentUrl: window.location.href,
      });
      if (!start) return;
      clearTimers();
      setPhase("start");
      // 次の描画で、ゆっくり伸ばし始める(いきなり伸びきらないように)
      timers.current.push(window.setTimeout(() => setPhase("loading"), 20));
      // 何かの理由で画面が切り替わらなかったときは、しばらくして消す
      timers.current.push(window.setTimeout(() => setPhase("idle"), 20000));
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // 画面(URL)が変わったら、伸びきってから消す(描画中に自分の状態を直す、React の決まった書き方)
  const urlKey = `${pathname}?${search}`;
  const [prevUrlKey, setPrevUrlKey] = useState(urlKey);
  if (urlKey !== prevUrlKey) {
    setPrevUrlKey(urlKey);
    if (phase !== "idle") setPhase("done");
  }
  useEffect(() => {
    if (phase !== "done") return;
    clearTimers();
    timers.current.push(window.setTimeout(() => setPhase("idle"), 400));
  }, [phase]);

  useEffect(() => clearTimers, []);

  const width = { idle: "0%", start: "8%", loading: "85%", done: "100%" }[phase];
  const transition = {
    idle: "none",
    start: "none",
    loading: "width 8s cubic-bezier(0.1, 0.7, 0.2, 1)",
    done: "width 200ms ease-out, opacity 300ms ease 150ms",
  }[phase];

  return (
    <div
      aria-hidden
      data-testid="nav-progress"
      data-phase={phase}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        height: 3,
        width,
        opacity: phase === "idle" || phase === "done" ? 0 : 1,
        transition,
        background: "linear-gradient(90deg, #0ea5e9, #22d3ee)",
        boxShadow: "0 0 8px rgba(14,165,233,0.6)",
        pointerEvents: "none",
      }}
    />
  );
}
