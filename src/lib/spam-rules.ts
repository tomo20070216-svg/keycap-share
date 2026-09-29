import { createHash } from "node:crypto";

/**
 * 投稿数の制限と簡易的な不正検知の「判断」だけを行う純粋な関数(P6-4)。DBの読み書きは rate-limit.ts。
 * 数値は人間の決定(2026-09-29): 同じ接続元から1時間に5件・1日に20件まで。説明文のURLは2つまで。
 * エラー文は docs/voice.md の方針(何が起きたか + 次に何をすればよいか)。
 */

export const LIMIT_PER_HOUR = 5;
export const LIMIT_PER_DAY = 20;
export const MAX_URLS_IN_DESCRIPTION = 2;
/** 同じ内容の連投とみなす時間(分) */
export const DUPLICATE_WINDOW_MINUTES = 10;

const DRAFT_NOTE = "入力内容はこのブラウザに下書きとして残っています。";

/** 文章に含まれるURLの数(http:// と https://、www. で始まるもの) */
export function countUrls(text: string): number {
  return (text.match(/\bhttps?:\/\/\S+|\bwww\.\S+/gi) ?? []).length;
}

/** 説明文のURLが多すぎればエラー文、問題なければ null */
export function checkDescriptionUrls(description: string | undefined): string | null {
  if (!description || countUrls(description) <= MAX_URLS_IN_DESCRIPTION) return null;
  return `「なぜこの配置にしたか」にURLが${MAX_URLS_IN_DESCRIPTION + 1}つ以上含まれています。URLは${MAX_URLS_IN_DESCRIPTION}つまでにしてから、もう一度保存してください。`;
}

/** 直近の投稿数と、同じ内容の投稿の有無から、受け付けるかを決める。受け付けないときはエラー文 */
export function decideSubmission(stats: { lastHour: number; lastDay: number; duplicateRecent: boolean }): string | null {
  if (stats.duplicateRecent) {
    return `同じ内容の配列が少し前に投稿されています。同じ配列を続けて投稿することはできません。内容を変えるか、${DUPLICATE_WINDOW_MINUTES}分ほど時間をおいてから投稿してください。${DRAFT_NOTE}`;
  }
  if (stats.lastDay >= LIMIT_PER_DAY) {
    return `今日の投稿の上限(${LIMIT_PER_DAY}件)に達しました。明日、もう一度投稿してください。${DRAFT_NOTE}`;
  }
  if (stats.lastHour >= LIMIT_PER_HOUR) {
    return `短い時間に投稿が続いたため、いったん受け付けを止めています。1時間ほど時間をおいてから、もう一度投稿してください。${DRAFT_NOTE}`;
  }
  return null;
}

/** 問題の報告の上限(同じ接続元から): 1時間に5件・1日に20件。同じ配列への報告は1日1回まで */
export const REPORT_LIMIT_PER_HOUR = 5;
export const REPORT_LIMIT_PER_DAY = 20;

/** 問題の報告を受け付けるか。受け付けないときはエラー文 */
export function decideReport(stats: { lastHour: number; lastDay: number; alreadyReported: boolean }): string | null {
  if (stats.alreadyReported) {
    return "この配列はすでに報告を受け付けています。ご協力ありがとうございます。";
  }
  if (stats.lastDay >= REPORT_LIMIT_PER_DAY || stats.lastHour >= REPORT_LIMIT_PER_HOUR) {
    return "短い時間に報告が続いたため、いったん受け付けを止めています。時間をおいてから、もう一度お試しください。";
  }
  return null;
}

/** ⭐️(星)を付ける・外す回数の上限(同じ接続元から。付ける・外すをそれぞれ1回と数える。P7-6) */
export const STAR_LIMIT_PER_HOUR = 60;
export const STAR_LIMIT_PER_DAY = 300;

/** ⭐️を付ける・外すのを受け付けるか。受け付けないときはエラー文 */
export function decideStar(stats: { lastHour: number; lastDay: number }): string | null {
  if (stats.lastDay >= STAR_LIMIT_PER_DAY || stats.lastHour >= STAR_LIMIT_PER_HOUR) {
    return "短い時間に⭐️の操作が続いたため、いったん受け付けを止めています。時間をおいてから、もう一度お試しください。";
  }
  return null;
}

/** 同じ内容かを見分けるためのハッシュ(タイトル・説明・レイヤー・コンボ・マクロ。投稿者名やタグの違いは同じ内容とみなす) */
export function contentHash(input: { title: string; description?: string; layers: unknown; combos: unknown; macros: unknown }): string {
  const normalized = JSON.stringify([input.title.trim(), (input.description ?? "").trim(), input.layers, input.combos, input.macros]);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

/**
 * 接続元(IPアドレス)を、元に戻せない形にする。IPアドレスそのものはDBに保存しない。
 * salt はサーバーだけが持つ値(secret key から作る)なので、IPアドレスの候補を総当たりしても元に戻せない。
 */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`keycap-share:ip:${salt}:${ip}`, "utf8").digest("hex");
}
