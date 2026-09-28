import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { buildKeymapRenderModel, type RenderItem } from "@/lib/keymap-render";
import type { KeyboardPhysicalLayout, Layer } from "@/lib/schemas";

const baseLayer = orcaEchoFactoryDefaultLayers.find((l) => l.layerNumber === 0)!;
const fn1Layer = orcaEchoFactoryDefaultLayers.find((l) => l.layerNumber === 1)!;

function item(items: RenderItem[], id: string): RenderItem {
  const found = items.find((i) => i.elementId === id);
  if (!found) throw new Error(`要素が見つからない: ${id}`);
  return found;
}

/** 回転を考慮した外接矩形の左右端 */
function horizontalExtent(i: RenderItem) {
  const rad = (i.rotation * Math.PI) / 180;
  const w = i.width * Math.abs(Math.cos(rad)) + i.height * Math.abs(Math.sin(rad));
  const cx = i.x + i.width / 2;
  return { minX: cx - w / 2, maxX: cx + w / 2 };
}

describe("buildKeymapRenderModel 描画用データ", () => {
  it("全要素(49キー・ダイヤル1・トラックボール1・スクロールパッド2)が出力される", () => {
    const model = buildKeymapRenderModel(orcaEcho, baseLayer);
    const count = (type: string) => model.items.filter((i) => i.type === type).length;
    expect(model.items).toHaveLength(orcaEcho.elements.length);
    expect(count("key")).toBe(49);
    expect(count("dial")).toBe(1);
    expect(count("trackball")).toBe(1);
    expect(count("scrollpad")).toBe(2);
  });

  it("左手の右端と右手の左端の間に、指定した隙間がある", () => {
    for (const splitGap of [0.5, 1, 3]) {
      const model = buildKeymapRenderModel(orcaEcho, baseLayer, { splitGap });
      const leftMaxX = Math.max(
        ...model.items.filter((i) => i.side === "left").map((i) => horizontalExtent(i).maxX)
      );
      const rightMinX = Math.min(
        ...model.items.filter((i) => i.side === "right").map((i) => horizontalExtent(i).minX)
      );
      expect(rightMinX - leftMaxX).toBeCloseTo(splitGap);
      expect(model.halves.right.x - (model.halves.left.x + model.halves.left.width)).toBeCloseTo(splitGap);
    }
  });

  it("元データで左右が重なっていても、描画では隙間が空く", () => {
    // 右手を左手と同じ x 座標に置いた物理レイアウト
    const overlapping: KeyboardPhysicalLayout = {
      ...orcaEcho,
      elements: orcaEcho.elements.map((el) => (el.side === "right" ? { ...el, x: el.x - 9 } : el)),
    };
    const model = buildKeymapRenderModel(overlapping, baseLayer, { splitGap: 1 });
    const leftMaxX = Math.max(
      ...model.items.filter((i) => i.side === "left").map((i) => horizontalExtent(i).maxX)
    );
    const rightMinX = Math.min(
      ...model.items.filter((i) => i.side === "right").map((i) => horizontalExtent(i).minX)
    );
    expect(rightMinX - leftMaxX).toBeCloseTo(1);
  });

  it("すべての要素が図の範囲内に収まり、左上が(0,0)になる", () => {
    const model = buildKeymapRenderModel(orcaEcho, baseLayer);
    const extents = model.items.map((i) => horizontalExtent(i));
    expect(Math.min(...extents.map((e) => e.minX))).toBeCloseTo(0);
    expect(Math.max(...extents.map((e) => e.maxX))).toBeCloseTo(model.width);
    expect(Math.min(...model.items.map((i) => i.y))).toBeGreaterThanOrEqual(0);
    for (const i of model.items) {
      expect(i.y + i.height).toBeLessThanOrEqual(model.height + 1e-9);
    }
  });

  it("キーのタップ(press)と長押し(hold)が別々の文字として出力される", () => {
    const layer: Layer = {
      layerNumber: 0,
      layerName: "テスト",
      assignments: [
        { elementId: "L-1-1", action: "press", label: "A" },
        { elementId: "L-1-1", action: "hold", label: "Ctrl" },
        { elementId: "L-1-2", action: "hold", label: "Shift" },
      ],
    };
    const model = buildKeymapRenderModel(orcaEcho, layer);
    expect(item(model.items, "L-1-1")).toMatchObject({ primary: "A", secondary: "Ctrl", isEmpty: false });
    // 長押しだけ設定されたキーは、タップが空欄で長押しだけ表示される
    expect(item(model.items, "L-1-2")).toMatchObject({ primary: null, secondary: "Shift", isEmpty: false });
  });

  it("割り当てのない要素は「空欄」として区別される", () => {
    const model = buildKeymapRenderModel(orcaEcho, fn1Layer);
    const assignedIds = new Set(fn1Layer.assignments.map((a) => a.elementId));
    for (const i of model.items) {
      expect(i.isEmpty).toBe(!assignedIds.has(i.elementId));
      if (i.isEmpty) {
        expect(i.primary).toBeNull();
        expect(i.secondary).toBeNull();
        expect(i.extras).toEqual([]);
      }
    }
    // 工場出荷時のfn1は一部のキーだけ割り当てがあるので、空欄と非空欄の両方がある
    expect(model.items.some((i) => i.isEmpty)).toBe(true);
    expect(model.items.some((i) => !i.isEmpty)).toBe(true);
  });

  it("ダイヤル・トラックボール・スクロールパッドの操作は extras に決まった順で入る", () => {
    const layer: Layer = {
      layerNumber: 0,
      layerName: "テスト",
      assignments: [
        { elementId: "L-DIAL", action: "ccw", label: "音量-" },
        { elementId: "L-DIAL", action: "cw", label: "音量+" },
        { elementId: "R-TRACKBALL", action: "right", label: "進む" },
        { elementId: "R-TRACKBALL", action: "left", label: "戻る" },
        { elementId: "L-SCROLL", action: "tap", label: "Enter" },
      ],
    };
    const model = buildKeymapRenderModel(orcaEcho, layer);
    expect(item(model.items, "L-DIAL").extras).toEqual([
      { action: "cw", text: "音量+" },
      { action: "ccw", text: "音量-" },
    ]);
    expect(item(model.items, "R-TRACKBALL").extras).toEqual([
      { action: "left", text: "戻る" },
      { action: "right", text: "進む" },
    ]);
    expect(item(model.items, "L-SCROLL").extras).toEqual([{ action: "tap", text: "Enter" }]);
    expect(item(model.items, "R-SCROLL").isEmpty).toBe(true);
    // キー以外には primary/secondary を使わない
    expect(item(model.items, "L-DIAL")).toMatchObject({ primary: null, secondary: null });
  });

  it("物理レイアウトにない要素への割り当ては無視する", () => {
    const layer: Layer = {
      layerNumber: 0,
      layerName: "テスト",
      assignments: [{ elementId: "NO-SUCH-KEY", action: "press", label: "X" }],
    };
    const model = buildKeymapRenderModel(orcaEcho, layer);
    expect(model.items.every((i) => i.isEmpty)).toBe(true);
  });

  it("工場出荷時の通常レイヤーでは、印字どおりの文字がタップに入る", () => {
    const model = buildKeymapRenderModel(orcaEcho, baseLayer);
    expect(item(model.items, "L-0-0").primary).toBe("Esc");
    expect(item(model.items, "L-0-1").primary).toBe("Q");
  });
});

