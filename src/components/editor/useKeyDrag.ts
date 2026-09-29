"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * エディタのドラッグ&ドロップ(P5-10・P5-11)。ブラウザ標準のポインターイベントで、マウスでも指でも動く。
 * - 少し動かす(6px)まではドラッグとみなさず、離したときにタップとして onTap を呼ぶ
 *   (指で素早くタップすると、ブラウザが click イベントを出さないことがあるため、click には頼らない。
 *   click はキーボードで押したとき(event.detail === 0)だけ、それぞれの部品で扱う)
 * - 離した位置の下にあるキー図の要素([data-element-id])を、ドロップ先にする
 * - ドラッグ中は、指やカーソルの位置に名前を表示し(ghost)、その下にある要素(離したら入る場所)を overElementId で知らせる
 */

export type DragSource = { kind: "palette"; label: string } | { kind: "element"; elementId: string; label: string };

/** active: しきい値を超えて動かし、ドラッグとして扱っている */
type Pending = { source: DragSource; startX: number; startY: number; pointerId: number; active: boolean };

const THRESHOLD = 6;

/** 画面上の位置にあるキー図の要素。ドラッグ中の名前(ghost)は pointer-events: none なので、その下の要素が見つかる */
function elementIdAt(x: number, y: number): string | null {
  return document.elementFromPoint(x, y)?.closest("[data-element-id]")?.getAttribute("data-element-id") ?? null;
}

export function useKeyDrag(
  onDrop: (source: DragSource, targetElementId: string | null) => void,
  onTap: (source: DragSource) => void
) {
  const pending = useRef<Pending | null>(null);
  const [ghost, setGhost] = useState<{ label: string; x: number; y: number; source: DragSource } | null>(null);
  /** ドラッグ中に、指やカーソルの下にある要素(離したらここに入る) */
  const [overElementId, setOverElementId] = useState<string | null>(null);
  const onDropRef = useRef(onDrop);
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onDropRef.current = onDrop;
    onTapRef.current = onTap;
  }, [onDrop, onTap]);

  useEffect(() => {
    function move(e: PointerEvent) {
      const p = pending.current;
      if (!p || e.pointerId !== p.pointerId) return;
      if (!p.active && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > THRESHOLD) p.active = true;
      if (p.active) {
        setGhost({ label: p.source.label, x: e.clientX, y: e.clientY, source: p.source });
        setOverElementId(elementIdAt(e.clientX, e.clientY));
      }
    }
    function up(e: PointerEvent) {
      const p = pending.current;
      if (!p || e.pointerId !== p.pointerId) return;
      pending.current = null;
      setGhost(null);
      setOverElementId(null);
      if (!p.active) {
        // 動かしていなければタップ
        onTapRef.current(p.source);
        return;
      }
      onDropRef.current(p.source, elementIdAt(e.clientX, e.clientY));
    }
    function cancel() {
      pending.current = null;
      setGhost(null);
      setOverElementId(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  /** ドラッグを始められる部品の pointerdown で呼ぶ */
  const start = useCallback((source: DragSource, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pending.current = { source, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId, active: false };
  }, []);

  return { ghost, overElementId, start };
}
