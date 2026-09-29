/**
 * 画面上部の進み具合のバー(P7-11)を出すかどうかの判断。DOM に依存しない純粋な関数。
 * バーを出すのは「このサイトの別の画面へ、今のタブで移るリンク」を普通に押したときだけ。
 */
export function shouldStartProgress(input: {
  /** リンク先(a要素の href。相対でもよい) */
  href: string | null;
  /** a要素の target 属性 */
  target: string | null;
  /** a要素に download 属性があるか */
  download: boolean;
  /** 押したマウスのボタン(0 = 左) */
  button: number;
  /** Ctrl・⌘・Shift・Alt を押しながらか(新しいタブ・ウィンドウで開く操作) */
  modified: boolean;
  /** すでに別の処理が既定の動作を止めているか */
  defaultPrevented: boolean;
  /** 今の画面のURL */
  currentUrl: string;
}): boolean {
  if (!input.href || input.defaultPrevented || input.download) return false;
  if (input.button !== 0 || input.modified) return false;
  if (input.target && input.target !== "_self") return false;
  let next: URL, current: URL;
  try {
    current = new URL(input.currentUrl);
    next = new URL(input.href, current);
  } catch {
    return false;
  }
  if (next.origin !== current.origin) return false; // 外部のサイト(X の共有など)
  // 同じ画面(# だけが違う場合も含む)では、画面が切り替わらないので出さない
  return next.pathname !== current.pathname || next.search !== current.search;
}
