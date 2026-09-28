import { describe, expect, it } from "vitest";
import { estimateTextWidthEm, fitFontSize, fitLabel, splitIntoTwoLines } from "@/lib/label-fit";

describe("estimateTextWidthEm 文字幅の見積もり", () => {
  it("全角は1文字1em、半角は1文字0.62em", () => {
    expect(estimateTextWidthEm("変換")).toBeCloseTo(2);
    expect(estimateTextWidthEm("Esc")).toBeCloseTo(1.86);
    expect(estimateTextWidthEm("左Click")).toBeCloseTo(1 + 5 * 0.62);
    expect(estimateTextWidthEm("")).toBe(0);
  });
});

describe("fitFontSize 文字サイズの自動調整", () => {
  it("短い文字は基本サイズのまま", () => {
    expect(fitFontSize("A", 40, 18)).toBe(18);
  });

  it("長い文字は幅に収まるよう小さくなる", () => {
    const size = fitFontSize("左クリック", 40, 18); // 5em → 8px
    expect(size).toBeLessThan(18);
    expect(size * estimateTextWidthEm("左クリック")).toBeLessThanOrEqual(40);
  });

  it("最小サイズより小さくはしない", () => {
    expect(fitFontSize("とても長いキーの表示名です", 20, 18, 7)).toBe(7);
  });
});

describe("fitLabel 1行/2行の判断", () => {
  it("1行で十分な大きさになるなら1行", () => {
    expect(fitLabel("Esc", 45, 17)).toEqual({ fontSize: 17, lines: ["Esc"] });
  });

  it("5文字程度の日本語は1行のまま", () => {
    expect(fitLabel("左クリック", 43, 16.8).lines).toEqual(["左クリック"]);
  });

  it("1行だと小さくなりすぎる長い文字は、2行にして1行より大きく表示する", () => {
    const oneLine = fitFontSize("2.4GHz切替", 43, 16.8);
    const fitted = fitLabel("2.4GHz切替", 43, 16.8);
    expect(fitted.lines).toHaveLength(2);
    expect(fitted.fontSize).toBeGreaterThan(oneLine);
  });
});

describe("splitIntoTwoLines 2行に分ける位置", () => {
  it("半角と全角の境目で分ける", () => {
    expect(splitIntoTwoLines("2.4GHz切替")).toEqual(["2.4GHz", "切替"]);
  });

  it("空白があれば空白で分ける", () => {
    expect(splitIntoTwoLines("Mission Control")).toEqual(["Mission", "Control"]);
  });

  it("区切りがなければ、ほぼ半分の位置で分ける", () => {
    expect(splitIntoTwoLines("ホイールクリック")).toEqual(["ホイール", "クリック"]);
  });

  it("分けた結果をつなぐと元の文字(空白を除く)に戻る", () => {
    for (const text of ["とても長い表示名のキー", "音量アップ", "Ctrl+Shift+Esc"]) {
      expect(splitIntoTwoLines(text).join("")).toBe(text.replace(/ /g, ""));
    }
  });
});
