import { describe, expect, it } from "vitest";
import { readKeyFromHash } from "@/lib/edit-keys";

describe("readKeyFromHash 編集用URLの # 以降", () => {
  const key = "A".repeat(40) + "b-_";
  it("#key=... から秘密キーを読む", () => {
    expect(readKeyFromHash(`#key=${key}`)).toBe(key);
    expect(readKeyFromHash(`key=${key}`)).toBe(key);
  });
  it("ない・形が違う場合は null", () => {
    expect(readKeyFromHash("")).toBeNull();
    expect(readKeyFromHash("#key=short")).toBeNull();
    expect(readKeyFromHash(`#other=${key}`)).toBeNull();
    expect(readKeyFromHash(`#key=${key}!`)).toBeNull();
  });
});
