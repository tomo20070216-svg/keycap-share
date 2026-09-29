/**
 * このブラウザに保存した編集用の秘密キー(localStorage)。
 * 投稿したとき・編集用URLで開いたときに保存し、配列ページの「編集する」ボタンの表示に使う。
 * localStorage が使えない環境(プライベートブラウズ等)では何もしない。
 */

const STORAGE_KEY = "keycap-share:edit-keys";

type Entry = { editSecret: string; title?: string; savedAt?: string };

function readAll(): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Entry>;
  } catch {
    return {};
  }
}

export function getEditKey(slug: string): string | null {
  return readAll()[slug]?.editSecret ?? null;
}

export function saveEditKey(slug: string, editSecret: string, title?: string): void {
  try {
    const all = readAll();
    all[slug] = { editSecret, title, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // 保存できない環境では何もしない
  }
}

export function removeEditKey(slug: string): void {
  try {
    const all = readAll();
    delete all[slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // 何もしない
  }
}

/** 編集用URLの # 以降から秘密キーを読む(#key=...) */
export function readKeyFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const key = params.get("key");
  return key && /^[A-Za-z0-9_-]{43}$/.test(key) ? key : null;
}
