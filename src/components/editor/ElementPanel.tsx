"use client";

import { ELEMENT_ACTIONS, type Action, type KeyboardPhysicalLayout, type Layer } from "@/lib/schemas";

/** 選んだ要素の、操作ごとの表示名を入力する欄(P5-3) */

export const ACTION_NAMES: Record<Action, string> = {
  press: "タップ(普通に押す)",
  hold: "長押し",
  cw: "右回し",
  ccw: "左回し",
  up: "上",
  down: "下",
  left: "左",
  right: "右",
  tap: "タップ",
};

const TYPE_NAMES = { key: "キー", dial: "ダイヤル", scrollpad: "スクロールパッド", trackball: "トラックボール" } as const;

export function ElementPanel({
  physicalLayout,
  layer,
  elementId,
  onChange,
  onClose,
}: {
  physicalLayout: KeyboardPhysicalLayout;
  layer: Layer;
  elementId: string;
  onChange: (action: Action, label: string) => void;
  onClose: () => void;
}) {
  const element = physicalLayout.elements.find((e) => e.id === elementId);
  if (!element) return null;
  const typeName = TYPE_NAMES[element.type];
  const title = element.legend && element.legend !== typeName ? `${element.legend}(${typeName})` : typeName;

  return (
    <section aria-label="割り当ての編集" className="flex flex-col gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold">{`${title} — ${layer.layerName}`}</h3>
        <button type="button" onClick={onClose} className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm hover:bg-zinc-100">
          閉じる
        </button>
      </div>
      <p className="text-xs text-zinc-600">
        キーに表示する名前を入力します(例: Ctrl、変換、左クリック)。空にすると、その操作の割り当てがなくなります。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ELEMENT_ACTIONS[element.type].map((action) => {
          const value = layer.assignments.find((a) => a.elementId === elementId && a.action === action)?.label ?? "";
          return (
            <label key={action} className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-zinc-700">{ACTION_NAMES[action]}</span>
              <input
                type="text"
                value={value}
                maxLength={40}
                onChange={(e) => onChange(action, e.target.value)}
                data-action={action}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
