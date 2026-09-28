/**
 * 仮の値。実機または公式情報で確認後に差し替える。
 *
 * 出典: docs/keyboards/orca-echo.md(2026-09-28、人間が実機写真をもとに確認)。
 * キーの数(左25+右24=49)・並び・ダイヤル/トラックボール/スクロールパッドの
 * 有無と位置は人間が確認済み。
 *
 * ただし座標(x, y)・キーサイズ・傾き角度(rotation)は、表の並び順を
 * 機械的にグリッドへ割り当てただけの仮の値。実際のキー間隔・段のずれ
 * (スタッガー)・傾き角度は未確認。実機または公式情報で確認でき次第、
 * このファイルだけを差し替えれば良いように設計している(plan.md 2章 方針5)。
 */

import type { KeyboardPhysicalLayout } from "@/lib/schemas";

export const orcaEcho: KeyboardPhysicalLayout = {
  id: "orca-echo",
  name: "Keychron Orca echo",
  isProvisional: true,
  elements: [
    // ===== 左手 =====
    // 段1
    { id: "L-0-0", type: "key", side: "left", x: 0, y: 0, width: 1, height: 1, rotation: 0, legend: "Esc" },
    { id: "L-0-1", type: "key", side: "left", x: 1, y: 0, width: 1, height: 1, rotation: 0, legend: "Q" },
    { id: "L-0-2", type: "key", side: "left", x: 2, y: 0, width: 1, height: 1, rotation: 0, legend: "W" },
    { id: "L-0-3", type: "key", side: "left", x: 3, y: 0, width: 1, height: 1, rotation: 0, legend: "E" },
    { id: "L-0-4", type: "key", side: "left", x: 4, y: 0, width: 1, height: 1, rotation: 0, legend: "R" },
    { id: "L-0-5", type: "key", side: "left", x: 5, y: 0, width: 1, height: 1, rotation: 0, legend: "T" },
    // 段2
    { id: "L-1-0", type: "key", side: "left", x: 0, y: 1, width: 1, height: 1, rotation: 0, legend: "Tab" },
    { id: "L-1-1", type: "key", side: "left", x: 1, y: 1, width: 1, height: 1, rotation: 0, legend: "A" },
    { id: "L-1-2", type: "key", side: "left", x: 2, y: 1, width: 1, height: 1, rotation: 0, legend: "S" },
    { id: "L-1-3", type: "key", side: "left", x: 3, y: 1, width: 1, height: 1, rotation: 0, legend: "D" },
    { id: "L-1-4", type: "key", side: "left", x: 4, y: 1, width: 1, height: 1, rotation: 0, legend: "F" },
    { id: "L-1-5", type: "key", side: "left", x: 5, y: 1, width: 1, height: 1, rotation: 0, legend: "G" },
    // 段3(内側列にfn2)
    { id: "L-2-0", type: "key", side: "left", x: 0, y: 2, width: 1, height: 1, rotation: 0, legend: "Shift" },
    { id: "L-2-1", type: "key", side: "left", x: 1, y: 2, width: 1, height: 1, rotation: 0, legend: "Z" },
    { id: "L-2-2", type: "key", side: "left", x: 2, y: 2, width: 1, height: 1, rotation: 0, legend: "X" },
    { id: "L-2-3", type: "key", side: "left", x: 3, y: 2, width: 1, height: 1, rotation: 0, legend: "C" },
    { id: "L-2-4", type: "key", side: "left", x: 4, y: 2, width: 1, height: 1, rotation: 0, legend: "V" },
    { id: "L-2-5", type: "key", side: "left", x: 5, y: 2, width: 1, height: 1, rotation: 0, legend: "B" },
    { id: "L-2-6", type: "key", side: "left", x: 6, y: 2, width: 1, height: 1, rotation: 0, legend: "fn2" },
    // 段4(親指列。内側列にダイヤル)
    { id: "L-3-0", type: "key", side: "left", x: 0, y: 3, width: 1, height: 1, rotation: 0, legend: "Ctrl" },
    { id: "L-3-1", type: "key", side: "left", x: 1, y: 3, width: 1, height: 1, rotation: 0 }, // 印字なし
    { id: "L-3-2", type: "key", side: "left", x: 2, y: 3, width: 1, height: 1, rotation: 0, legend: "Opt" },
    { id: "L-3-3", type: "key", side: "left", x: 3, y: 3, width: 1, height: 1, rotation: 0, legend: "Cmd" },
    { id: "L-3-4", type: "key", side: "left", x: 4, y: 3, width: 1, height: 1, rotation: 0, legend: "fn1" },
    { id: "L-3-5", type: "key", side: "left", x: 5, y: 3, width: 1, height: 1, rotation: 15 }, // 印字なし・少し斜め(親指)
    // 内側列: スクロールパッド(段1-2にまたがる)、ダイヤル(段4)
    { id: "L-SCROLL", type: "scrollpad", side: "left", x: 6, y: 0, width: 1, height: 2, rotation: 0, legend: "スクロールパッド" },
    { id: "L-DIAL", type: "dial", side: "left", x: 6, y: 3, width: 1, height: 1, rotation: 0, legend: "ダイヤル" },

    // ===== 右手 =====
    // 段1(内側列にスクロールパッド)
    { id: "R-SCROLL", type: "scrollpad", side: "right", x: 9, y: 0, width: 1, height: 2, rotation: 0, legend: "スクロールパッド" },
    { id: "R-0-1", type: "key", side: "right", x: 10, y: 0, width: 1, height: 1, rotation: 0, legend: "Y" },
    { id: "R-0-2", type: "key", side: "right", x: 11, y: 0, width: 1, height: 1, rotation: 0, legend: "U" },
    { id: "R-0-3", type: "key", side: "right", x: 12, y: 0, width: 1, height: 1, rotation: 0, legend: "I" },
    { id: "R-0-4", type: "key", side: "right", x: 13, y: 0, width: 1, height: 1, rotation: 0, legend: "O" },
    { id: "R-0-5", type: "key", side: "right", x: 14, y: 0, width: 1, height: 1, rotation: 0, legend: "P" },
    { id: "R-0-6", type: "key", side: "right", x: 15, y: 0, width: 1, height: 1, rotation: 0, legend: "-" },
    // 段2
    { id: "R-1-1", type: "key", side: "right", x: 10, y: 1, width: 1, height: 1, rotation: 0, legend: "H" },
    { id: "R-1-2", type: "key", side: "right", x: 11, y: 1, width: 1, height: 1, rotation: 0, legend: "J" },
    { id: "R-1-3", type: "key", side: "right", x: 12, y: 1, width: 1, height: 1, rotation: 0, legend: "K" },
    { id: "R-1-4", type: "key", side: "right", x: 13, y: 1, width: 1, height: 1, rotation: 0, legend: "L" },
    { id: "R-1-5", type: "key", side: "right", x: 14, y: 1, width: 1, height: 1, rotation: 0, legend: ":" },
    { id: "R-1-6", type: "key", side: "right", x: 15, y: 1, width: 1, height: 1, rotation: 0, legend: "Enter" },
    // 段3(内側列にB。人差し指用)
    { id: "R-2-0", type: "key", side: "right", x: 9, y: 2, width: 1, height: 1, rotation: 0, legend: "B" },
    { id: "R-2-1", type: "key", side: "right", x: 10, y: 2, width: 1, height: 1, rotation: 0, legend: "N" },
    { id: "R-2-2", type: "key", side: "right", x: 11, y: 2, width: 1, height: 1, rotation: 0, legend: "M" },
    { id: "R-2-3", type: "key", side: "right", x: 12, y: 2, width: 1, height: 1, rotation: 0, legend: "," },
    { id: "R-2-4", type: "key", side: "right", x: 13, y: 2, width: 1, height: 1, rotation: 0, legend: "." },
    { id: "R-2-5", type: "key", side: "right", x: 14, y: 2, width: 1, height: 1, rotation: 0, legend: "(" },
    { id: "R-2-6", type: "key", side: "right", x: 15, y: 2, width: 1, height: 1, rotation: 0, legend: ")" },
    // 段4(親指列。トラックボール+5キー)
    { id: "R-TRACKBALL", type: "trackball", side: "right", x: 10, y: 3, width: 1, height: 1, rotation: 0, legend: "トラックボール" },
    { id: "R-3-2", type: "key", side: "right", x: 11, y: 3, width: 1, height: 1, rotation: 0, legend: "Wi-Fi" }, // Wi-Fi印字のキー
    { id: "R-3-3", type: "key", side: "right", x: 12, y: 3, width: 1, height: 1, rotation: 0, legend: "←" },
    { id: "R-3-4", type: "key", side: "right", x: 13, y: 3, width: 1, height: 1, rotation: 0, legend: "M1" },
    { id: "R-3-5", type: "key", side: "right", x: 14, y: 3, width: 1, height: 1, rotation: 0, legend: "M2" },
    { id: "R-3-6", type: "key", side: "right", x: 15, y: 3, width: 1, height: 1, rotation: 0, legend: "M3" },
  ],
};
