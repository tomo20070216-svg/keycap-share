import type { Action, Combo, Layer, LayoutInput, Macro } from "@/lib/schemas";

/**
 * 投稿エディタの状態と操作(P5-2〜P5-5)。画面の部品から切り離した純粋な関数なので、テストで確認できる。
 * 保存するときは toLayoutInput で、サーバーへ送る入力の形にする。
 */

export type EditorState = {
  keyboardId: string;
  title: string;
  authorName: string;
  description: string;
  /** タグは空白区切りの文字列で編集する(例: "日本語入力 親指キー") */
  tagsText: string;
  layers: Layer[];
  combos: Combo[];
  macros: Macro[];
  /** 複製元(「コピーして編集」のとき) */
  forkedFromLayoutId?: string;
  /** 表示中のレイヤー番号 */
  currentLayer: number;
  /** 選択中の要素 */
  selectedElementId: string | null;
  /** キーを選んでいるコンボの番号(0始まり)。null ならキーのクリックは割り当ての編集 */
  comboPicking: number | null;
};

export type EditorAction =
  | { type: "setField"; field: "title" | "authorName" | "description" | "tagsText"; value: string }
  | { type: "selectLayer"; layerNumber: number }
  | { type: "selectElement"; elementId: string | null }
  | { type: "setAssignment"; elementId: string; action: Action; label: string }
  | { type: "addLayer" }
  | { type: "renameLayer"; layerNumber: number; name: string }
  | { type: "removeLayer"; layerNumber: number }
  | { type: "addCombo" }
  | { type: "setComboLabel"; index: number; label: string }
  | { type: "toggleComboLayer"; index: number; layerNumber: number }
  | { type: "startComboPicking"; index: number }
  | { type: "stopComboPicking" }
  | { type: "toggleComboElement"; elementId: string }
  | { type: "removeCombo"; index: number }
  | { type: "addMacro" }
  | { type: "setMacro"; index: number; field: "name" | "description"; value: string }
  | { type: "removeMacro"; index: number };

export const MAX_LAYERS = 10;

/** 番号が最小のレイヤー(基本レイヤー)。削除できない */
export function baseLayerNumber(layers: Layer[]): number {
  return Math.min(...layers.map((l) => l.layerNumber));
}

export function createEditorState(init: {
  keyboardId: string;
  layers: Layer[];
  title?: string;
  authorName?: string;
  description?: string;
  tags?: string[];
  combos?: Combo[];
  macros?: Macro[];
  forkedFromLayoutId?: string;
}): EditorState {
  const layers = [...init.layers].sort((a, b) => a.layerNumber - b.layerNumber);
  return {
    keyboardId: init.keyboardId,
    title: init.title ?? "",
    authorName: init.authorName ?? "",
    description: init.description ?? "",
    tagsText: (init.tags ?? []).join(" "),
    layers,
    combos: init.combos ?? [],
    macros: init.macros ?? [],
    forkedFromLayoutId: init.forkedFromLayoutId,
    currentLayer: layers[0]?.layerNumber ?? 0,
    selectedElementId: null,
    comboPicking: null,
  };
}

