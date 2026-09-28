import { describe, expect, it } from "vitest";
import { findLayerByParam, formatDateJa } from "@/lib/layout-page-utils";
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
