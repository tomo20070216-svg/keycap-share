"use client";

import { actionName } from "@/components/editor/ElementPanel";
import { ELEMENT_ACTIONS, type Action, type ElementType } from "@/lib/schemas";

/** ダイヤル・トラックボール・スクロールパッドにキーを置くとき、どの操作に入れるかを選ぶ(P5-11) */
export function ActionChooser({
  label,
  elementName,
  elementType,
  onChoose,
  onCancel,
}: {
  label: string;
  elementName: string;
  elementType: ElementType;
  onChoose: (action: Action) => void;
  onCancel: () => void;
}) {
  return (
    <section role="dialog" aria-label="操作を選ぶ" className="flex flex-col gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
      <div className="text-sm font-bold">{`「${label}」を${elementName}のどの操作に入れますか?`}</div>
      <div className="flex flex-wrap gap-2">
        {ELEMENT_ACTIONS[elementType].map((action) => (
          <button
            key={action}
            type="button"
            data-choose-action={action}
            onClick={() => onChoose(action)}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-zinc-700"
          >
            {actionName(elementType, action)}
          </button>
        ))}
        <button type="button" onClick={onCancel} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100">
          やめる
        </button>
      </div>
    </section>
  );
}