function updateLayer(state: EditorState, layerNumber: number, fn: (layer: Layer) => Layer): EditorState {
  return { ...state, layers: state.layers.map((l) => (l.layerNumber === layerNumber ? fn(l) : l)) };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "setField":
      return { ...state, [action.field]: action.value };

    case "selectLayer":
      return state.layers.some((l) => l.layerNumber === action.layerNumber)
        ? { ...state, currentLayer: action.layerNumber }
        : state;

    case "selectElement":
      return { ...state, selectedElementId: action.elementId };

    case "setAssignment": {
      // 表示名を空にすると、その操作の割り当てを消す
      const label = action.label;
      return updateLayer(state, state.currentLayer, (layer) => {
        const others = layer.assignments.filter((a) => !(a.elementId === action.elementId && a.action === action.action));
        return {
          ...layer,
          assignments: label === "" ? others : [...others, { elementId: action.elementId, action: action.action, label }],
        };
      });
    }

    case "addLayer": {
      if (state.layers.length >= MAX_LAYERS) return state;
      const next = Math.max(...state.layers.map((l) => l.layerNumber)) + 1;
      return {
        ...state,
        layers: [...state.layers, { layerNumber: next, layerName: `レイヤー${next}`, assignments: [] }],
        currentLayer: next,
      };
    }

    case "renameLayer":
      return updateLayer(state, action.layerNumber, (l) => ({ ...l, layerName: action.name }));

    case "removeLayer": {
      if (action.layerNumber === baseLayerNumber(state.layers)) return state; // 基本レイヤーは削除できない
      const layers = state.layers.filter((l) => l.layerNumber !== action.layerNumber);
      if (layers.length === state.layers.length) return state;
      // 消したレイヤーを対象にしていたコンボからは、そのレイヤーを外す
      const combos = state.combos.map((c) => ({
        ...c,
        layerNumbers: c.layerNumbers.filter((n) => n !== action.layerNumber),
      }));
      const currentLayer = state.currentLayer === action.layerNumber ? baseLayerNumber(layers) : state.currentLayer;
      return { ...state, layers, combos, currentLayer };
    }

    case "addCombo":
      return {
        ...state,
        combos: [...state.combos, { elementIds: [], label: "", layerNumbers: [] }],
        comboPicking: state.combos.length,
      };

    case "setComboLabel":
      return { ...state, combos: state.combos.map((c, i) => (i === action.index ? { ...c, label: action.label } : c)) };

    case "toggleComboLayer":
      return {
        ...state,
        combos: state.combos.map((c, i) =>
          i === action.index
            ? {
                ...c,
                layerNumbers: c.layerNumbers.includes(action.layerNumber)
                  ? c.layerNumbers.filter((n) => n !== action.layerNumber)
                  : [...c.layerNumbers, action.layerNumber].sort((a, b) => a - b),
              }
            : c
        ),
      };

    case "startComboPicking":
      return action.index >= 0 && action.index < state.combos.length ? { ...state, comboPicking: action.index } : state;

    case "stopComboPicking":
      return { ...state, comboPicking: null };

    case "toggleComboElement": {
      if (state.comboPicking === null) return state;
      const index = state.comboPicking;
      return {
        ...state,
        combos: state.combos.map((c, i) =>
          i === index
            ? {
                ...c,
                elementIds: c.elementIds.includes(action.elementId)
                  ? c.elementIds.filter((id) => id !== action.elementId)
                  : [...c.elementIds, action.elementId],
              }
            : c
        ),
      };
    }

    case "removeCombo": {
      const combos = state.combos.filter((_, i) => i !== action.index);
      const comboPicking =
        state.comboPicking === null || state.comboPicking === action.index
          ? null
          : state.comboPicking > action.index
            ? state.comboPicking - 1
            : state.comboPicking;
      return { ...state, combos, comboPicking };
    }

    case "addMacro":
      return { ...state, macros: [...state.macros, { name: "", description: "" }] };

    case "setMacro":
      return {
        ...state,
        macros: state.macros.map((m, i) => (i === action.index ? { ...m, [action.field]: action.value } : m)),
      };

    case "removeMacro":
      return { ...state, macros: state.macros.filter((_, i) => i !== action.index) };
  }
}

/** タグの文字列(空白・読点区切り)を配列にする。先頭の # は外し、重複は除く */
export function parseTags(text: string): string[] {
  const tags = text
    .split(/[\s、,]+/)
    .map((t) => t.replace(/^#+/, "").trim())
    .filter((t) => t.length > 0);
  return [...new Set(tags)];
}

/** サーバーへ送る入力の形にする。前後の空白を取り、空の投稿者名・説明は省略する */
export function toLayoutInput(state: EditorState): LayoutInput {
  const authorName = state.authorName.trim();
  const description = state.description.trim();
  return {
    keyboardId: state.keyboardId,
    title: state.title.trim(),
    ...(authorName ? { authorName } : {}),
    ...(description ? { description } : {}),
    ...(state.forkedFromLayoutId ? { forkedFromLayoutId: state.forkedFromLayoutId } : {}),
    tags: parseTags(state.tagsText),
    // 表示名の前後の空白を取り、空白だけになった割り当ては送らない
    layers: state.layers.map((l) => ({
      ...l,
      layerName: l.layerName.trim(),
      assignments: l.assignments.flatMap((a) => (a.label.trim() ? [{ ...a, label: a.label.trim() }] : [])),
    })),
    combos: state.combos.map((c) => ({ ...c, label: c.label.trim() })),
    macros: state.macros.map((m) => ({ name: m.name.trim(), description: m.description.trim() })),
  };
}
