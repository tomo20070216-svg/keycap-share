import { parseTags } from "@/lib/editor-state";
import type { Layer } from "@/lib/schemas";

/**
 * タグを押すだけで付けられるようにするための、純粋な関数(P7-8、P7-9)。
 * - タグの候補: 用意したタグ + ほかの人が使っているタグ
 * - 内容からのおすすめ: キーの名前・タイトル・説明から決まりごとで選ぶ。自動では付けない
 */

/** 用意したタグ(人間の決定、2026-09-30) */
export const PRESET_TAGS = [
  "日本語入力",
  "英語配列",
  "Mac",
  "Windows",
  "プログラミング",
  "ゲーム",
  "初心者向け",
  "親指キー活用",
  "大西配列",
  "QWERTY",
] as const;

/** 1つの配列に付けられるタグの数(schemas.ts の上限と同じ) */
export const MAX_TAGS = 10;

/**
 * 候補: 用意したタグのあとに、使われているタグ(多い順)を並べる。大文字・小文字の違いだけのものは1つにまとめる。
 * 用意したタグと同じタグがすでに別の書き方(例: "windows")で使われていれば、その書き方にそろえる
 * (DBのタグは大文字・小文字を区別するため、そろえないとタグの一覧が分かれてしまう)。
 */
export function tagCandidates(popularTags: string[], limit = 20): string[] {
  const popular = popularTags.slice(0, limit);
  const seen = new Set<string>();
  const out: string[] = [];
  const presets = PRESET_TAGS.map((p) => popular.find((t) => t.toLowerCase() === p.toLowerCase()) ?? p);
  for (const tag of [...presets, ...popular]) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

export type ToggleTagResult = { tagsText: string; error: string | null };

/** タグを押したとき: 付いていれば外し、付いていなければ付ける(10個まで)。入力欄の文字列を返す */
export function toggleTag(tagsText: string, tag: string): ToggleTagResult {
  const tags = parseTags(tagsText);
  const index = tags.findIndex((t) => t.toLowerCase() === tag.toLowerCase());
  if (index >= 0) {
    tags.splice(index, 1);
    return { tagsText: tags.join(" "), error: null };
  }
  if (tags.length >= MAX_TAGS) {
    return { tagsText, error: `タグは${MAX_TAGS}個までです。ほかのタグを外してから追加してください。` };
  }
  return { tagsText: [...tags, tag].join(" "), error: null };
}

/** おすすめのタグを、候補と同じ書き方にそろえる(候補になければそのまま) */
export function alignSpelling(tags: string[], candidates: string[]): string[] {
  return tags.map((tag) => candidates.find((c) => c.toLowerCase() === tag.toLowerCase()) ?? tag);
}

/** そのタグが入力欄に付いているか(大文字・小文字は区別しない) */
export function hasTag(tagsText: string, tag: string): boolean {
  return parseTags(tagsText).some((t) => t.toLowerCase() === tag.toLowerCase());
}

const PROGRAMMING_SYMBOLS = ["{", "}", "[", "]", "<", ">", "|", "\\", "~", "`"];

/**
 * 内容からのおすすめ(P7-9)。すでに付いているタグは除く。
 * 決まりごと:
 * - Mac: Cmd・Command・⌘・Opt・Option のどれかがある
 * - Windows: Win・Windows のどれかがある
 * - 日本語入力: 変換・無変換・かな・英数・半角/全角・IME のどれかがある
 * - プログラミング: { } [ ] < > | \ ~ ` のうち4種類以上がキーに割り当てられている
 * - QWERTY: 左手の上の段(キーの id が L-0-*)に Q W E R T が左から順に並んでいる
 * - 用意したタグの言葉が、タイトルか説明に含まれている
 */
export function suggestTags(input: { title: string; description: string; tagsText: string; layers: Layer[] }): string[] {
  const labels = input.layers.flatMap((l) => l.assignments.map((a) => a.label.trim())).filter((l) => l.length > 0);
  const lower = new Set(labels.map((l) => l.toLowerCase()));
  const hasAny = (words: string[]) => words.some((w) => lower.has(w.toLowerCase()));
  const out: string[] = [];

  if (hasAny(["Cmd", "Command", "⌘", "Opt", "Option"])) out.push("Mac");
  if (hasAny(["Win", "Windows"])) out.push("Windows");
  if (hasAny(["変換", "無変換", "かな", "英数", "半角/全角", "IME"])) out.push("日本語入力");
  if (PROGRAMMING_SYMBOLS.filter((s) => labels.includes(s)).length >= 4) out.push("プログラミング");
  if (hasQwertyTopRow(input.layers)) out.push("QWERTY");

  const text = `${input.title}\n${input.description}`.toLowerCase();
  for (const tag of PRESET_TAGS) {
    if (text.includes(tag.toLowerCase())) out.push(tag);
  }

  return [...new Set(out)].filter((tag) => !hasTag(input.tagsText, tag));
}

/** 基本のレイヤー(番号が最小)で、左手の上の段に Q W E R T が左から順に並んでいるか */
function hasQwertyTopRow(layers: Layer[]): boolean {
  const base = [...layers].sort((a, b) => a.layerNumber - b.layerNumber)[0];
  if (!base) return false;
  const row = base.assignments
    .filter((a) => a.action === "press" && /^L-0-\d+$/.test(a.elementId))
    .sort((a, b) => Number(a.elementId.split("-")[2]) - Number(b.elementId.split("-")[2]))
    .map((a) => a.label.trim().toUpperCase())
    .join("");
  return row.includes("QWERT");
}
