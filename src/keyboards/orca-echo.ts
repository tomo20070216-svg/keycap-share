/**
 * 仮の値。実機または公式情報で確認後に差し替える。
 *
 * 出典: docs/keyboards/orca-echo.md(2026-09-28、人間が実機写真をもとに確認)。
 * キーの数(左25+右24=49)・並び・ダイヤル/トラックボール/スクロールパッドの
 * 有無と位置は人間が確認済み。
 *
 * 座標(x, y)・大きさ・傾き角度(rotation)は、実機写真(docs/keyboards/orca-echo-photo.png)
 * から推定した値(2026-09-28、tasks.json P2-4)。写真上のキーの中心をピクセル単位で読み取り、
 * 読み取り誤差をならすため、通常のキーは「キーの間隔は全体で共通、列ごとに段のずれだけが違う」
 * という規則に最小二乗法で当てはめた(横の間隔 約66.6px を1キー分とした。縦は約65.8px)。
 * 親指キー(約18度)とダイヤル(約22度)の傾き、トラックボール・スクロールパッドは読み取った値のまま。
 * 写真では右手が少し上に写っているが実物では左右の高さはそろっている(人間の確認)ため、
 * 右手の要素すべてを左右の差の平均(0.1キー分)だけ下げた。
 * 写真の遠近感による誤差があり、人間が実機と見比べて確認するまでは「仮の値」として扱う。
 * 実機または公式情報で確認でき次第、このファイルだけを差し替えれば良いように設計している
 * (plan.md 2章 方針5)。
 * 左右の間隔は描画時に決める(src/lib/keymap-render.ts)ため、左右の相対位置は厳密でなくてよい。
 */

import type { KeyboardPhysicalLayout } from "@/lib/schemas";

