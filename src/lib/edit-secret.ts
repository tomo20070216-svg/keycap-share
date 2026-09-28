import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 編集用秘密キーと公開URL用slugの生成。
 * 秘密キーは推測不能なランダム値(32バイト)なので、保存には SHA-256 ハッシュで十分
 * (パスワードのような低エントロピーの値ではないため、bcrypt等の低速ハッシュは不要)。
 * DBには hashEditSecret の結果だけを保存し、平文は発行時に1回だけ利用者に渡す。
 */

export function generateEditSecret(): string {
  return randomBytes(32).toString("base64url"); // 43文字
}

export function hashEditSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex"); // 64桁hex
}

export function verifyEditSecret(secret: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashEditSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** 公開URL用のslug。DBのCHECK制約 ^[A-Za-z0-9_-]{6,32}$ を満たす。 */
export function generateSlug(): string {
  return randomBytes(8).toString("base64url"); // 11文字
}
