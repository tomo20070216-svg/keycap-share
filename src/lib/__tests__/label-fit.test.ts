import { describe, expect, it } from "vitest";
import { dropTrailingNote, estimateTextWidthEm, fitFontSize, fitLabel, fitShortLabel, fitSingleLine, splitIntoTwoLines } from "@/lib/label-fit";

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

describe("fitSingleLine 1行に収める(OGP画像のタイトル用)", () => {
  it("短い文字は基本サイズのまま", () => {
    expect(fitSingleLine("Orca echo", 1000, 48, 28)).toEqual({ text: "Orca echo", fontSize: 48 });
  });
  it("長い文字は小さくして1行に収める", () => {
    const r = fitSingleLine("あ".repeat(30), 1000, 48, 28);
    expect(r.text).toBe("あ".repeat(30));
    expect(r.fontSize).toBeLessThan(48);
    expect(r.fontSize * 30).toBeLessThanOrEqual(1000 + 1e-6);
  });
  it("最小サイズでも収まらなければ末尾を…で省略し、幅に収まる", () => {
    const r = fitSingleLine("あ".repeat(80), 1000, 48, 28);
    expect(r.fontSize).toBe(28);
    expect(r.text.endsWith("…")).toBe(true);
    expect(estimateTextWidthEm(r.text) * 28).toBeLessThanOrEqual(1000);
  });
});

describe("小さなキー図(一覧のカード)で長い名前がはみ出さない", () => {
  // カードのキー図: キー1つ30px → 文字の幅の上限 約23px、基本の文字サイズ 9px(下限6px)
  const maxWidth = 30 * 0.9 * 0.86;
  const base = 30 * 0.3;

  it("下限の大きさでも1行に収まらない名前は、2行に分けて収める(BackSpace → Back / Space)", () => {
    const r = fitLabel("BackSpace", maxWidth, base);
    expect(r.lines).toEqual(["Back", "Space"]);
    for (const line of r.lines) expect(estimateTextWidthEm(line) * r.fontSize).toBeLessThanOrEqual(maxWidth + 1e-6);
  });

  it("よく使う長めのキー名も、カードの大きさで幅に収まる", () => {
    for (const label of ["BackSpace", "Caps Lock", "Enter", "Shift", "半角/全角", "Print Screen", "左クリック"]) {
      const r = fitLabel(label, maxWidth, base);
      const widest = Math.max(...r.lines.map((l) => estimateTextWidthEm(l)));
      expect(widest * r.fontSize, `${label} → ${r.lines.join(" / ")} (${r.fontSize.toFixed(1)}px)`).toBeLessThanOrEqual(maxWidth + 1e-6);
    }
  });
});

describe("2行に分ける位置(フェーズ8)", () => {
  it("英単語の途中では分けない(Bluetooth 1 → Bluetooth / 1)", () => {
    expect(splitIntoTwoLines("Bluetooth 1")).toEqual(["Bluetooth", "1"]);
  });
  it("開きかっこの直後では分けず、かっこの前で分ける", () => {
    expect(splitIntoTwoLines("レイヤー1(押している間)")).toEqual(["レイヤー1", "(押している間)"]);
    expect(splitIntoTwoLines("戻る(マウス)")).toEqual(["戻る", "(マウス)"]);
  });
  it("分けられる位置が単語の中しかないときは、今までどおり真ん中あたりで分ける", () => {
    expect(splitIntoTwoLines("BackSpace")).toEqual(["Back", "Space"]);
  });
});

describe("一覧の小さなカードで長い名前が切れない(2026-09-30)", () => {
  // カードのキー図: キー1つ30px → 文字の幅の上限 約23px、基本の文字サイズ 9px(下限6px)
  const maxWidth = 30 * 0.9 * 0.86;
  const base = 30 * 0.3;
  // 見積もりは多めなので、5%以内のはみ出しは収まっているとみなす(label-fit.ts の NOTE_KEEP_TOLERANCE)
  const fits = (r: { fontSize: number; lines: string[] }) =>
    r.lines.every((l) => estimateTextWidthEm(l) * r.fontSize <= maxWidth * 1.05);

  it("末尾のかっこ書きの補足を外す", () => {
    expect(dropTrailingNote("レイヤー1(押している間)")).toBe("レイヤー1");
    expect(dropTrailingNote("戻る(マウス)")).toBe("戻る");
    expect(dropTrailingNote("Opt")).toBe("Opt");
    expect(dropTrailingNote("(補足だけ)")).toBe("(補足だけ)");
  });

  it("2行でも収まらない名前は、補足を外して収める(レイヤー1(押している間) → レイヤー1)", () => {
    const r = fitLabel("レイヤー1(押している間)", maxWidth, base);
    expect(r.lines.join("")).toBe("レイヤー1");
    expect(fits(r)).toBe(true);
  });

  it("補足がなく2行でも収まらない名前は「…」で省略し、幅からはみ出さない", () => {
    const r = fitLabel("エクスプローラーを開く", maxWidth, base);
    expect(r.lines.some((l) => l.endsWith("…"))).toBe(true);
    expect(fits(r)).toBe(true);
  });

  it("大きなキー図(配列ページ)では、今までどおり補足を含めて表示する", () => {
    const r = fitLabel("レイヤー1(押している間)", 56 * 0.9 * 0.86, 56 * 0.3);
    expect(r.lines.join("")).toBe("レイヤー1(押している間)");
  });

  it("1行だけの場所(スクロールパッドの中など)も、補足を外すか省略して幅に収める", () => {
    const small = fitShortLabel("↑ 進む(マウス)", 30 * 1.15 * 0.9, 30 * 0.16);
    expect(small.text).toBe("↑ 進む");
    expect(estimateTextWidthEm(small.text) * small.fontSize).toBeLessThanOrEqual(30 * 1.15 * 0.9 + 1e-6);
    const large = fitShortLabel("↑ 進む(マウス)", 56 * 1.15 * 0.9, 56 * 0.16);
    expect(large.text).toBe("↑ 進む(マウス)");
  });
});
