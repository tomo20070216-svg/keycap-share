import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { KeyboardPhysicalLayoutSchema, ELEMENT_ACTIONS } from "@/lib/schemas";

describe("orcaEcho 仮の物理レイアウト", () => {
  it("Zodスキーマの検証を通る", () => {
    expect(() => KeyboardPhysicalLayoutSchema.parse(orcaEcho)).not.toThrow();
  });

  it("仮の値であることが明示されている", () => {
    expect(orcaEcho.isProvisional).toBe(true);
  });

  it("キー要素が49個ある(左25+右24、docs/keyboards/orca-echo.md準拠)", () => {
    const keys = orcaEcho.elements.filter((e) => e.type === "key");
    const leftKeys = keys.filter((e) => e.side === "left");
    const rightKeys = keys.filter((e) => e.side === "right");
    expect(leftKeys.length).toBe(25);
    expect(rightKeys.length).toBe(24);
    expect(keys.length).toBe(49);
  });

  it("ダイヤルが左手に1つ、トラックボールが右手に1つある", () => {
    const dials = orcaEcho.elements.filter((e) => e.type === "dial");
    const trackballs = orcaEcho.elements.filter((e) => e.type === "trackball");
    expect(dials).toHaveLength(1);
    expect(dials[0].side).toBe("left");
    expect(trackballs).toHaveLength(1);
    expect(trackballs[0].side).toBe("right");
  });

  it("スクロールパッドが左右に1つずつある", () => {
    const scrollpads = orcaEcho.elements.filter((e) => e.type === "scrollpad");
    expect(scrollpads).toHaveLength(2);
    expect(scrollpads.map((e) => e.side).sort()).toEqual(["left", "right"]);
  });

  it("要素idが重複していない", () => {
    const ids = orcaEcho.elements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("各要素タイプに対応するactionがELEMENT_ACTIONSに定義されている", () => {
    const usedTypes = new Set(orcaEcho.elements.map((e) => e.type));
    for (const type of usedTypes) {
      expect(ELEMENT_ACTIONS[type].length).toBeGreaterThan(0);
    }
  });

  it("トラックボールは上下左右4方向のactionを持つ(レイヤー切り替え中の割り当て用)", () => {
    expect(ELEMENT_ACTIONS.trackball).toEqual(
      expect.arrayContaining(["up", "down", "left", "right"])
    );
  });

  it("トラックボールに押し込み(クリック)はない(人間の確認、2026-09-29)", () => {
    expect(ELEMENT_ACTIONS.trackball).toEqual(["up", "down", "left", "right"]);
  });

  it("左右の対応する列(左の列c ↔ 右の列6-c)の高さがそろっている", () => {
    const y = (id: string) => orcaEcho.elements.find((e) => e.id === id)!.y;
    const diffs: number[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const left = `L-${row}-${col}`;
        const right = `R-${row}-${6 - col}`;
        if (left === "L-3-5" || !orcaEcho.elements.some((e) => e.id === left) || !orcaEcho.elements.some((e) => e.id === right)) continue;
        diffs.push(y(left) - y(right));
      }
    }
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });
});