describe("要素の外側に置く文字(ダイヤル・トラックボール)", () => {
  const allOutside: Layer = {
    layerNumber: 0,
    layerName: "テスト",
    assignments: [
      { elementId: "L-DIAL", action: "cw", label: "音量+" },
      { elementId: "L-DIAL", action: "ccw", label: "音量-" },
      { elementId: "R-TRACKBALL", action: "up", label: "コピー" },
      { elementId: "R-TRACKBALL", action: "down", label: "貼付" },
      { elementId: "R-TRACKBALL", action: "left", label: "戻る" },
      { elementId: "R-TRACKBALL", action: "right", label: "進む" },
    ],
  };

  /** 回転を考慮した外接矩形 */
  function bbox(i: RenderItem) {
    const rad = (i.rotation * Math.PI) / 180;
    const w = i.width * Math.abs(Math.cos(rad)) + i.height * Math.abs(Math.sin(rad));
    const h = i.width * Math.abs(Math.sin(rad)) + i.height * Math.abs(Math.cos(rad));
    const cx = i.x + i.width / 2;
    const cy = i.y + i.height / 2;
    return { minX: cx - w / 2, maxX: cx + w / 2, minY: cy - h / 2, maxY: cy + h / 2 };
  }
  type Box = { minX: number; maxX: number; minY: number; maxY: number };
  const overlaps = (a: Box, b: Box) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

  it("ダイヤルは右回し・左回し、トラックボールは上下左右の4つが外側に置かれる", () => {
    const model = buildKeymapRenderModel(orcaEcho, allOutside);
    expect(model.outsideLabels.filter((l) => l.elementId === "L-DIAL").map((l) => l.action)).toEqual(["cw", "ccw"]);
    expect(model.outsideLabels.filter((l) => l.elementId === "R-TRACKBALL").map((l) => l.action)).toEqual([
      "up",
      "down",
      "left",
      "right",
    ]);
  });

  it("外側の文字の枠は、どの要素とも、ほかの文字の枠とも重ならない", () => {
    const model = buildKeymapRenderModel(orcaEcho, allOutside);
    const labelBoxes = model.outsideLabels.map((l) => ({
      id: `${l.elementId}:${l.action}`,
      box: { minX: l.x, maxX: l.x + l.width, minY: l.y, maxY: l.y + l.height },
    }));
    for (const label of labelBoxes) {
      for (const i of model.items) {
        expect(overlaps(label.box, bbox(i)), `${label.id} と ${i.elementId} が重なっている`).toBe(false);
      }
      for (const other of labelBoxes) {
        if (other.id === label.id) continue;
        expect(overlaps(label.box, other.box), `${label.id} と ${other.id} が重なっている`).toBe(false);
      }
    }
  });

  it("外側の文字も図の範囲内に収まる", () => {
    const model = buildKeymapRenderModel(orcaEcho, allOutside);
    for (const l of model.outsideLabels) {
      expect(l.x).toBeGreaterThanOrEqual(0);
      expect(l.y).toBeGreaterThanOrEqual(0);
      expect(l.x + l.width).toBeLessThanOrEqual(model.width + 1e-9);
      expect(l.y + l.height).toBeLessThanOrEqual(model.height + 1e-9);
    }
  });

  it("割り当てのない操作の文字は置かない", () => {
    const model = buildKeymapRenderModel(orcaEcho, orcaEchoFactoryDefaultLayers[0]);
    expect(model.outsideLabels).toEqual([]);
  });
});
