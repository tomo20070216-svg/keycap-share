/**
 * このブラウザで⭐️を付けた配列(localStorage。P7-6)。ボタンの表示(付けた/付けていない)に使う。
 * 重複の防止はサーバー側(同じ接続元からは同じ配列に1つまで)でも行う。
 * localStorage が使えない環境(プライベートブラウズ等)では、付けていない扱いになる。
 */

const STORAGE_KEY = "keycap-share:stars";

const listeners = new Set<() => void>();

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function isStarred(slug: string): boolean {
  return slug in readAll();
}

export function setStarred(slug: string, on: boolean): void {
  try {
    const all = readAll();
    if (on) all[slug] = new Date().toISOString();
    else delete all[slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // 保存できない環境では何もしない
  }
  listeners.forEach((l) => l());
}

/** useSyncExternalStore 用: 付けた・外したときと、別のタブで変わったときに知らせる */
export function subscribeStarred(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
