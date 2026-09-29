import { describe, expect, it } from "vitest";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { validateSubmission } from "@/lib/layout-submission";
import {
  LIMIT_PER_DAY,
  LIMIT_PER_HOUR,
  checkDescriptionUrls,
  contentHash,
  countUrls,
  STAR_LIMIT_PER_DAY,
  STAR_LIMIT_PER_HOUR,
  decideReport,
  decideStar,
  decideSubmission,
  hashIp,
} from "@/lib/spam-rules";

describe("URLの数", () => {
  it("http/https/www. で始まるものを数える", () => {
    expect(countUrls("説明だけ")).toBe(0);
    expect(countUrls("https://a.example と http://b.example と www.c.example")).toBe(3);
  });
  it("説明文のURLは2つまで。3つ以上はエラー文", () => {
    expect(checkDescriptionUrls(undefined)).toBeNull();
    expect(checkDescriptionUrls("https://a.example https://b.example")).toBeNull();
    expect(checkDescriptionUrls("https://a.example https://b.example https://c.example")).toContain("URLは2つまで");
  });
  it("投稿の検証でも、URLが3つ以上の説明文は拒否される", () => {
    const r = validateSubmission({
      keyboardId: "orca-echo",
      title: "t",
      description: "https://a.example https://b.example https://c.example",
      layers: orcaEchoFactoryDefaultLayers,
    });
    expect(r.ok).toBe(false);
  });
});

describe("投稿数の制限の判断", () => {
  it("1時間に5件・1日に20件まで", () => {
    expect(decideSubmission({ lastHour: LIMIT_PER_HOUR - 1, lastDay: 10, duplicateRecent: false })).toBeNull();
    expect(decideSubmission({ lastHour: LIMIT_PER_HOUR, lastDay: 10, duplicateRecent: false })).toContain("1時間ほど時間をおいて");
    expect(decideSubmission({ lastHour: 0, lastDay: LIMIT_PER_DAY, duplicateRecent: false })).toContain("今日の投稿の上限");
  });
  it("同じ内容の連投は拒否する", () => {
    expect(decideSubmission({ lastHour: 0, lastDay: 0, duplicateRecent: true })).toContain("同じ内容の配列が少し前に投稿されています");
  });
  it("エラー文には、次に何をすればよいかと、下書きが残っていることが書かれている", () => {
    const msg = decideSubmission({ lastHour: LIMIT_PER_HOUR, lastDay: 0, duplicateRecent: false })!;
    expect(msg).toContain("もう一度投稿してください");
    expect(msg).toContain("下書きとして残っています");
  });
});

describe("同じ内容のハッシュ・IPアドレスのハッシュ", () => {
  const base = { title: "配列", description: "説明", layers: orcaEchoFactoryDefaultLayers, combos: [], macros: [] };
  it("内容が同じなら同じ、違えば違うハッシュ(前後の空白は無視)", () => {
    expect(contentHash(base)).toBe(contentHash({ ...base, title: " 配列 " }));
    expect(contentHash(base)).not.toBe(contentHash({ ...base, title: "別の配列" }));
    expect(contentHash(base)).toMatch(/^[0-9a-f]{64}$/);
  });
  it("IPアドレスのハッシュは64桁の16進数で、IPアドレスを含まず、salt が違えば別の値", () => {
    const h = hashIp("203.0.113.5", "salt-a");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("203.0.113.5");
    expect(h).not.toBe(hashIp("203.0.113.5", "salt-b"));
    expect(h).toBe(hashIp("203.0.113.5", "salt-a"));
  });
});

describe("問題の報告の判断(P6-5)", () => {
  it("同じ配列への2回目の報告・短時間の連続した報告は受け付けない", () => {
    expect(decideReport({ lastHour: 0, lastDay: 0, alreadyReported: false })).toBeNull();
    expect(decideReport({ lastHour: 0, lastDay: 0, alreadyReported: true })).toContain("すでに報告を受け付けています");
    expect(decideReport({ lastHour: 5, lastDay: 5, alreadyReported: false })).toContain("時間をおいてから");
    expect(decideReport({ lastHour: 0, lastDay: 20, alreadyReported: false })).toContain("時間をおいてから");
  });
});

describe("⭐️の回数の制限(P7-6)", () => {
  it("1時間に60回・1日に300回まで", () => {
    expect(decideStar({ lastHour: STAR_LIMIT_PER_HOUR - 1, lastDay: 100 })).toBeNull();
    expect(decideStar({ lastHour: STAR_LIMIT_PER_HOUR, lastDay: 100 })).toContain("時間をおいてから");
    expect(decideStar({ lastHour: 0, lastDay: STAR_LIMIT_PER_DAY })).toContain("時間をおいてから");
  });
});
