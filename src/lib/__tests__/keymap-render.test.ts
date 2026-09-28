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
        { elementId: "R-TRACKBALL", action: "click", label: "決定" },
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
      { action: "click", text: "決定" },
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
