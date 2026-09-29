import { describe, expect, it } from "vitest";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import {
  MAX_LAYERS,
  createEditorState,
  editorReducer,
  parseTags,
  toLayoutInput,
  type EditorAction,
  type EditorState,
} from "@/lib/editor-state";
import { validateSubmission } from "@/lib/layout-submission";

const initial = () => createEditorState({ keyboardId: "orca-echo", layers: orcaEchoFactoryDefaultLayers });
const run = (state: EditorState, ...actions: EditorAction[]) => actions.reduce(editorReducer, state);
const label = (s: EditorState, layer: number, elementId: string, action = "press") =>
  s.layers.find((l) => l.layerNumber === layer)?.assignments.find((a) => a.elementId === elementId && a.action === action)?.label;

describe("エディタの状態", () => {
  it("最初は工場出荷時配列が入り、基本レイヤー(0)を表示している", () => {
    const s = initial();
    expect(s.layers.map((l) => l.layerNumber)).toEqual([0, 1, 2]);
    expect(s.currentLayer).toBe(0);
    expect(label(s, 0, "L-0-0")).toBe("Esc");
  });

  it("表示中のレイヤーの割り当てを書き換え・追加・削除(空文字)できる。ほかのレイヤーは変わらない", () => {
    let s = run(initial(), { type: "setAssignment", elementId: "L-0-0", action: "press", label: "半角/全角" });
    expect(label(s, 0, "L-0-0")).toBe("半角/全角");
    s = run(s, { type: "setAssignment", elementId: "L-0-0", action: "hold", label: "Ctrl" });
    expect(label(s, 0, "L-0-0", "hold")).toBe("Ctrl");
    s = run(s, { type: "setAssignment", elementId: "L-0-0", action: "press", label: "" });
    expect(label(s, 0, "L-0-0")).toBeUndefined();
    expect(label(s, 1, "L-0-3")).toBe("↑"); // fn1 はそのまま
    s = run(s, { type: "selectLayer", layerNumber: 1 }, { type: "setAssignment", elementId: "L-DIAL", action: "cw", label: "音量+" });
    expect(label(s, 1, "L-DIAL", "cw")).toBe("音量+");
    expect(label(s, 0, "L-DIAL", "cw")).toBeUndefined();
  });

  it("レイヤーを追加・名前変更・削除できる。追加は10個まで", () => {
    let s = run(initial(), { type: "addLayer" });
    expect(s.layers.map((l) => l.layerNumber)).toEqual([0, 1, 2, 3]);
    expect(s.currentLayer).toBe(3);
    s = run(s, { type: "renameLayer", layerNumber: 3, name: "記号" });
    expect(s.layers.find((l) => l.layerNumber === 3)?.layerName).toBe("記号");
    s = run(s, { type: "removeLayer", layerNumber: 3 });
    expect(s.layers.map((l) => l.layerNumber)).toEqual([0, 1, 2]);
    expect(s.currentLayer).toBe(0);
    const full = run(initial(), ...Array.from({ length: 20 }, () => ({ type: "addLayer" }) as EditorAction));
    expect(full.layers).toHaveLength(MAX_LAYERS);
  });

  it("基本レイヤーは削除できない", () => {
    const s = run(initial(), { type: "removeLayer", layerNumber: 0 });
    expect(s.layers.map((l) => l.layerNumber)).toEqual([0, 1, 2]);
  });

  it("コンボ: 追加するとキーを選ぶ状態になり、キーのクリックで対象を出し入れできる", () => {
    let s = run(initial(), { type: "addCombo" });
    expect(s.comboPicking).toBe(0);
    s = run(
      s,
      { type: "toggleComboElement", elementId: "R-1-2" },
      { type: "toggleComboElement", elementId: "R-1-3" },
      { type: "toggleComboElement", elementId: "R-1-4" },
      { type: "toggleComboElement", elementId: "R-1-4" },
      { type: "setComboLabel", index: 0, label: "左クリック" },
      { type: "stopComboPicking" }
    );
    expect(s.combos).toEqual([{ elementIds: ["R-1-2", "R-1-3"], label: "左クリック", layerNumbers: [] }]);
    expect(s.comboPicking).toBeNull();
    // キーを選ぶ状態でなければ、toggleComboElement は何もしない
    expect(run(s, { type: "toggleComboElement", elementId: "L-0-0" }).combos).toEqual(s.combos);
  });

  it("コンボの対象レイヤーを切り替えられ、レイヤーを消すとコンボの対象からも外れる", () => {
    let s = run(initial(), { type: "addCombo" }, { type: "toggleComboLayer", index: 0, layerNumber: 2 }, { type: "toggleComboLayer", index: 0, layerNumber: 1 });
    expect(s.combos[0].layerNumbers).toEqual([1, 2]);
    s = run(s, { type: "removeLayer", layerNumber: 2 });
    expect(s.combos[0].layerNumbers).toEqual([1]);
    s = run(s, { type: "toggleComboLayer", index: 0, layerNumber: 1 });
    expect(s.combos[0].layerNumbers).toEqual([]);
  });

  it("コンボの削除で、キーを選んでいる番号もずれに合わせて直る", () => {
    let s = run(initial(), { type: "addCombo" }, { type: "addCombo" }, { type: "startComboPicking", index: 1 });
    s = run(s, { type: "removeCombo", index: 0 });
    expect(s.combos).toHaveLength(1);
    expect(s.comboPicking).toBe(0);
    s = run(s, { type: "removeCombo", index: 0 });
    expect(s.comboPicking).toBeNull();
  });

  it("マクロを追加・編集・削除できる", () => {
    let s = run(initial(), { type: "addMacro" }, { type: "setMacro", index: 0, field: "name", value: "署名" }, { type: "setMacro", index: 0, field: "description", value: "挨拶文" });
    expect(s.macros).toEqual([{ name: "署名", description: "挨拶文" }]);
    s = run(s, { type: "removeMacro", index: 0 });
    expect(s.macros).toEqual([]);
  });
});

