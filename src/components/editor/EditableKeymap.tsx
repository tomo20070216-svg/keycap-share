"use client";

import { KeymapDiagram, diagramItemBox, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import type { Combo, ElementType, KeyboardPhysicalLayout, Layer, Side } from "@/lib/schemas";

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

/**
 * 広い画面では左右を並べた1枚、狭い画面(スマホなど)では左手・右手を縦に並べて大きく表示する
 * (閲覧ページの P3-4 と同じ考え方。指で狙いやすくするため)。
 */
export function EditableKeymap(props: Omit<EditableKeymapSideProps, "side">) {
  return (
    <>
      <div className="hidden md:block">
        <EditableKeymapSide {...props} />
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold text-zinc-500">左手</div>
          <EditableKeymapSide {...props} side="left" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold text-zinc-500">右手</div>
          <EditableKeymapSide {...props} side="right" />
        </div>
      </div>
    </>
  );
}

type EditableKeymapSideProps = {
  physicalLayout: KeyboardPhysicalLayout;
  layer: Layer;
  combos: Combo[];
  selectedElementId: string | null;
  /** コンボのキーを選んでいるときの、選ばれているキー */
  pickedElementIds: string[] | null;
  onElementClick: (elementId: string) => void;
  /** ドラッグ(入れ替え)とタップを扱うため(useKeyDrag)。指定しないときは click でタップを扱う */
  onElementPointerDown?: (elementId: string, e: React.PointerEvent) => void;
  /** 片側だけを描く */
  side?: Side;
  /** ドラッグ中に、離したら入る場所(緑の枠 = 置ける/入れ替えられる、赤の枠 = できない) */
  dropTarget?: { elementId: string; allowed: boolean } | null;
  /** タップでの入れ替え(P7-3)で選んだ入れ替え元(紫の点線の枠) */
  swapSourceId?: string | null;
};

function EditableKeymapSide({
  physicalLayout,
  layer,
  combos,
  selectedElementId,
  pickedElementIds,
  onElementClick,
  onElementPointerDown,
  side,
  dropTarget,
  swapSourceId,
}: EditableKeymapSideProps) {
  // 描きかけのコンボ(キーが2つ未満)は番号を付けない
  const drawableCombos = combos.filter((c) => c.elementIds.length >= 2);
  const model = buildKeymapRenderModel(physicalLayout, layer, { combos: drawableCombos, side });
  const size = getKeymapDiagramSize(model);
  const picking = pickedElementIds !== null;

  return (
    <ResponsiveKeymap width={size.width} height={size.height}>
      <div style={{ position: "relative", width: size.width, height: size.height }}>
        <KeymapDiagram physicalLayout={physicalLayout} layer={layer} combos={drawableCombos} side={side} />
        {model.items.map((item) => {
          const b = diagramItemBox(item);
          const selected = !picking && item.elementId === selectedElementId;
          const picked = picking && pickedElementIds.includes(item.elementId);
          const dropHere = dropTarget?.elementId === item.elementId ? dropTarget : null;
          const swapSource = !picking && item.elementId === swapSourceId;
          // コンボのキーを選んでいるときは、キー以外は選べない
          const disabled = picking && item.type !== "key";
          const typeName = TYPE_NAMES[item.type];
          const name = item.legend && item.legend !== typeName ? `${item.legend}(${typeName})` : typeName;
          return (
            <button
              key={item.elementId}
              type="button"
              data-element-id={item.elementId}
              aria-label={
                picking ? `${name}をコンボの対象にする` : swapSourceId ? `${name}と入れ替える` : `${name}の割り当てを編集`
              }
              aria-pressed={picking ? picked : selected || swapSource}
              disabled={disabled}
              // マウス・指のタップは onPointerDown からの処理(useKeyDrag)で扱う。click はキーボードで押したときだけ
              onClick={(e) => {
                if (e.detail === 0 || !onElementPointerDown) onElementClick(item.elementId);
              }}
              onPointerDown={onElementPointerDown ? (e) => onElementPointerDown(item.elementId, e) : undefined}
              style={{
                position: "absolute",
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
                transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                borderRadius: item.type === "trackball" || item.type === "scrollpad" ? Math.min(b.width, b.height) / 2 : 8,
                outline: dropHere
                  ? `4px solid ${dropHere.allowed ? "#16a34a" : "#dc2626"}`
                  : swapSource
                    ? "4px dashed #7c3aed"
                    : selected
                      ? "3px solid #f59e0b"
                      : picked
                        ? "3px dashed #2563eb"
                        : "none",
                outlineOffset: 2,
                backgroundColor: dropHere ? (dropHere.allowed ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.2)") : "transparent",
                cursor: disabled ? "not-allowed" : "pointer",
                // 指でのドラッグ中に画面がスクロールしないようにする
                touchAction: picking ? "auto" : "none",
              }}
              className="hover:bg-amber-300/20 focus-visible:bg-amber-300/30"
            />
          );
        })}
      </div>
    </ResponsiveKeymap>
  );
}
