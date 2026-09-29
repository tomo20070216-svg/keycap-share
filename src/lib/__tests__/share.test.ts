import { describe, expect, it } from "vitest";
import { buildShareText, buildXIntentUrl, shareHashtags } from "@/lib/share";

describe("共有の文面", () => {
  it("Orca echo は #OrcaEcho #分割キーボード、ほかの機種は #分割キーボード だけ", () => {
    expect(shareHashtags("orca-echo")).toEqual(["OrcaEcho", "分割キーボード"]);
    expect(shareHashtags("other")).toEqual(["分割キーボード"]);
  });

  it("初期値は docs/voice.md のテンプレートどおり(URLは投稿画面側で付くので含めない)", () => {
    expect(buildShareText({ title: "Orca echo 工場出荷時配列", keyboardName: "Keychron Orca echo", keyboardId: "orca-echo" })).toBe(
      "Orca echo 工場出荷時配列 — Keychron Orca echoの配列を作りました\n#OrcaEcho #分割キーボード"
    );
  });

  it("投稿画面のURLに文面とURLがエンコードされて入り、元に戻せる", () => {
    const text = "タイトル — 配列を作りました\n#OrcaEcho #分割キーボード & 記号?";
    const url = "https://keycap-share.vercel.app/k/abc123";
    const intent = new URL(buildXIntentUrl(text, url));
    expect(intent.origin + intent.pathname).toBe("https://x.com/intent/post");
    expect(intent.searchParams.get("text")).toBe(text);
    expect(intent.searchParams.get("url")).toBe(url);
  });
});
