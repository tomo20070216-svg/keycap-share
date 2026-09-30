import { describe, expect, it } from "vitest";
import { cronHealth, formatDateTimeJa } from "@/lib/cron-status";

describe("定期実行の状態(P7-12)", () => {
  const now = new Date("2026-10-01T04:00:00.000Z"); // 日本時間 13:00
  it("記録がなければ never、26時間以内で成功なら ok、失敗なら failed", () => {
    expect(cronHealth(null, now)).toBe("never");
    expect(cronHealth({ ok: true, ranAt: "2026-10-01T03:07:00.000Z" }, now)).toBe("ok");
    expect(cronHealth({ ok: false, ranAt: "2026-10-01T03:07:00.000Z" }, now)).toBe("failed");
  });
  it("26時間を超えて動いていなければ late(前日の実行が1時間遅れても ok)", () => {
    expect(cronHealth({ ok: true, ranAt: "2026-09-30T03:59:00.000Z" }, now)).toBe("ok"); // 24時間前
    expect(cronHealth({ ok: true, ranAt: "2026-09-30T02:00:00.000Z" }, now)).toBe("ok"); // 26時間ちょうど
    expect(cronHealth({ ok: true, ranAt: "2026-09-30T01:59:00.000Z" }, now)).toBe("late");
  });
  it("日時は日本時間で表示する", () => {
    expect(formatDateTimeJa("2026-10-01T03:07:00.000Z")).toBe("2026/10/01 12:07");
  });
});
