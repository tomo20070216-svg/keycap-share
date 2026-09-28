import { describe, expect, it } from "vitest";
import {
  generateEditSecret,
  generateSlug,
  hashEditSecret,
  verifyEditSecret,
} from "@/lib/edit-secret";

describe("編集用秘密キー", () => {
  it("毎回異なる43文字のURL安全な値が発行される", () => {
    const a = generateEditSecret();
    const b = generateEditSecret();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("ハッシュはDBのCHECK制約と同じ64桁hexで、平文を含まない", () => {
    const secret = generateEditSecret();
    const hash = hashEditSecret(secret);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(secret);
  });

  it("正しい秘密キーだけが照合に通る", () => {
    const secret = generateEditSecret();
    const hash = hashEditSecret(secret);
    expect(verifyEditSecret(secret, hash)).toBe(true);
    expect(verifyEditSecret(generateEditSecret(), hash)).toBe(false);
    expect(verifyEditSecret(secret, "not-a-hash")).toBe(false);
  });
});

describe("公開URL用slug", () => {
  it("DBのCHECK制約 ^[A-Za-z0-9_-]{6,32}$ を満たす", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toMatch(/^[A-Za-z0-9_-]{6,32}$/);
    }
  });
});
