"use client";

import { useState } from "react";
import { KEY_PALETTE } from "@/lib/key-palette";

/**
 * キーの一覧(パレット)(P5-10)。
 * キーをキー図へドラッグして置く。または、キーをタップしてからキー図のキーをタップして置く。
 */
export function KeyPalette({
  armedLabel,
  onPointerDownKey,
  onTapKey,
}: {
  /** タップで選んでいるキー(次にキー図をタップすると置かれる) */
  armedLabel: string | null;
  onPointerDownKey: (label: string, e: React.PointerEvent) => void;
  onTapKey: (label: string) => void;
}) {
  const [categoryId, setCategoryId] = useState(KEY_PALETTE[0].id);
  const category = KEY_PALETTE.find((c) => c.id === categoryId) ?? KEY_PALETTE[0];

  return (
    <section aria-label="キーの一覧" className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
      <div className="text-sm font-bold">キーの一覧</div>
      <p className="text-xs text-zinc-600">
        キーをキー図へドラッグして置けます(タップしてから、キー図のキーをタップしても置けます)。
      </p>
      <div role="tablist" aria-label="キーの種類" className="flex flex-wrap gap-1">
        {KEY_PALETTE.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === category.id}
            onClick={() => setCategoryId(c.id)}
            className={`rounded-full px-3 py-1 text-xs ${c.id === category.id ? "bg-zinc-900 text-white" : "bg-zinc-100 hover:bg-zinc-200"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto" data-testid="palette-keys">
        {category.keys.map((key) => (
          <button
            key={key.label}
            type="button"
            title={key.hint}
            data-palette-label={key.label}
            aria-pressed={armedLabel === key.label}
            onPointerDown={(e) => onPointerDownKey(key.label, e)}
            // マウス・指のタップは onPointerDown からの処理(useKeyDrag)で扱う。click はキーボードで押したときだけ
            onClick={(e) => {
              if (e.detail === 0) onTapKey(key.label);
            }}
            style={{ touchAction: "none" }}
            className={`cursor-grab select-none rounded-md border px-2.5 py-1.5 text-sm font-bold active:cursor-grabbing ${
              armedLabel === key.label ? "border-amber-500 bg-amber-100" : "border-zinc-300 bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            {key.label}
          </button>
        ))}
      </div>
    </section>
  );
}
