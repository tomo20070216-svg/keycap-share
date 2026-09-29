"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 固定サイズのキー図(KeymapDiagram)を、親要素の幅に合わせて縮小表示する(画面表示専用)。
 * 文字(HTML)と図形(SVG)をまとめて縮めるため、図全体に transform: scale をかける。
 * 元のサイズより大きくはしない。
 */
export function ResponsiveKeymap({
  width,
  height,
  children,
}: {
  /** KeymapDiagram の元のサイズ(getKeymapDiagramSize の結果) */
  width: number;
  height: number;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [width]);

  return (
    // contain: inline-size で、中の図の元の幅が親要素の幅を押し広げないようにする。
    // overflow: clip で、はみ出しを隠しつつスクロールもさせない。縮小しても中のボタンの場所(縮小前の大きさ)は
    // 外枠より大きいままなので、hidden だとボタンにフォーカスが当たったときなどに外枠がスクロールして図がずれる。
    // clip に対応していない古いブラウザでは hidden になるので、スクロールしてしまったら元に戻す
    <div
      ref={containerRef}
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
      style={{ width: "100%", maxWidth: width, height: height * scale, overflow: "clip", contain: "inline-size" }}
    >
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
