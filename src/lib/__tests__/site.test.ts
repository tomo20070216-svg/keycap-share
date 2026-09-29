import { describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/site";

describe("getSiteUrl サイトのURL", () => {
  it("本番は本番用のドメイン", () => {
    expect(
      getSiteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "keycap-share.vercel.app", VERCEL_URL: "x-123.vercel.app" }).href
    ).toBe("https://keycap-share.vercel.app/");
  });
  it("プレビューはブランチ用のURL(なければデプロイごとのURL)", () => {
    expect(getSiteUrl({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "b.vercel.app", VERCEL_URL: "d.vercel.app" }).href).toBe("https://b.vercel.app/");
    expect(getSiteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "d.vercel.app" }).href).toBe("https://d.vercel.app/");
  });
  it("手元は localhost", () => {
    expect(getSiteUrl({}).href).toBe("http://localhost:3000/");
    expect(getSiteUrl({ PORT: "3123" }).href).toBe("http://localhost:3123/");
  });
});
