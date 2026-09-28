/**
 * Orca echoの工場出荷時配列(実データ)。
 *
 * 出典: 実機写真(docs/keyboards/orca-echo-photo.png)を人間が確認しながら
 * 書き起こしたもの(2026-09-28)。白=通常(レイヤー0)、赤=fn1押下中(レイヤー1)、
 * 緑=fn2押下中(レイヤー2)の印字色に対応する。
 *
 * 座標そのものは orca-echo.ts と同じく仮の値(docs/keyboards/orca-echo.md参照)。
 * ここではあくまで「どの要素にどんな意味が割り当てられているか」を記録している。
 *
 * 未確定点:
 * - テンキー「9」(R-0-6, "-"キー)のfn2(緑)の印字はなし(空白)と確認済み。
 * - Shiftで変わる値(:/;、(/【、)/】など)は、fn1/fn2とは別種の標準的な
 *   キーボード機能のため、このアプリの記録対象にはしない(人間の判断、2026-09-28)。
 */

import type { Layer } from "@/lib/schemas";

export const orcaEchoFactoryDefaultLayers: Layer[] = [
  {
    layerNumber: 0,
    layerName: "通常",
    assignments: [
      // 左手
      { elementId: "L-0-0", action: "press", label: "Esc" },
      { elementId: "L-0-1", action: "press", label: "Q" },
      { elementId: "L-0-2", action: "press", label: "W" },
      { elementId: "L-0-3", action: "press", label: "E" },
      { elementId: "L-0-4", action: "press", label: "R" },
      { elementId: "L-0-5", action: "press", label: "T" },
      { elementId: "L-1-0", action: "press", label: "Tab" },
      { elementId: "L-1-1", action: "press", label: "A" },
      { elementId: "L-1-2", action: "press", label: "S" },
      { elementId: "L-1-3", action: "press", label: "D" },
      { elementId: "L-1-4", action: "press", label: "F" },
      { elementId: "L-1-5", action: "press", label: "G" },
      { elementId: "L-2-0", action: "press", label: "Shift" },
      { elementId: "L-2-1", action: "press", label: "Z" },
      { elementId: "L-2-2", action: "press", label: "X" },
      { elementId: "L-2-3", action: "press", label: "C" },
      { elementId: "L-2-4", action: "press", label: "V" },
      { elementId: "L-2-5", action: "press", label: "B" },
      { elementId: "L-2-6", action: "press", label: "fn2" },
      { elementId: "L-3-0", action: "press", label: "Ctrl" },
      { elementId: "L-3-2", action: "press", label: "Opt" },
      { elementId: "L-3-3", action: "press", label: "Cmd" },
      { elementId: "L-3-4", action: "press", label: "fn1" },
      // 右手
      { elementId: "R-0-1", action: "press", label: "Y" },
      { elementId: "R-0-2", action: "press", label: "U" },
      { elementId: "R-0-3", action: "press", label: "I" },
      { elementId: "R-0-4", action: "press", label: "O" },
      { elementId: "R-0-5", action: "press", label: "P" },
      { elementId: "R-0-6", action: "press", label: "-" },
      { elementId: "R-1-1", action: "press", label: "H" },
      { elementId: "R-1-2", action: "press", label: "J" },
      { elementId: "R-1-3", action: "press", label: "K" },
      { elementId: "R-1-4", action: "press", label: "L" },
      { elementId: "R-1-5", action: "press", label: ":" },
      { elementId: "R-1-6", action: "press", label: "Enter" },
      { elementId: "R-2-0", action: "press", label: "B" },
      { elementId: "R-2-1", action: "press", label: "N" },
      { elementId: "R-2-2", action: "press", label: "M" },
      { elementId: "R-2-3", action: "press", label: "," },
      { elementId: "R-2-4", action: "press", label: "." },
      { elementId: "R-2-5", action: "press", label: "(" },
      { elementId: "R-2-6", action: "press", label: ")" },
      { elementId: "R-3-2", action: "press", label: "Wi-Fi" },
      { elementId: "R-3-3", action: "press", label: "←" },
      { elementId: "R-3-4", action: "press", label: "M1" },
      { elementId: "R-3-5", action: "press", label: "M2" },
      { elementId: "R-3-6", action: "press", label: "M3" },
    ],
  },
  {
    layerNumber: 1,
    layerName: "fn1(赤)",
    assignments: [
      // 矢印クラスタ(左手、同一レイヤー)
      { elementId: "L-0-3", action: "press", label: "↑" },
      { elementId: "L-1-2", action: "press", label: "←" },
      { elementId: "L-1-3", action: "press", label: "↓" },
      { elementId: "L-1-4", action: "press", label: "→" },
      // マウス操作(右手)
      { elementId: "R-0-2", action: "press", label: "ホイールクリック" },
      { elementId: "R-1-2", action: "press", label: "右クリック" },
      { elementId: "R-1-3", action: "press", label: "左クリック" },
      // テンキー(右手)
      { elementId: "R-0-4", action: "press", label: "7" },
      { elementId: "R-0-5", action: "press", label: "8" },
      { elementId: "R-0-6", action: "press", label: "9" },
      { elementId: "R-1-4", action: "press", label: "4" },
      { elementId: "R-1-5", action: "press", label: "5" },
      { elementId: "R-1-6", action: "press", label: "6" },
      { elementId: "R-2-4", action: "press", label: "1" },
      { elementId: "R-2-5", action: "press", label: "2" },
      { elementId: "R-2-6", action: "press", label: "3" },
      { elementId: "R-3-4", action: "press", label: "0" },
    ],
  },
  {
    layerNumber: 2,
    layerName: "fn2(緑)",
    assignments: [
      { elementId: "L-0-1", action: "press", label: "2.4GHz切替" },
      // テンキー位置の記号(緑)
      { elementId: "R-3-4", action: "press", label: "B1" },
      { elementId: "R-2-4", action: "press", label: "!" },
      { elementId: "R-2-5", action: "press", label: "@" },
      { elementId: "R-2-6", action: "press", label: "#" },
      { elementId: "R-1-4", action: "press", label: "$" },
      { elementId: "R-1-5", action: "press", label: "%" },
      { elementId: "R-1-6", action: "press", label: "^" },
      { elementId: "R-0-4", action: "press", label: "&" },
      { elementId: "R-0-5", action: "press", label: "*" },
      // R-0-6("-") のfn2は空白(割り当てなし、2026-09-28確認)
      { elementId: "R-3-5", action: "press", label: "B2" },
      { elementId: "R-3-6", action: "press", label: "B3" },
    ],
  },
];
