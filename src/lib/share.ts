/**
 * Xでの共有(P4-4)。Xの開発者アカウント・APIは使わず、投稿画面(Web Intent)を開くだけ。
 * 文面の方針は docs/voice.md「X共有時の初期文言」:
 * - 初期テンプレート: 「{タイトル} — {機種名}の配列を作りました { URL }」
 * - ハッシュタグ例: #OrcaEcho #分割キーボード(投稿者が編集できる。固定しない)
 * - 「なぜこの配置にしたか」の説明文は長くなりがちなので共有文に含めない
 */

/** 機種ごとのハッシュタグ(先頭の#なし)。機種が増えたらここに足す */
const KEYBOARD_HASHTAGS: Record<string, string[]> = {
  "orca-echo": ["OrcaEcho"],
};
const COMMON_HASHTAGS = ["分割キーボード"];

export function shareHashtags(keyboardId: string): string[] {
  return [...(KEYBOARD_HASHTAGS[keyboardId] ?? []), ...COMMON_HASHTAGS];
}

/** 編集欄の初期値。URLは投稿画面側で付くので文面には入れない */
export function buildShareText(params: { title: string; keyboardName: string; keyboardId: string }): string {
  const tags = shareHashtags(params.keyboardId).map((t) => `#${t}`).join(" ");
  return `${params.title} — ${params.keyboardName}の配列を作りました\n${tags}`;
}

/** Xの投稿画面(Web Intent)のURL。文面とURLは投稿画面で編集できる */
export function buildXIntentUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://x.com/intent/post?${params.toString()}`;
}
