import { cornix } from "@/keyboards/cornix";
import { cornixFactoryDefaultLayers } from "@/keyboards/cornix-factory-default";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import type { KeyboardPhysicalLayout, Layer } from "@/lib/schemas";

/**
 * 投稿できる機種の一覧(フェーズ8)。機種を増やすときは、ここに1つ足す。
 * - tool: キーマップを変えるツール。投稿画面のキーの一覧(key-palette.ts)をツールに合わせて切り替える
 * - 物理レイアウトは keyboards テーブルにも保存する(閲覧ページはDBの物理レイアウトで描く)
 */

export type KeymapTool = "keychron-launcher" | "vial";

export type SupportedKeyboard = {
  layout: KeyboardPhysicalLayout;
  /** メーカー(機種を選ぶ画面の補足) */
  maker: string;
  tool: KeymapTool;
  /** ツールの表示名 */
  toolName: string;
  /** 投稿画面の最初の状態(工場出荷時配列) */
  factoryDefaultLayers: Layer[];
  /** 機種を選ぶ画面の説明 */
  summary: string;
};

export const KEYBOARDS: SupportedKeyboard[] = [
  {
    layout: orcaEcho,
    maker: "Keychron",
    tool: "keychron-launcher",
    toolName: "Keychron Launcher",
    factoryDefaultLayers: orcaEchoFactoryDefaultLayers,
    summary: "トラックボール・ダイヤル・スクロールパッド付きの分割キーボード(49キー)",
  },
  {
    layout: cornix,
    maker: "Jezail Funder",
    tool: "vial",
    toolName: "Vial",
    factoryDefaultLayers: cornixFactoryDefaultLayers,
    summary: "左右とも無線の薄型分割キーボード(48キー・押し込めるダイヤル2つ)",
  },
];

export function findKeyboard(id: string): SupportedKeyboard | undefined {
  return KEYBOARDS.find((k) => k.layout.id === id);
}

/** 対応機種の名前を「A と B」の形でつなぐ(説明文用) */
export function supportedKeyboardNames(): string {
  const names = KEYBOARDS.map((k) => k.layout.name);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join("、")} と ${names[names.length - 1]}`;
}
