import { describe, expect, it } from "vitest";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { MAX_TAGS, PRESET_TAGS, alignSpelling, hasTag, suggestTags, tagCandidates, toggleTag } from "@/lib/tag-suggestions";
import type { Layer } from "@/lib/schemas";

const layer = (labels: Record<string, string>, layerNumber = 0): Layer => ({
  layerNumber,
  layerName: `L${layerNumber}`,
  assignments: Object.entries(labels).map(([elementId, label]) => ({ elementId, action: "press" as const, label })),
});
const suggest = (layers: Layer[], extra: { title?: string; description?: string; tagsText?: string } = {}) =>
  suggestTags({ title: extra.title ?? "", description: extra.description ?? "", tagsText: extra.tagsText ?? "", layers });

describe("タグの候補(P7-8)", () => {
  it("用意したタグのあとに使われているタグが並び、大文字・小文字の違いだけのものは1つにまとめる", () => {
    const c = tagCandidates(["自作キーボード", "Mac", "親指"]);
    expect(c.slice(0, PRESET_TAGS.length)).toEqual([...PRESET_TAGS]);
    expect(c.slice(PRESET_TAGS.length)).toEqual(["自作キーボード", "親指"]);
  });
  it("用意したタグが別の書き方ですでに使われていれば、その書き方にそろえる(タグの一覧が分かれないように)", () => {
    const c = tagCandidates(["windows", "mac"]);
    expect(c).toContain("windows");
    expect(c).toContain("mac");
    expect(c).not.toContain("Windows");
    expect(c).toHaveLength(PRESET_TAGS.length);
    expect(alignSpelling(["Windows", "日本語入力"], c)).toEqual(["windows", "日本語入力"]);
  });
  it("使われているタグは最大20個", () => {
    const many = Array.from({ length: 30 }, (_, i) => `タグ${i}`);
    expect(tagCandidates(many)).toHaveLength(PRESET_TAGS.length + 20);
  });
});

describe("タグを押したとき(P7-8)", () => {
  it("付いていなければ付け、付いていれば外す(大文字・小文字は区別しない)", () => {
    expect(toggleTag("", "Mac")).toEqual({ tagsText: "Mac", error: null });
    expect(toggleTag("大西配列 Mac", "日本語入力")).toEqual({ tagsText: "大西配列 Mac 日本語入力", error: null });
    expect(toggleTag("大西配列 mac", "Mac")).toEqual({ tagsText: "大西配列", error: null });
    expect(hasTag("#Mac、windows", "Windows")).toBe(true);
  });
  it("10個付いているときは追加せず、エラー文を返す。外すことはできる", () => {
    const ten = Array.from({ length: MAX_TAGS }, (_, i) => `t${i}`).join(" ");
    const r = toggleTag(ten, "Mac");
    expect(r.tagsText).toBe(ten);
    expect(r.error).toContain("10個まで");
    expect(toggleTag(ten, "t3").tagsText.split(" ")).toHaveLength(MAX_TAGS - 1);
  });
});

describe("内容からのおすすめ(P7-9)", () => {
  it("Mac・Windows・日本語入力: キーの名前から", () => {
    expect(suggest([layer({ "L-1-0": "Cmd" })])).toEqual(["Mac"]);
    expect(suggest([layer({ "L-1-0": "Option" })])).toEqual(["Mac"]);
    expect(suggest([layer({ "L-1-0": "Win" })])).toEqual(["Windows"]);
    expect(suggest([layer({ "L-1-0": "変換" })])).toEqual(["日本語入力"]);
    expect(suggest([layer({ "L-1-0": "半角/全角" })])).toEqual(["日本語入力"]);
  });
  it("プログラミング: 記号が4種類以上(3種類ではおすすめしない)", () => {
    expect(suggest([layer({ a: "{", b: "}", c: "[" })])).toEqual([]);
    expect(suggest([layer({ a: "{", b: "}", c: "[" }), layer({ d: "|" }, 1)])).toEqual(["プログラミング"]);
  });
  it("QWERTY: 左手の上の段に Q W E R T が左から順に並ぶとき", () => {
    const qwerty = layer({ "L-0-0": "Esc", "L-0-1": "Q", "L-0-2": "W", "L-0-3": "E", "L-0-4": "R", "L-0-5": "T" });
    expect(suggest([qwerty])).toEqual(["QWERTY"]);
    const other = layer({ "L-0-1": "Q", "L-0-2": "L", "L-0-3": "U", "L-0-4": ",", "L-0-5": "." });
    expect(suggest([other])).toEqual([]);
  });
  it("タイトル・説明に用意したタグの言葉が含まれるとき", () => {
    expect(suggest([], { title: "大西配列の基準" })).toEqual(["大西配列"]);
    expect(suggest([], { description: "プログラミング用に記号を寄せました" })).toEqual(["プログラミング"]);
  });
  it("すでに付いているタグはおすすめしない", () => {
    expect(suggest([layer({ "L-1-0": "Cmd" })], { tagsText: "mac" })).toEqual([]);
  });
  it("工場出荷時配列: Mac と QWERTY をおすすめする(Cmd・Opt があり、上の段が QWERT)", () => {
    expect(suggest(orcaEchoFactoryDefaultLayers)).toEqual(["Mac", "QWERTY"]);
  });
});
