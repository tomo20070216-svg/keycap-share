import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import {
  orcaEchoComboSampleCombos,
  orcaEchoComboSampleLayers,
  orcaEchoComboSampleMacros,
} from "@/keyboards/orca-echo-combo-sample";
import { validateCombos, validateLayersAgainstPhysicalLayout } from "@/lib/layout-validation";
import { ComboSchema, LayoutInputSchema, MacroSchema } from "@/lib/schemas";

describe("ComboSchema コンボ", () => {
  it("キー2つ以上・表示名があれば通り、対象レイヤーを省略すると全レイヤー共通(空)になる", () => {
    expect(ComboSchema.parse({ elementIds: ["R-1-2", "R-1-3"], label: "左クリック" })).toEqual({
      elementIds: ["R-1-2", "R-1-3"],
      label: "左クリック",
      layerNumbers: [],
    });
  });

  it("キーが1つだけ・同じキーの重複・表示名なしは通らない", () => {
    expect(ComboSchema.safeParse({ elementIds: ["R-1-2"], label: "x" }).success).toBe(false);
    expect(ComboSchema.safeParse({ elementIds: ["R-1-2", "R-1-2"], label: "x" }).success).toBe(false);
    expect(ComboSchema.safeParse({ elementIds: ["R-1-2", "R-1-3"], label: "" }).success).toBe(false);
  });
});

describe("MacroSchema マクロ", () => {
  it("名前は1〜20文字、説明は省略すると空文字", () => {
    expect(MacroSchema.parse({ name: "署名" })).toEqual({ name: "署名", description: "" });
    expect(MacroSchema.safeParse({ name: "" }).success).toBe(false);
    expect(MacroSchema.safeParse({ name: "あ".repeat(21) }).success).toBe(false);
    expect(MacroSchema.safeParse({ name: "署名", description: "あ".repeat(201) }).success).toBe(false);
  });
});

describe("LayoutInputSchema", () => {
  it("コンボ・マクロを省略した既存の入力も通り、空の一覧になる", () => {
    const parsed = LayoutInputSchema.parse({
      keyboardId: "orca-echo",
      title: "t",
      layers: [{ layerNumber: 0, layerName: "通常", assignments: [] }],
    });
    expect(parsed.combos).toEqual([]);
    expect(parsed.macros).toEqual([]);
  });
});

describe("validateCombos コンボと物理レイアウトの整合", () => {
  const layers = orcaEchoComboSampleLayers;

  it("サンプル配列(人間の実例のコンボ3つ)は矛盾がない", () => {
    expect(validateCombos(orcaEchoComboSampleCombos, layers, orcaEcho)).toEqual([]);
    expect(validateLayersAgainstPhysicalLayout(layers, orcaEcho)).toEqual([]);
    expect(orcaEchoComboSampleCombos.map((c) => c.label)).toEqual(["左クリック", "右クリック", "ホイールクリック"]);
    expect(orcaEchoComboSampleMacros).toHaveLength(1);
  });

  it("存在しないキー・キー以外の要素・存在しないレイヤーはエラーになる", () => {
    const errors = validateCombos(
      [
        { elementIds: ["R-1-2", "NO-SUCH"], label: "a", layerNumbers: [] },
        { elementIds: ["R-1-2", "R-TRACKBALL"], label: "b", layerNumbers: [] },
        { elementIds: ["R-1-2", "R-1-3"], label: "c", layerNumbers: [9] },
      ],
      layers,
      orcaEcho
    );
    expect(errors.map((e) => e.comboIndex)).toEqual([0, 1, 2]);
  });
});

describe("コンボのサンプル配列のマクロ", () => {
  it("マクロ「署名」は M1 キー(R-3-4)の通常レイヤーに置かれ、ほかのキーには無い", () => {
    const base = orcaEchoComboSampleLayers.find((l) => l.layerNumber === 0)!;
    const signed = base.assignments.filter((a) => a.label === "署名");
    expect(signed).toEqual([{ elementId: "R-3-4", action: "press", label: "署名" }]);
    // fn1・fn2 の M1 は工場出荷時のまま
    const m1 = (n: number) =>
      orcaEchoComboSampleLayers.find((l) => l.layerNumber === n)!.assignments.find((a) => a.elementId === "R-3-4")?.label;
    expect([m1(1), m1(2)]).toEqual(["0", "B1"]);
  });
});
