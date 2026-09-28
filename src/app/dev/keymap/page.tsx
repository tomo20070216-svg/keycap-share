import type { Metadata } from "next";
import { KeymapDiagram, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { ComboMacroList } from "@/components/ComboMacroList";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { orcaEcho } from "@/keyboards/orca-echo";
import {
  orcaEchoComboSampleCombos,
  orcaEchoComboSampleLayers,
  orcaEchoComboSampleMacros,
} from "@/keyboards/orca-echo-combo-sample";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import type { Layer } from "@/lib/schemas";

/**
 * 開発用の確認ページ(P2-3, P2-6)。キー図の部品の見た目を確認する。
 * Supabaseは使わず、コード内のデータ(コンボのサンプル配列 + 表示確認用のテストレイヤー)だけで描く。
 */

export const metadata: Metadata = {
  title: "キー図の確認(開発用)",
  robots: { index: false, follow: false },
};

/** 長押し・キー以外の操作・長い文字の表示を確認するためのテスト用レイヤー */
const sampleLayer: Layer = {
  layerNumber: 9,
  layerName: "表示確認用(テストデータ)",
  assignments: [
    { elementId: "L-1-1", action: "press", label: "A" },
    { elementId: "L-1-1", action: "hold", label: "Ctrl" },
    { elementId: "L-1-2", action: "press", label: "変換" },
    { elementId: "L-1-2", action: "hold", label: "Shift" },
    { elementId: "L-1-3", action: "hold", label: "長押しだけ" },
    { elementId: "L-1-4", action: "press", label: "左クリック" },
    { elementId: "L-1-5", action: "press", label: "とても長い表示名のキー" },
    { elementId: "L-3-5", action: "press", label: "親指" },
    { elementId: "L-DIAL", action: "cw", label: "音量+" },
    { elementId: "L-DIAL", action: "ccw", label: "音量-" },
    { elementId: "L-SCROLL", action: "up", label: "上へ" },
    { elementId: "L-SCROLL", action: "down", label: "下へ" },
    { elementId: "L-SCROLL", action: "tap", label: "Enter" },
    { elementId: "R-TRACKBALL", action: "up", label: "コピー" },
    { elementId: "R-TRACKBALL", action: "down", label: "貼付" },
    { elementId: "R-TRACKBALL", action: "left", label: "戻る" },
    { elementId: "R-TRACKBALL", action: "right", label: "進む" },
    { elementId: "R-1-2", action: "press", label: "J" },
    { elementId: "R-1-3", action: "press", label: "K" },
  ],
};

const layers = [...orcaEchoComboSampleLayers, sampleLayer];

export default function KeymapDevPage() {
  return (
    <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 32, backgroundColor: "#ffffff", color: "#18181b" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>キー図の確認(開発用)</h1>
      {layers.map((layer) => {
        const size = getKeymapDiagramSize(buildKeymapRenderModel(orcaEcho, layer));
        return (
          <section key={layer.layerNumber} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              レイヤー{layer.layerNumber}: {layer.layerName}
            </h2>
            <ResponsiveKeymap width={size.width} height={size.height}>
              <KeymapDiagram physicalLayout={orcaEcho} layer={layer} combos={orcaEchoComboSampleCombos} />
            </ResponsiveKeymap>
          </section>
        );
      })}
      <ComboMacroList
        physicalLayout={orcaEcho}
        layers={layers}
        combos={orcaEchoComboSampleCombos}
        macros={orcaEchoComboSampleMacros}
      />
    </main>
  );
}