describe("parseTags", () => {
  it("空白・読点・カンマで区切り、先頭の#を外し、重複を除く", () => {
    expect(parseTags(" #日本語入力  親指キー、初心者向け,親指キー ")).toEqual(["日本語入力", "親指キー", "初心者向け"]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("toLayoutInput", () => {
  it("サーバーの検証を通る形になる(空の投稿者名・説明は省略、前後の空白は除く)", () => {
    const s = run(
      initial(),
      { type: "setField", field: "title", value: "  私の配列  " },
      { type: "setField", field: "authorName", value: "   " },
      { type: "setField", field: "tagsText", value: "#テスト" }
    );
    const input = toLayoutInput(s);
    expect(input.title).toBe("私の配列");
    expect("authorName" in input).toBe(false);
    expect("description" in input).toBe(false);
    expect(input.tags).toEqual(["テスト"]);
    expect(validateSubmission(input).ok).toBe(true);
  });

  it("キーの表示名の前後の空白を取り、空白だけの割り当ては送らない", () => {
    const s = run(
      initial(),
      { type: "setAssignment", elementId: "L-0-0", action: "press", label: "  Esc2 " },
      { type: "setAssignment", elementId: "L-0-1", action: "press", label: "   " }
    );
    const base = toLayoutInput(s).layers.find((l) => l.layerNumber === 0)!;
    expect(base.assignments.find((a) => a.elementId === "L-0-0")?.label).toBe("Esc2");
    expect(base.assignments.find((a) => a.elementId === "L-0-1")).toBeUndefined();
  });

  it("タイトルが空のままではサーバーの検証を通らない", () => {
    const r = validateSubmission(toLayoutInput(initial()));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("タイトルを入力してください(1〜80文字)。");
  });
});
