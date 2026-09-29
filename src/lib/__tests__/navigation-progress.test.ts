import { describe, expect, it } from "vitest";
import { shouldStartProgress } from "@/lib/navigation-progress";

const base = {
  href: "/k/abc",
  target: null,
  download: false,
  button: 0,
  modified: false,
  defaultPrevented: false,
  currentUrl: "https://keycap-share.vercel.app/",
};

describe("画面上部の進み具合のバーを出すか(P7-11)", () => {
  it("このサイトの別の画面へのリンクを普通に押したときは出す(並べ替え・ページ送りのように ? 以降だけが違う場合も)", () => {
    expect(shouldStartProgress(base)).toBe(true);
    expect(shouldStartProgress({ ...base, href: "/?sort=popular" })).toBe(true);
    expect(shouldStartProgress({ ...base, href: "https://keycap-share.vercel.app/new" })).toBe(true);
  });
  it("同じ画面へのリンク・# だけが違うリンクでは出さない", () => {
    expect(shouldStartProgress({ ...base, href: "/" })).toBe(false);
    expect(shouldStartProgress({ ...base, href: "/#top" })).toBe(false);
  });
  it("新しいタブで開く操作(Ctrl・⌘・中クリック・target=_blank)・外部のサイト・ダウンロードでは出さない", () => {
    expect(shouldStartProgress({ ...base, modified: true })).toBe(false);
    expect(shouldStartProgress({ ...base, button: 1 })).toBe(false);
    expect(shouldStartProgress({ ...base, target: "_blank" })).toBe(false);
    expect(shouldStartProgress({ ...base, href: "https://x.com/intent/post?text=a" })).toBe(false);
    expect(shouldStartProgress({ ...base, download: true })).toBe(false);
    expect(shouldStartProgress({ ...base, href: null })).toBe(false);
    expect(shouldStartProgress({ ...base, defaultPrevented: true })).toBe(false);
  });
});
