import { editorReducer, type EditorAction, type EditorState } from "@/lib/editor-state";

/**
 * エディタの「元に戻す」「やり直す」(P5-12)。
 * 内容が変わる操作だけを履歴に積む(要素の選択やレイヤーの切り替えなど、見ている場所が変わるだけの操作は積まない)。
 * 文字を1文字打つたびに履歴が増えないよう、同じ入力欄への続けての入力は1つにまとめる。
 */

export type EditorHistory = {
  present: EditorState;
  past: EditorState[];
  future: EditorState[];
  /** 直前にまとめた入力欄(同じ欄への続けての入力を1つにまとめるため) */
  lastMergeKey: string | null;
};

export type HistoryAction = EditorAction | { type: "undo" } | { type: "redo" } | { type: "reset"; state: EditorState };

const MAX_HISTORY = 100;

/** 見ている場所が変わるだけで、内容は変わらない操作 */
const VIEW_ONLY: ReadonlySet<EditorAction["type"]> = new Set([
  "selectLayer",
  "selectElement",
  "startComboPicking",
  "stopComboPicking",
]);

/** 同じ入力欄への続けての入力をまとめるための目印(まとめない操作は null) */
function mergeKey(action: EditorAction, state: EditorState): string | null {
  switch (action.type) {
    case "setField":
      return `field:${action.field}`;
    case "setAssignment":
      return `assign:${state.currentLayer}:${action.elementId}:${action.action}`;
    case "renameLayer":
      return `layerName:${action.layerNumber}`;
    case "setComboLabel":
      return `comboLabel:${action.index}`;
    case "setMacro":
      return `macro:${action.index}:${action.field}`;
    default:
      return null;
  }
}

/** 内容が同じか(選択中の要素など、表示の状態の違いは無視する) */
function sameContent(a: EditorState, b: EditorState): boolean {
  const strip = (s: EditorState) => ({ ...s, selectedElementId: null, comboPicking: null, currentLayer: 0 });
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

export function createHistory(state: EditorState): EditorHistory {
  return { present: state, past: [], future: [], lastMergeKey: null };
}

export function canUndo(h: EditorHistory): boolean {
  return h.past.length > 0;
}

export function canRedo(h: EditorHistory): boolean {
  return h.future.length > 0;
}

export function historyReducer(h: EditorHistory, action: HistoryAction): EditorHistory {
  switch (action.type) {
    case "undo": {
      const previous = h.past.at(-1);
      if (!previous) return h;
      // 戻した操作をしたときのレイヤーを表示する(何が戻ったか見えるように)。選択は解除する
      const restored = { ...previous, selectedElementId: null, comboPicking: null };
      return { present: restored, past: h.past.slice(0, -1), future: [h.present, ...h.future], lastMergeKey: null };
    }
    case "redo": {
      const [next, ...rest] = h.future;
      if (!next) return h;
      return { present: { ...next, selectedElementId: null, comboPicking: null }, past: [...h.past, h.present], future: rest, lastMergeKey: null };
    }
    case "reset":
      return createHistory(action.state);
    default: {
      const next = editorReducer(h.present, action);
      if (next === h.present) return h;
      if (VIEW_ONLY.has(action.type) || sameContent(next, h.present)) return { ...h, present: next };
      const key = mergeKey(action, h.present);
      if (key !== null && key === h.lastMergeKey) {
        // 同じ入力欄への続けての入力は、1つ前の履歴にまとめる
        return { ...h, present: next, future: [] };
      }
      return {
        present: next,
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        future: [],
        lastMergeKey: key,
      };
    }
  }
}