export const orcaEcho: KeyboardPhysicalLayout = {
  id: "orca-echo",
  name: "Keychron Orca echo",
  isProvisional: true,
  elements: [
    // ===== 左手 =====
    // 段1
    { id: "L-0-0", type: "key", side: "left", x: 0, y: 0.5, width: 1, height: 1, rotation: 0, legend: "Esc" },
    { id: "L-0-1", type: "key", side: "left", x: 1, y: 0.5, width: 1, height: 1, rotation: 0, legend: "Q" },
    { id: "L-0-2", type: "key", side: "left", x: 2, y: 0.25, width: 1, height: 1, rotation: 0, legend: "W" },
    { id: "L-0-3", type: "key", side: "left", x: 3, y: 0.1, width: 1, height: 1, rotation: 0, legend: "E" },
    { id: "L-0-4", type: "key", side: "left", x: 4, y: 0.2, width: 1, height: 1, rotation: 0, legend: "R" },
    { id: "L-0-5", type: "key", side: "left", x: 5, y: 0.35, width: 1, height: 1, rotation: 0, legend: "T" },
    // 段2
    { id: "L-1-0", type: "key", side: "left", x: 0, y: 1.45, width: 1, height: 1, rotation: 0, legend: "Tab" },
    { id: "L-1-1", type: "key", side: "left", x: 1, y: 1.45, width: 1, height: 1, rotation: 0, legend: "A" },
    { id: "L-1-2", type: "key", side: "left", x: 2, y: 1.25, width: 1, height: 1, rotation: 0, legend: "S" },
    { id: "L-1-3", type: "key", side: "left", x: 3, y: 1.05, width: 1, height: 1, rotation: 0, legend: "D" },
    { id: "L-1-4", type: "key", side: "left", x: 4, y: 1.2, width: 1, height: 1, rotation: 0, legend: "F" },
    { id: "L-1-5", type: "key", side: "left", x: 5, y: 1.3, width: 1, height: 1, rotation: 0, legend: "G" },
    // 段3(内側列にfn2)
    { id: "L-2-0", type: "key", side: "left", x: 0, y: 2.45, width: 1, height: 1, rotation: 0, legend: "Shift" },
    { id: "L-2-1", type: "key", side: "left", x: 1, y: 2.45, width: 1, height: 1, rotation: 0, legend: "Z" },
    { id: "L-2-2", type: "key", side: "left", x: 2, y: 2.2, width: 1, height: 1, rotation: 0, legend: "X" },
    { id: "L-2-3", type: "key", side: "left", x: 3, y: 2.05, width: 1, height: 1, rotation: 0, legend: "C" },
    { id: "L-2-4", type: "key", side: "left", x: 4, y: 2.15, width: 1, height: 1, rotation: 0, legend: "V" },
    { id: "L-2-5", type: "key", side: "left", x: 5, y: 2.3, width: 1, height: 1, rotation: 0, legend: "B" },
    { id: "L-2-6", type: "key", side: "left", x: 6, y: 2.4, width: 1, height: 1, rotation: 0, legend: "fn2" },
    // 段4(親指列。内側列にダイヤル)
    { id: "L-3-0", type: "key", side: "left", x: 0, y: 3.45, width: 1, height: 1, rotation: 0, legend: "Ctrl" },
    { id: "L-3-1", type: "key", side: "left", x: 1, y: 3.45, width: 1, height: 1, rotation: 0 }, // 印字なし
    { id: "L-3-2", type: "key", side: "left", x: 2, y: 3.2, width: 1, height: 1, rotation: 0, legend: "Opt" },
    { id: "L-3-3", type: "key", side: "left", x: 3, y: 3.05, width: 1, height: 1, rotation: 0, legend: "Cmd" },
    { id: "L-3-4", type: "key", side: "left", x: 4, y: 3.15, width: 1, height: 1, rotation: 0, legend: "fn1" },
    { id: "L-3-5", type: "key", side: "left", x: 5.15, y: 3.55, width: 1, height: 1, rotation: 18 }, // 印字なし・少し斜め(親指)
    // 内側列: スクロールパッド(段1-2にまたがる)、ダイヤル(段4)
    { id: "L-SCROLL", type: "scrollpad", side: "left", x: 6.05, y: 0.3, width: 1.15, height: 2.1, rotation: 0, legend: "スクロールパッド" },
    { id: "L-DIAL", type: "dial", side: "left", x: 6.2, y: 4, width: 0.7, height: 0.9, rotation: 22, legend: "ダイヤル" },

    // ===== 右手 =====
    // 段1(内側列にスクロールパッド)
    { id: "R-SCROLL", type: "scrollpad", side: "right", x: 7.35, y: 0.3, width: 1.15, height: 2.05, rotation: 0, legend: "スクロールパッド" },
    { id: "R-0-1", type: "key", side: "right", x: 8.55, y: 0.35, width: 1, height: 1, rotation: 0, legend: "Y" },
    { id: "R-0-2", type: "key", side: "right", x: 9.55, y: 0.25, width: 1, height: 1, rotation: 0, legend: "U" },
    { id: "R-0-3", type: "key", side: "right", x: 10.55, y: 0.1, width: 1, height: 1, rotation: 0, legend: "I" },
    { id: "R-0-4", type: "key", side: "right", x: 11.55, y: 0.25, width: 1, height: 1, rotation: 0, legend: "O" },
    { id: "R-0-5", type: "key", side: "right", x: 12.55, y: 0.45, width: 1, height: 1, rotation: 0, legend: "P" },
    { id: "R-0-6", type: "key", side: "right", x: 13.55, y: 0.45, width: 1, height: 1, rotation: 0, legend: "-" },
    // 段2
    { id: "R-1-1", type: "key", side: "right", x: 8.55, y: 1.35, width: 1, height: 1, rotation: 0, legend: "H" },
    { id: "R-1-2", type: "key", side: "right", x: 9.55, y: 1.25, width: 1, height: 1, rotation: 0, legend: "J" },
    { id: "R-1-3", type: "key", side: "right", x: 10.55, y: 1.1, width: 1, height: 1, rotation: 0, legend: "K" },
    { id: "R-1-4", type: "key", side: "right", x: 11.55, y: 1.25, width: 1, height: 1, rotation: 0, legend: "L" },
    { id: "R-1-5", type: "key", side: "right", x: 12.55, y: 1.45, width: 1, height: 1, rotation: 0, legend: ":" },
    { id: "R-1-6", type: "key", side: "right", x: 13.55, y: 1.45, width: 1, height: 1, rotation: 0, legend: "Enter" },
    // 段3(内側列にB。人差し指用)
    { id: "R-2-0", type: "key", side: "right", x: 7.55, y: 2.45, width: 1, height: 1, rotation: 0, legend: "B" },
    { id: "R-2-1", type: "key", side: "right", x: 8.55, y: 2.35, width: 1, height: 1, rotation: 0, legend: "N" },
    { id: "R-2-2", type: "key", side: "right", x: 9.55, y: 2.2, width: 1, height: 1, rotation: 0, legend: "M" },
    { id: "R-2-3", type: "key", side: "right", x: 10.55, y: 2.05, width: 1, height: 1, rotation: 0, legend: "," },
    { id: "R-2-4", type: "key", side: "right", x: 11.55, y: 2.2, width: 1, height: 1, rotation: 0, legend: "." },
    { id: "R-2-5", type: "key", side: "right", x: 12.55, y: 2.45, width: 1, height: 1, rotation: 0, legend: "(" },
    { id: "R-2-6", type: "key", side: "right", x: 13.55, y: 2.45, width: 1, height: 1, rotation: 0, legend: ")" },
    // 段4(親指列。トラックボール+5キー)
    { id: "R-TRACKBALL", type: "trackball", side: "right", x: 8.1, y: 3.8, width: 0.9, height: 0.9, rotation: 0, legend: "トラックボール" },
    { id: "R-3-2", type: "key", side: "right", x: 9.55, y: 3.2, width: 1, height: 1, rotation: 0, legend: "Wi-Fi" }, // Wi-Fi印字のキー
    { id: "R-3-3", type: "key", side: "right", x: 10.55, y: 3.05, width: 1, height: 1, rotation: 0, legend: "←" },
    { id: "R-3-4", type: "key", side: "right", x: 11.55, y: 3.2, width: 1, height: 1, rotation: 0, legend: "M1" },
    { id: "R-3-5", type: "key", side: "right", x: 12.55, y: 3.4, width: 1, height: 1, rotation: 0, legend: "M2" },
    { id: "R-3-6", type: "key", side: "right", x: 13.55, y: 3.4, width: 1, height: 1, rotation: 0, legend: "M3" },
  ],
};
