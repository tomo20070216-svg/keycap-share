/**
 * キーの中に収まる文字サイズを求める。
 * OGP画像(Satori)では文字の実際の幅を測れないため、文字の種類から幅を見積もる。
 * - 全角(日本語など): 1文字 = 1em
 * - 半角(英数字・記号): 1文字 = 0.62em(太字のNoto Sans JPで多めに見積もった値)
 */

const HALF_WIDTH_EM = 0.62;
const FULL_WIDTH_EM = 1;

function isHalfWidth(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code <= 0x7e || (code >= 0xff61 && code <= 0xff9f); // ASCII と半角カナ
}

/** 文字列の幅(em単位)の見積もり */
export function estimateTextWidthEm(text: string): number {
  let width = 0;
  for (const char of text) {
    width += isHalfWidth(char) ? HALF_WIDTH_EM : FULL_WIDTH_EM;
  }
  return width;
}

/**
 * maxWidth(px)に収まる文字サイズ(px)。基本サイズより大きくはしない。
 * minSize より小さくはしない(小さすぎて読めなくなるのを防ぐ。その場合ははみ出しうる)。
 */
export function fitFontSize(
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize = Math.max(6, baseSize * 0.4)
): number {
  const widthEm = estimateTextWidthEm(text);
  if (widthEm === 0) return baseSize;
  const fitted = maxWidth / widthEm;
  return Math.max(minSize, Math.min(baseSize, fitted));
}

export type FittedLabel = { fontSize: number; lines: string[] };

/**
 * 2行に分ける位置を決める。区切りのよい位置(空白、半角と全角の境目)を優先し、
 * なければ幅がほぼ半分になる位置で分ける。2行のうち長いほうの幅が最小になる位置を選ぶ。
 * 折り返しをブラウザ任せにせず自分で分けることで、画面とOGP画像で同じ結果になる。
 */
export function splitIntoTwoLines(text: string): [string, string] {
  const chars = [...text];
  const candidates: { index: number; natural: boolean }[] = [];
  for (let i = 1; i < chars.length; i++) {
    const natural = chars[i] === " " || chars[i - 1] === " " || isHalfWidth(chars[i]) !== isHalfWidth(chars[i - 1]);
    candidates.push({ index: i, natural });
  }
  const score = (index: number) =>
    Math.max(
      estimateTextWidthEm(chars.slice(0, index).join("").trim()),
      estimateTextWidthEm(chars.slice(index).join("").trim())
    );
  const best = (list: typeof candidates) =>
    list.reduce((a, b) => (score(b.index) < score(a.index) ? b : a));

  const any = best(candidates);
  const naturals = candidates.filter((c) => c.natural);
  // 区切りのよい位置が、最適な位置より1文字分以上長くならないなら、そちらを使う
  const chosen = naturals.length > 0 && score(best(naturals).index) <= score(any.index) + 1 ? best(naturals) : any;
  return [chars.slice(0, chosen.index).join("").trim(), chars.slice(chosen.index).join("").trim()];
}

/**
 * 1行で収めると基本サイズの oneLineMinRatio 未満まで小さくなる場合は、2行に分けて大きめに表示する。
 */
export function fitLabel(
  text: string,
  maxWidth: number,
  baseSize: number,
  oneLineMinRatio = 0.5
): FittedLabel {
  const oneLine = fitFontSize(text, maxWidth, baseSize);
  if (oneLine >= baseSize * oneLineMinRatio || [...text].length < 2) {
    return { fontSize: oneLine, lines: [text] };
  }
  const lines = splitIntoTwoLines(text);
  const widest = lines.reduce((a, b) => (estimateTextWidthEm(a) >= estimateTextWidthEm(b) ? a : b));
  return { fontSize: fitFontSize(widest, maxWidth, baseSize * 0.8), lines };
}
