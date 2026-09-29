import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/cron-auth";

describe("isAuthorizedCron 定期実行からの呼び出しの確認", () => {
  const secret = "a-random-secret-of-enough-length";
  it("「Bearer <CRON_SECRET>」と一致すれば受け付ける", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
  });
  it("合言葉なし・違う合言葉・Bearer なしは受け付けない", () => {
    expect(isAuthorizedCron(null, secret)).toBe(false);
    expect(isAuthorizedCron("Bearer wrong", secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
  });
  it("CRON_SECRET が設定されていなければ、だれからも受け付けない", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});
