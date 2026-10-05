import { describe, expect, it } from "vitest";
import { ESSENTIAL_KEYS, findMissingEssentialKeys } from "@/lib/essential-keys";
import type { Layer } from "@/lib/schemas";

function layerWith(labels: string[]): Layer {
  return {
    layerNumber: 0,
    layerName: "通常",
    assignments: labels.map((label, i) => ({ elementId: `E${i}`, action: "press", label })),
  };
}

describe("findMissingEssentialKeys", () => {
  it("必須キーがすべてそろっている配列では、不足なしを返す", () => {
    const allLabels = ESSENTIAL_KEYS.map((k) => k.candidates[0]);
    const layers = [layerWith(allLabels)];
    expect(findMissingEssentialKeys(layers)).toEqual([]);
  });

  it("何も割り当てていない配列では、全55項目が不足として返る", () => {
    const layers = [layerWith([])];
    expect(findMissingEssentialKeys(layers)).toHaveLength(55);
  });

  it("いくつか欠けている配列では、その名前だけが不足として返る", () => {
    const allLabels = ESSENTIAL_KEYS.map((k) => k.candidates[0]).filter((l) => l !== "A" && l !== "Esc");
    const layers = [layerWith(allLabels)];
    expect(findMissingEssentialKeys(layers)).toEqual(["A", "Esc"]);
  });

  it("Shift/Ctrl/Win・Cmdは、どちらか1つのlabelがあれば不足にならない", () => {
    const allLabels = ESSENTIAL_KEYS.map((k) => k.candidates[0]).filter((l) => l !== "Win");
    const layers = [layerWith([...allLabels, "Cmd"])];
    expect(findMissingEssentialKeys(layers)).toEqual([]);
  });

  it("別のレイヤーにある割り当ても数える", () => {
    const allLabels = ESSENTIAL_KEYS.map((k) => k.candidates[0]).filter((l) => l !== "Z");
    const layers = [layerWith(allLabels), layerWith(["Z"])];
    expect(findMissingEssentialKeys(layers)).toEqual([]);
  });

  it("大文字小文字や前後の空白を無視して判定する", () => {
    const allLabels = ESSENTIAL_KEYS.map((k) => k.candidates[0]).filter((l) => l !== "A");
    const layers = [layerWith([...allLabels, " a "])];
    expect(findMissingEssentialKeys(layers)).toEqual([]);
  });

  it("CapsLock・Alt・矢印キーは必須キーに含まれない", () => {
    const names = ESSENTIAL_KEYS.map((k) => k.name);
    expect(names).not.toContain("CapsLock");
    expect(names).not.toContain("Alt");
    expect(names).not.toContain("↑");
  });
});
