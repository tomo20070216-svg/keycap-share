"use client";

import { MAX_LAYERS, baseLayerNumber, type EditorAction } from "@/lib/editor-state";
import type { Layer } from "@/lib/schemas";

/** レイヤーの切り替え・追加・名前の変更・削除(P5-4)。基本レイヤー(番号が最小)は削除できない */
export function LayerTabs({
  layers,
  currentLayer,
  dispatch,
}: {
  layers: Layer[];
  currentLayer: number;
  dispatch: (action: EditorAction) => void;
}) {
  const base = baseLayerNumber(layers);
  const current = layers.find((l) => l.layerNumber === currentLayer);
  return (
    <section aria-label="レイヤー" className="flex flex-col gap-2">
      <div role="tablist" className="flex flex-wrap items-center gap-2">
        {layers.map((layer) => (
          <button
            key={layer.layerNumber}
            type="button"
            role="tab"
            aria-selected={layer.layerNumber === currentLayer}
            onClick={() => dispatch({ type: "selectLayer", layerNumber: layer.layerNumber })}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              layer.layerNumber === currentLayer ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 hover:bg-zinc-100"
            }`}
          >
            {`${layer.layerNumber}: ${layer.layerName || "(名前なし)"}`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: "addLayer" })}
          disabled={layers.length >= MAX_LAYERS}
          className="rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40"
        >
          ＋ レイヤーを追加
        </button>
      </div>
      {current && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">{`レイヤー${current.layerNumber}の名前`}</span>
            <input
              type="text"
              value={current.layerName}
              maxLength={40}
              onChange={(e) => dispatch({ type: "renameLayer", layerNumber: current.layerNumber, name: e.target.value })}
              className="rounded-md border border-zinc-300 px-2 py-1.5"
            />
          </label>
          {current.layerNumber === base ? (
            <span className="pb-2 text-xs text-zinc-500">基本レイヤーは削除できません</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`レイヤー「${current.layerName}」を削除します。このレイヤーの割り当ても消えます。よろしいですか?`)) {
                  dispatch({ type: "removeLayer", layerNumber: current.layerNumber });
                }
              }}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              このレイヤーを削除
            </button>
          )}
        </div>
      )}
      <p className="text-xs text-zinc-500">
        レイヤー = キーボードの「面」のことです。fnキーなどを押している間は、別のレイヤーの割り当てに切り替わります(最大{MAX_LAYERS}個)。
      </p>
    </section>
  );
}
