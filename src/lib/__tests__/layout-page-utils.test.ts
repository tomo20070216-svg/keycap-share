import { describe, expect, it } from "vitest";
import { decodeTagParam, findLayerByParam, formatDateJa, parsePageParam, totalPages } from "@/lib/layout-page-utils";
import type { Layout } from "@/lib/schemas";

const layout = {
  layers: [
    { layerNumber: 0, layerName: "通常", assignments: [] },
    { layerNumber: 1, layerName: "fn1", assignments: [] },
    { layerNumber: 12, layerName: "fn12", assignments: [] },
  ],
} as unknown as Layout;

describe("findLayerByParam URLのレイヤー番号", () => {
  it("存在する番号ならそのレイヤーを返す", () => {
    expect(findLayerByParam(layout, "0")?.layerName).toBe("通常");
    expect(findLayerByParam(layout, "1")?.layerName).toBe("fn1");
    expect(findLayerByParam(layout, "12")?.layerName).toBe("fn12");
  });

  it("存在しない番号・数字でない値・先頭の0・符号・小数は null", () => {
    for (const param of ["2", "abc", "01", "-1", "1.0", "", " 1", "1e1", "通常"]) {
      expect(findLayerByParam(layout, param), param).toBeNull();
    }
  });
});

describe("formatDateJa", () => {
  it("日本時間の日付にする(UTCの15時以降は翌日)", () => {
    expect(formatDateJa("2026-09-28T13:55:18.961Z")).toBe("2026/09/28");
    expect(formatDateJa("2026-09-28T15:30:00.000Z")).toBe("2026/09/29");
  });
});

describe("parsePageParam 一覧のページ番号", () => {
  it("省略時は1、正の整数はその値", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("1")).toBe(1);
    expect(parsePageParam("12")).toBe(12);
  });
  it("0・負の数・数字でない値・先頭0・複数指定は null", () => {
    for (const v of ["0", "-1", "abc", "01", "1.5", ""]) expect(parsePageParam(v), v).toBeNull();
    expect(parsePageParam(["1", "2"])).toBeNull();
  });
});

describe("totalPages 総ページ数", () => {
  it("20件ずつで切り上げ、0件でも1ページ", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(totalPages(5, 2)).toBe(3);
  });
});

describe("decodeTagParam URLのタグ名", () => {
  it("エンコードされたままでも、デコード済みでも同じタグ名になる", () => {
    expect(decodeTagParam(encodeURIComponent("工場出荷時"))).toBe("工場出荷時");
    expect(decodeTagParam("工場出荷時")).toBe("工場出荷時");
    expect(decodeTagParam("親指キー")).toBe("親指キー");
  });
  it("空・20文字を超える・不正なエンコードは null", () => {
    expect(decodeTagParam("")).toBeNull();
    expect(decodeTagParam("あ".repeat(21))).toBeNull();
    expect(decodeTagParam("%E3%81")).toBeNull();
  });
});
