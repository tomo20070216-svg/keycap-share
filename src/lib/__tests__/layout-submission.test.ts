import { describe, expect, it } from "vitest";
import { orcaEchoComboSampleCombos, orcaEchoComboSampleLayers } from "@/keyboards/orca-echo-combo-sample";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { validateSubmission } from "@/lib/layout-submission";

const valid = {
  keyboardId: "orca-echo",
  title: "テスト配列",
  description: "なぜこの配置にしたかの説明",
  authorName: "テスト",
  tags: ["テスト"],
  layers: orcaEchoFactoryDefaultLayers,
};

function errorsOf(raw: unknown): string[] {
  const r = validateSubmission(raw);
  return r.ok ? [] : r.errors;
}

describe("validateSubmission エディタからの投稿の検証", () => {
  it("正しい入力は通り、省略した項目は既定値になる", () => {
    const r = validateSubmission(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.combos).toEqual([]);
      expect(r.input.macros).toEqual([]);
    }
    expect(validateSubmission({ ...valid, combos: orcaEchoComboSampleCombos, layers: orcaEchoComboSampleLayers }).ok).toBe(true);
  });

  it("タイトルが空・長すぎる場合は、分かりやすいエラーになる", () => {
    expect(errorsOf({ ...valid, title: "" })).toEqual(["タイトルを入力してください(1〜80文字)。"]);
    expect(errorsOf({ ...valid, title: "あ".repeat(81) })).toEqual(["タイトルを入力してください(1〜80文字)。"]);
  });

  it("大きすぎる入力は拒否する(レイヤー11個・割り当て301件・説明2001文字・タグ11個)", () => {
    const layers11 = Array.from({ length: 11 }, (_, n) => ({ layerNumber: n, layerName: `L${n}`, assignments: [] }));
    expect(errorsOf({ ...valid, layers: layers11 })).toEqual(["レイヤーは通常を含めて1〜8個にしてください。"]);
    const many = Array.from({ length: 301 }, () => ({ elementId: "L-0-0", action: "press", label: "x" }));
    expect(errorsOf({ ...valid, layers: [{ layerNumber: 0, layerName: "通常", assignments: many }] })).toEqual([
      "1つのレイヤーの割り当てが多すぎます(300件まで)。",
    ]);
    expect(errorsOf({ ...valid, description: "あ".repeat(2001) })).toEqual(["「なぜこの配置にしたか」は2000文字以内にしてください。"]);
    expect(errorsOf({ ...valid, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) })).toEqual([
      "タグは10個まで、1つ20文字以内にしてください。",
    ]);
  });

  it("レイヤーが0個・キーの表示名が長すぎる場合", () => {
    expect(errorsOf({ ...valid, layers: [] })).toEqual(["レイヤーは通常を含めて1〜8個にしてください。"]);
    expect(
      errorsOf({ ...valid, layers: [{ layerNumber: 0, layerName: "通常", assignments: [{ elementId: "L-0-0", action: "press", label: "あ".repeat(41) }] }] })
    ).toEqual(["キーの表示名は1〜40文字にしてください。"]);
  });

  it("対応していない機種・存在しないキー・キー以外を含むコンボ・同じ番号のレイヤーは拒否する", () => {
    expect(errorsOf({ ...valid, keyboardId: "other" })).toEqual([
      "この機種にはまだ対応していません。今は Keychron Orca echo と Cornix を投稿できます。",
    ]);
    expect(
      errorsOf({ ...valid, layers: [{ layerNumber: 0, layerName: "通常", assignments: [{ elementId: "NO-SUCH", action: "press", label: "x" }] }] })
    ).toHaveLength(1);
    expect(errorsOf({ ...valid, combos: [{ elementIds: ["R-1-2", "R-TRACKBALL"], label: "x" }] })).toHaveLength(1);
    expect(
      errorsOf({ ...valid, layers: [{ layerNumber: 0, layerName: "a", assignments: [] }, { layerNumber: 0, layerName: "b", assignments: [] }] })
    ).toEqual(["同じ番号のレイヤーが2つあります。レイヤーを見直してください。"]);
  });

  it("形がまったく違う入力(null・文字列)も例外にならずエラーを返す", () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission("abc").ok).toBe(false);
  });
});

describe("レイヤーの数の上限(通常を含めて8つ。2026-09-30)", () => {
  const base = { keyboardId: "orca-echo", title: "t" };
  const layers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ layerNumber: i, layerName: i === 0 ? "通常" : `fn${i}`, assignments: [] }));
  it("8つまでは受け付け、9つはエラー文", () => {
    expect(validateSubmission({ ...base, layers: layers(8) }).ok).toBe(true);
    const r = validateSubmission({ ...base, layers: layers(9) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("レイヤーは通常を含めて1〜8個にしてください。");
  });
});
