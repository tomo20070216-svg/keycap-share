import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { canRedo, canUndo, createHistory, historyReducer, type HistoryAction } from "@/lib/editor-history";
import { canSwapElements, createEditorState, editorReducer, type EditorState } from "@/lib/editor-state";

const initial = () => createEditorState({ keyboardId: "orca-echo", layers: orcaEchoFactoryDefaultLayers });
const label = (s: EditorState, layer: number, elementId: string, action = "press") =>
  s.layers.find((l) => l.layerNumber === layer)?.assignments.find((a) => a.elementId === elementId && a.action === action)?.label;
const run = (...actions: HistoryAction[]) => actions.reduce(historyReducer, createHistory(initial()));

describe("入れ替え(P5-11)", () => {
  it("表示中のレイヤーで、タップと長押しをまとめて入れ替える。ほかのレイヤーは変わらない", () => {
    let s = editorReducer(initial(), { type: "setAssignment", elementId: "L-0-0", action: "hold", label: "Ctrl" });
    s = editorReducer(s, { type: "swapElements", from: "L-0-0", to: "L-1-0" }); // Esc(+長押しCtrl) ⇔ Tab
    expect(label(s, 0, "L-0-0")).toBe("Tab");
    expect(label(s, 0, "L-0-0", "hold")).toBeUndefined();
    expect(label(s, 0, "L-1-0")).toBe("Esc");
    expect(label(s, 0, "L-1-0", "hold")).toBe("Ctrl");
    expect(label(s, 1, "L-0-3")).toBe("↑");
  });

  it("割り当てのないキーとの入れ替えは「移動」になる", () => {
    const s = editorReducer(initial(), { type: "swapElements", from: "L-0-0", to: "L-3-1" }); // L-3-1 は印字なし・割り当てなし
    expect(label(s, 0, "L-0-0")).toBeUndefined();
    expect(label(s, 0, "L-3-1")).toBe("Esc");
  });

  it("入れ替えられるのは同じ種類の別々の要素だけ", () => {
    expect(canSwapElements(orcaEcho, "L-0-0", "R-1-2")).toBe(true); // キー⇔キー
    expect(canSwapElements(orcaEcho, "L-SCROLL", "R-SCROLL")).toBe(true); // スクロールパッド⇔スクロールパッド
    expect(canSwapElements(orcaEcho, "L-0-0", "R-TRACKBALL")).toBe(false); // キー⇔トラックボール
    expect(canSwapElements(orcaEcho, "L-DIAL", "L-SCROLL")).toBe(false);
    expect(canSwapElements(orcaEcho, "L-0-0", "L-0-0")).toBe(false);
    expect(canSwapElements(orcaEcho, "L-0-0", "NO-SUCH")).toBe(false);
  });
});

describe("元に戻す・やり直す(P5-12)", () => {
  it("ドロップ(割り当ての設定)と入れ替えを元に戻し、やり直せる", () => {
    let h = run(
      { type: "setAssignment", elementId: "L-0-0", action: "press", label: "半角/全角" },
      { type: "swapElements", from: "L-0-0", to: "L-1-0" }
    );
    expect(label(h.present, 0, "L-1-0")).toBe("半角/全角");
    h = historyReducer(h, { type: "undo" });
    expect(label(h.present, 0, "L-0-0")).toBe("半角/全角");
    expect(label(h.present, 0, "L-1-0")).toBe("Tab");
    h = historyReducer(h, { type: "undo" });
    expect(label(h.present, 0, "L-0-0")).toBe("Esc");
    expect(canUndo(h)).toBe(false);
    h = historyReducer(h, { type: "redo" });
    h = historyReducer(h, { type: "redo" });
    expect(label(h.present, 0, "L-1-0")).toBe("半角/全角");
    expect(canRedo(h)).toBe(false);
  });

  it("同じ入力欄への続けての入力は1回の「元に戻す」でまとめて戻る", () => {
    let h = run(
      { type: "setField", field: "title", value: "私" },
      { type: "setField", field: "title", value: "私の" },
      { type: "setField", field: "title", value: "私の配列" }
    );
    expect(h.past).toHaveLength(1);
    h = historyReducer(h, { type: "undo" });
    expect(h.present.title).toBe("");
  });

  it("選択やレイヤーの切り替えは履歴に積まない", () => {
    const h = run({ type: "selectElement", elementId: "L-0-0" }, { type: "selectLayer", layerNumber: 1 });
    expect(canUndo(h)).toBe(false);
    expect(h.present.currentLayer).toBe(1);
  });

  it("元に戻した後に別の操作をすると、やり直しの履歴は消える", () => {
    let h = run({ type: "addLayer" }, { type: "undo" });
    expect(canRedo(h)).toBe(true);
    h = historyReducer(h, { type: "addMacro" });
    expect(canRedo(h)).toBe(false);
  });

  it("元に戻すと、その操作をしたレイヤーが表示される", () => {
    let h = run({ type: "selectLayer", layerNumber: 1 }, { type: "setAssignment", elementId: "L-0-0", action: "press", label: "x" }, { type: "selectLayer", layerNumber: 0 });
    h = historyReducer(h, { type: "undo" });
    expect(h.present.currentLayer).toBe(1);
    expect(label(h.present, 1, "L-0-0")).toBeUndefined();
  });
});
