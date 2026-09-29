"use client";

import { KeymapDiagram, diagramItemBox, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import type { Combo, ElementType, KeyboardPhysicalLayout, Layer } from "@/lib/schemas";

/**
 * クリックできるキー図(エディタ用)。描画は画面・OGP画像と同じ KeymapDiagram のまま(plan.md 方針3)で、
 * その上に、描画用データと同じ座標で透明なボタンを重ねる。
 */

const TYPE_NAMES: Record<ElementType, string> = {
  key: "キー",
  dial: "ダイヤル",
  scrollpad: "スクロールパッド",
  trackball: "トラックボール",
};

export function EditableKeymap({
  physicalLayout,
  layer,
  combos,
  selectedElementId,
  pickedElementIds,
  onElementClick,
}: {
  physicalLayout: KeyboardPhysicalLayout;
  layer: Layer;
  combos: Combo[];
  selectedElementId: string | null;
  /** コンボのキーを選んでいるときの、選ばれているキー */
  pickedElementIds: string[] | null;
  onElementClick: (elementId: string) => void;
}) {
  // 描きかけのコンボ(キーが2つ未満)は番号を付けない
  const drawableCombos = combos.filter((c) => c.elementIds.length >= 2);
  const model = buildKeymapRenderModel(physicalLayout, layer, { combos: drawableCombos });
  const size = getKeymapDiagramSize(model);
  const picking = pickedElementIds !== null;

  return (
    <ResponsiveKeymap width={size.width} height={size.height}>
      <div style={{ position: "relative", width: size.width, height: size.height }}>
        <KeymapDiagram physicalLayout={physicalLayout} layer={layer} combos={drawableCombos} />
        {model.items.map((item) => {
          const b = diagramItemBox(item);
          const selected = !picking && item.elementId === selectedElementId;
          const picked = picking && pickedElementIds.includes(item.elementId);
          // コンボのキーを選んでいるときは、キー以外は選べない
          const disabled = picking && item.type !== "key";
          const name = item.legend ? `${item.legend}(${TYPE_NAMES[item.type]})` : TYPE_NAMES[item.type];
          return (
            <button
              key={item.elementId}
              type="button"
              data-element-id={item.elementId}
              aria-label={picking ? `${name}をコンボの対象にする` : `${name}の割り当てを編集`}
              aria-pressed={picking ? picked : selected}
              disabled={disabled}
              onClick={() => onElementClick(item.elementId)}
              style={{
                position: "absolute",
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
                transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                background: "transparent",
                borderRadius: item.type === "trackball" || item.type === "scrollpad" ? Math.min(b.width, b.height) / 2 : 8,
                outline: selected ? "3px solid #f59e0b" : picked ? "3px dashed #2563eb" : "none",
                outlineOffset: 2,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              className="hover:bg-amber-300/20 focus-visible:bg-amber-300/30"
            />
          );
        })}
      </div>
    </ResponsiveKeymap>
  );
}
