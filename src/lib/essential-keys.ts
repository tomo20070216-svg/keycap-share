import type { Layer } from "@/lib/schemas";

/**
 * 普段使うキーの不足チェック(フェーズ9、人間の決定 2026-10-05)。
 * ノートPC・一体型キーボード(US配列、60%相当。Fキー・矢印キーなし)で普段使う
 * 基本的なキーが、投稿する配列のどこにもないと気づきにくいため、保存前に知らせる。
 * 警告のみで保存はブロックしない(文字入力以外に特化した配列もあるため)。
 *
 * 判定は、配列(全レイヤー)の割り当ての表示名(label)と、
 * src/lib/key-palette.ts のパレット表記に合わせた候補とを、大文字小文字を無視して比較する。
 */

export type EssentialKey = {
  /** 画面に表示する名前 */
  name: string;
  /** label との比較に使う候補(どれか1つでも一致すればよい。Shift/Ctrl/Winは左右の区別をしない) */
  candidates: string[];
};

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({ name: c, candidates: [c] }));
const digits = "0123456789".split("").map((c) => ({ name: c, candidates: [c] }));
const symbols = ["`", "-", "=", "[", "]", "\\", ";", "'", ",", ".", "/"].map((c) => ({
  name: c,
  candidates: [c],
}));
const controls = ["Esc", "Tab", "Enter", "BackSpace", "Space"].map((c) => ({ name: c, candidates: [c] }));
const modifiers: EssentialKey[] = [
  { name: "Shift", candidates: ["Shift"] },
  { name: "Ctrl", candidates: ["Ctrl"] },
  { name: "Win/Cmd", candidates: ["Win", "Cmd"] },
];

/** 必須キー一覧(人間の決定: 英字26・数字10・記号11・制御5・修飾3項目=55)。CapsLock・Alt・矢印キーは対象外 */
export const ESSENTIAL_KEYS: EssentialKey[] = [...letters, ...digits, ...symbols, ...controls, ...modifiers];

function normalize(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * 配列(全レイヤー)の割り当てのうち、必須キーに不足しているものの名前の一覧を返す(不足がなければ空配列)。
 * 元の並び順(ESSENTIAL_KEYS の並び)を保つ。
 */
export function findMissingEssentialKeys(layers: Layer[]): string[] {
  const present = new Set(
    layers.flatMap((layer) => layer.assignments.map((a) => normalize(a.label)))
  );
  return ESSENTIAL_KEYS.filter((key) => !key.candidates.some((c) => present.has(normalize(c)))).map(
    (key) => key.name
  );
}
