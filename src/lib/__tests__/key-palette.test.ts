import { describe, expect, it } from "vitest";
import { KEY_PALETTE, VIAL_KEY_PALETTE, keyPaletteFor } from "@/lib/key-palette";
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

describe("Vial のキーの一覧(Cornix。フェーズ8)", () => {
  const labels = VIAL_KEY_PALETTE.flatMap((c) => c.keys.map((k) => k.label));
  it("種類の id・表示名は重複せず、表示名はそのまま保存できる", () => {
    const ids = VIAL_KEY_PALETTE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(labels.filter((l, i) => labels.indexOf(l) !== i)).toEqual([]);
    for (const label of labels) {
      expect(AssignmentSchema.safeParse({ elementId: "L-0-0", action: "press", label }).success, label).toBe(true);
    }
  });
  it("Bluetooth の切り替え・タップダンス・Vial のレイヤーキーがあり、Launcher だけのもの(トラックボール・2.4GHz・Mac/Windows の専用キー)はない", () => {
    for (const label of ["Bluetooth 1", "次のBluetooth", "USB/無線の切り替え", "TD0", "M0", "レイヤー1(1回だけ)", "レイヤー1(長押し/2回タップ)", "レイヤー1(押している間)", "中クリック", "変換"]) {
      expect(labels, label).toContain(label);
    }
    for (const label of ["DPI+", "2.4GHz", "Mission Control", "タスクビュー"]) {
      expect(labels, label).not.toContain(label);
    }
  });
  it("ツールに合わせて一覧を選ぶ", () => {
    expect(keyPaletteFor("keychron-launcher")).toBe(KEY_PALETTE);
    expect(keyPaletteFor("vial")).toBe(VIAL_KEY_PALETTE);
  });
});
