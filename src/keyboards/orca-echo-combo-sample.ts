/**
 * コンボ・マクロの表示確認用のサンプル配列。
 * 工場出荷時配列(orca-echo-factory-default.ts)に、次を加えたもの。
 * - コンボ: 人間の実例(2026-09-29)。全レイヤー共通。
 *   J+K → 左クリック、K+L → 右クリック、J+L → ホイールクリック
 * - マクロ: 仮データ(実例ではない。人間の了承済み)
 *
 * Supabaseには固定slug `orca-echo-combo-sample` で1件残す(人間の判断、tasks.json P2-5)。
 */

import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import type { Combo, Layer, Macro } from "@/lib/schemas";

const J = "R-1-2";
const K = "R-1-3";
const L = "R-1-4";

export const orcaEchoComboSampleCombos: Combo[] = [
  { elementIds: [J, K], label: "左クリック", layerNumbers: [] },
  { elementIds: [K, L], label: "右クリック", layerNumbers: [] },
  { elementIds: [J, L], label: "ホイールクリック", layerNumbers: [] },
];

export const orcaEchoComboSampleMacros: Macro[] = [
  { name: "署名", description: "(仮データ)「よろしくお願いいたします。」と入力する" },
];

/**
 * マクロ「署名」は M1 キー(R-3-4)に置く。M1〜M3 はもともとマクロを入れるためのキー(人間の確認、2026-09-29)。
 * 通常レイヤーの M1 の表示名「M1」を「署名」に置き換える(fn1の「0」、fn2の「B1」はそのまま)。
 */
export const orcaEchoComboSampleLayers: Layer[] = orcaEchoFactoryDefaultLayers.map((layer) =>
  layer.layerNumber === 0
    ? {
        ...layer,
        assignments: layer.assignments.map((a) =>
          a.elementId === "R-3-4" && a.action === "press" ? { ...a, label: "署名" } : a
        ),
      }
    : layer
);
