import { describe, expect, it } from "vitest";
import { KEY_PALETTE } from "@/lib/key-palette";
import { AssignmentSchema } from "@/lib/schemas";

const allLabels = KEY_PALETTE.flatMap((c) => c.keys.map((k) => k.label));

describe("キーの一覧(パレット)", () => {
  it("どの種類にもキーがあり、種類のidは重複しない", () => {
    expect(KEY_PALETTE.length).toBeGreaterThan(0);
    for (const c of KEY_PALETTE) expect(c.keys.length, c.id).toBeGreaterThan(0);
    const ids = KEY_PALETTE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("表示名は1〜40文字で、割り当ての表示名としてそのまま保存できる", () => {
    for (const label of allLabels) {
      expect([...label].length, label).toBeGreaterThanOrEqual(1);
      expect([...label].length, label).toBeLessThanOrEqual(40);
      expect(AssignmentSchema.safeParse({ elementId: "L-0-0", action: "press", label }).success, label).toBe(true);
    }
  });

  it("表示名は一覧の中で重複しない", () => {
    const dup = allLabels.filter((l, i) => allLabels.indexOf(l) !== i);
    expect(dup).toEqual([]);
  });

  it("Launcher の主な種類(日本語入力・マウス・メディア・レイヤー・接続・マクロ・トラックボール)がそろっている", () => {
    for (const label of ["変換", "無変換", "英数", "かな", "左クリック", "ダブルクリック", "音量+", "レイヤー1(押している間)", "レイヤー1(ON/OFF)", "レイヤー1へ移動", "Bluetooth 1", "2.4GHz", "M0", "M15", "DPI+", "F24"]) {
      expect(allLabels, label).toContain(label);
    }
  });
});
