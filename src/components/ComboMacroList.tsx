import { ComboNumberBadge } from "@/components/KeymapDiagram";
import type { Combo, KeyboardPhysicalLayout, Layer, Macro } from "@/lib/schemas";

/**
 * キー図の下に置く「コンボ一覧」「マクロ一覧」。
 * キー図と同じく、インラインのスタイルだけで書き、状態を持たない(OGP画像でも使えるように)。
 *
 * コンボの番号はキー図の番号の丸と同じ部品(ComboNumberBadge)で描き、対応が分かるようにする。
 * キーの名前は工場出荷時の印字(legend)を使う。印字がなければ要素IDを出す。
 */

export type ComboMacroListProps = {
  physicalLayout: KeyboardPhysicalLayout;
  layers: Layer[];
  combos: Combo[];
  macros: Macro[];
  fontFamily?: string;
};

const TEXT = "#18181b";
const SUB_TEXT = "#52525b";

function keyName(physicalLayout: KeyboardPhysicalLayout, id: string): string {
  return physicalLayout.elements.find((el) => el.id === id)?.legend ?? id;
}

function layerText(combo: Combo, layers: Layer[]): string {
  if (combo.layerNumbers.length === 0) return "全レイヤー共通";
  const names = combo.layerNumbers.map(
    (n) => layers.find((l) => l.layerNumber === n)?.layerName ?? `レイヤー${n}`
  );
  return `レイヤー: ${names.join("、")}`;
}

export function ComboMacroList({
  physicalLayout,
  layers,
  combos,
  macros,
  fontFamily = "'Noto Sans JP', sans-serif",
}: ComboMacroListProps) {
  if (combos.length === 0 && macros.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, color: TEXT, fontFamily }}>
      {combos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>コンボ(同時押し)</div>
          {combos.map((combo, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <ComboNumberBadge number={index + 1} size={20} fontFamily={fontFamily} />
              <div style={{ fontWeight: 700 }}>
                {combo.elementIds.map((id) => keyName(physicalLayout, id)).join(" + ")}
              </div>
              <div>{`→ ${combo.label}`}</div>
              <div style={{ color: SUB_TEXT, fontSize: 12 }}>{`(${layerText(combo, layers)})`}</div>
            </div>
          ))}
        </div>
      )}
      {macros.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>マクロ</div>
          {macros.map((macro, index) => (
            <div key={index} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 14 }}>
              <div style={{ fontWeight: 700 }}>{macro.name}</div>
              <div style={{ color: SUB_TEXT }}>{macro.description || "(説明なし)"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
