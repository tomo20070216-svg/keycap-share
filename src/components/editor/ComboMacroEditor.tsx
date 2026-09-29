"use client";

import { ComboNumberBadge } from "@/components/KeymapDiagram";
import type { EditorAction } from "@/lib/editor-state";
import type { Combo, KeyboardPhysicalLayout, Layer, Macro } from "@/lib/schemas";

/** コンボ(同時押し)とマクロの入力(P5-5) */

function keyName(physicalLayout: KeyboardPhysicalLayout, id: string) {
  return physicalLayout.elements.find((e) => e.id === id)?.legend ?? id;
}

export function ComboEditor({
  physicalLayout,
  layers,
  combos,
  comboPicking,
  dispatch,
}: {
  physicalLayout: KeyboardPhysicalLayout;
  layers: Layer[];
  combos: Combo[];
  comboPicking: number | null;
  dispatch: (action: EditorAction) => void;
}) {
  return (
    <section aria-labelledby="combo-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id="combo-heading" className="text-base font-bold">
          コンボ(同時押し)
        </h3>
        <button
          type="button"
          onClick={() => dispatch({ type: "addCombo" })}
          disabled={combos.length >= 50}
          className="rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40"
        >
          ＋ コンボを追加
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        複数のキーを同時に押すと、別の入力になる設定です。キーを2つ以上選び、表示名を入力してください。
      </p>
      {combos.map((combo, index) => {
        const picking = comboPicking === index;
        return (
          <div
            key={index}
            className={`flex flex-col gap-2 rounded-lg border p-3 ${picking ? "border-2 border-blue-500 bg-blue-50" : "border-zinc-200"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <ComboNumberBadge number={index + 1} size={22} fontFamily="inherit" />
              <span className="text-sm font-bold">
                {combo.elementIds.length > 0 ? combo.elementIds.map((id) => keyName(physicalLayout, id)).join(" + ") : "(キー未選択)"}
              </span>
              {picking ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "stopComboPicking" })}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm font-bold text-white hover:bg-blue-500"
                >
                  キーを選び終える
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "startComboPicking", index })}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
                >
                  キーを選び直す
                </button>
              )}
              <button
                type="button"
                onClick={() => dispatch({ type: "removeCombo", index })}
                className="ml-auto rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                削除
              </button>
            </div>
            {picking && (
              <p role="status" className="text-sm text-blue-800">
                キー図のキーをクリックして、同時に押すキーを選んでください(もう一度クリックすると外れます)。
              </p>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">表示名(例: 左クリック)</span>
              <input
                type="text"
                value={combo.label}
                maxLength={40}
                onChange={(e) => dispatch({ type: "setComboLabel", index, label: e.target.value })}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5"
              />
            </label>
            <fieldset className="flex flex-wrap items-center gap-3 text-sm">
              <legend className="mb-1 text-zinc-600">
                対象レイヤー(どれも選ばなければ全レイヤー共通)
              </legend>
              {layers.map((layer) => (
                <label key={layer.layerNumber} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={combo.layerNumbers.includes(layer.layerNumber)}
                    onChange={() => dispatch({ type: "toggleComboLayer", index, layerNumber: layer.layerNumber })}
                  />
                  {layer.layerName || `レイヤー${layer.layerNumber}`}
                </label>
              ))}
            </fieldset>
          </div>
        );
      })}
    </section>
  );
}

export function MacroEditor({ macros, dispatch }: { macros: Macro[]; dispatch: (action: EditorAction) => void }) {
  return (
    <section aria-labelledby="macro-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id="macro-heading" className="text-base font-bold">
          マクロ
        </h3>
        <button
          type="button"
          onClick={() => dispatch({ type: "addMacro" })}
          disabled={macros.length >= 50}
          className="rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40"
        >
          ＋ マクロを追加
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        一連のキー操作を1つのキーに登録する設定です。キーの表示名にマクロの名前を入れ、ここで中身を説明してください。
      </p>
      {macros.map((macro, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm sm:w-48">
            <span className="text-zinc-600">名前(例: 署名)</span>
            <input
              type="text"
              value={macro.name}
              maxLength={20}
              onChange={(e) => dispatch({ type: "setMacro", index, field: "name", value: e.target.value })}
              className="rounded-md border border-zinc-300 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-zinc-600">説明(例: 「よろしくお願いします。」と入力)</span>
            <input
              type="text"
              value={macro.description}
              maxLength={200}
              onChange={(e) => dispatch({ type: "setMacro", index, field: "description", value: e.target.value })}
              className="rounded-md border border-zinc-300 px-2 py-1.5"
            />
          </label>
          <button
            type="button"
            onClick={() => dispatch({ type: "removeMacro", index })}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      ))}
    </section>
  );
}
