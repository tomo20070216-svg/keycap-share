/**
 * Cornix(Jezail Funder、Cornix LP)の物理レイアウト。仮の値(実物での確認待ち。tasks.json P8-2)。
 *
 * 出典(2026-09-30 取得。docs/keyboards/cornix.md):
 * - キーの位置: 有志が公開している Cornix 用 RMK ファームウェアの Vial 定義(vial.json の KLE 形式の配置)。
 *   3つの定義(adong660/rmk-cornix、ryotan/rmk-cornix、cffnpwr/cornix-prospector-rmk)で位置は一致していた。
 *   公式の定義ファイルは公開されていない。Vial の画面に表示するための配置なので、実物と少し違う可能性がある。
 * - キーの数: 片手24キー(3段×6列 + 外側の下に3つ + 親指3つ)。左右にダイヤルが1つずつあり、押し込める
 *   (レビュー記事・有志の説明で一致)。Vial の定義の (2,6)・(5,6) がダイヤルの押し込み。
 * - ダイヤルの位置: Vial の定義の押し込み (2,6)・(5,6) の位置に置いた(回転の表示は Vial の画面の都合で中央に描かれるため使わない)。
 *
 * 要素の id: 左手 "L-段-列"(段0〜3、列0が外側)、右手 "R-段-列"(列0が外側)。
 * Vial のマトリクスの行 0〜3 が左手、4〜7 が右手に対応する(R の段 = 行 − 4)。
 * 位置は KLE の配置から、回転を含めた中心を求めて左上に直したもの(1 = キー1つ分)。左右の間隔は描画時に決める。
 * 生成に使ったスクリプトは docs/keyboards/cornix-gen.py。
 */

import type { KeyboardPhysicalLayout } from "@/lib/schemas";

export const cornix: KeyboardPhysicalLayout = {
  id: "cornix",
  name: "Cornix",
  isProvisional: true,
  elements: [
    // 左手 段0
    { id: "L-0-0", type: "key", side: "left", x: 0, y: 0.375, width: 1, height: 1, rotation: 0, legend: "Tab" },
    { id: "L-0-1", type: "key", side: "left", x: 1, y: 0.375, width: 1, height: 1, rotation: 0, legend: "Q" },
    { id: "L-0-2", type: "key", side: "left", x: 2, y: 0.125, width: 1, height: 1, rotation: 0, legend: "W" },
    { id: "L-0-3", type: "key", side: "left", x: 3, y: 0, width: 1, height: 1, rotation: 0, legend: "E" },
    { id: "L-0-4", type: "key", side: "left", x: 4, y: 0.125, width: 1, height: 1, rotation: 0, legend: "R" },
    { id: "L-0-5", type: "key", side: "left", x: 5, y: 0.25, width: 1, height: 1, rotation: 0, legend: "T" },
    // 左手 段1
    { id: "L-1-0", type: "key", side: "left", x: 0, y: 1.375, width: 1, height: 1, rotation: 0, legend: "Caps Lock" },
    { id: "L-1-1", type: "key", side: "left", x: 1, y: 1.375, width: 1, height: 1, rotation: 0, legend: "A" },
    { id: "L-1-2", type: "key", side: "left", x: 2, y: 1.125, width: 1, height: 1, rotation: 0, legend: "S" },
    { id: "L-1-3", type: "key", side: "left", x: 3, y: 1, width: 1, height: 1, rotation: 0, legend: "D" },
    { id: "L-1-4", type: "key", side: "left", x: 4, y: 1.125, width: 1, height: 1, rotation: 0, legend: "F" },
    { id: "L-1-5", type: "key", side: "left", x: 5, y: 1.25, width: 1, height: 1, rotation: 0, legend: "G" },
    // 左手 段2
    { id: "L-2-0", type: "key", side: "left", x: 0, y: 2.375, width: 1, height: 1, rotation: 0, legend: "Shift" },
    { id: "L-2-1", type: "key", side: "left", x: 1, y: 2.375, width: 1, height: 1, rotation: 0, legend: "Z" },
    { id: "L-2-2", type: "key", side: "left", x: 2, y: 2.125, width: 1, height: 1, rotation: 0, legend: "X" },
    { id: "L-2-3", type: "key", side: "left", x: 3, y: 2, width: 1, height: 1, rotation: 0, legend: "C" },
    { id: "L-2-4", type: "key", side: "left", x: 4, y: 2.125, width: 1, height: 1, rotation: 0, legend: "V" },
    { id: "L-2-5", type: "key", side: "left", x: 5, y: 2.25, width: 1, height: 1, rotation: 0, legend: "B" },
    // 左手 段3(外側の下の3つ・親指3つ)
    { id: "L-3-0", type: "key", side: "left", x: 0, y: 3.375, width: 1, height: 1, rotation: 0, legend: "Ctrl" },
    { id: "L-3-1", type: "key", side: "left", x: 1, y: 3.375, width: 1, height: 1, rotation: 0, legend: "Win" },
    { id: "L-3-2", type: "key", side: "left", x: 2, y: 3.125, width: 1, height: 1, rotation: 0, legend: "Alt" },
    { id: "L-3-3", type: "key", side: "left", x: 3.667, y: 3.425, width: 1, height: 1, rotation: 0, legend: "レイヤー1(押している間)" },
    { id: "L-3-4", type: "key", side: "left", x: 4.785, y: 3.504, width: 1, height: 1, rotation: 8, legend: "レイヤー3(押している間)" },
    { id: "L-3-5", type: "key", side: "left", x: 5.894, y: 3.738, width: 1, height: 1, rotation: 16, legend: "Space" },
    // 左手 ダイヤル(押し込みあり)
    { id: "L-KNOB", type: "knob", side: "left", x: 6.2, y: 2, width: 1, height: 1, rotation: 0, legend: "ダイヤル" },
    // 右手 段0
    { id: "R-0-0", type: "key", side: "right", x: 17.5, y: 0.375, width: 1, height: 1, rotation: 0, legend: "BackSpace" },
    { id: "R-0-1", type: "key", side: "right", x: 16.5, y: 0.375, width: 1, height: 1, rotation: 0, legend: "P" },
    { id: "R-0-2", type: "key", side: "right", x: 15.5, y: 0.125, width: 1, height: 1, rotation: 0, legend: "O" },
    { id: "R-0-3", type: "key", side: "right", x: 14.5, y: 0, width: 1, height: 1, rotation: 0, legend: "I" },
    { id: "R-0-4", type: "key", side: "right", x: 13.5, y: 0.125, width: 1, height: 1, rotation: 0, legend: "U" },
    { id: "R-0-5", type: "key", side: "right", x: 12.5, y: 0.25, width: 1, height: 1, rotation: 0, legend: "Y" },
    // 右手 段1
    { id: "R-1-0", type: "key", side: "right", x: 17.5, y: 1.375, width: 1, height: 1, rotation: 0, legend: "Enter" },
    { id: "R-1-1", type: "key", side: "right", x: 16.5, y: 1.375, width: 1, height: 1, rotation: 0, legend: "\\" },
    { id: "R-1-2", type: "key", side: "right", x: 15.5, y: 1.125, width: 1, height: 1, rotation: 0, legend: "L" },
    { id: "R-1-3", type: "key", side: "right", x: 14.5, y: 1, width: 1, height: 1, rotation: 0, legend: "K" },
    { id: "R-1-4", type: "key", side: "right", x: 13.5, y: 1.125, width: 1, height: 1, rotation: 0, legend: "J" },
    { id: "R-1-5", type: "key", side: "right", x: 12.5, y: 1.25, width: 1, height: 1, rotation: 0, legend: "H" },
    // 右手 段2
    { id: "R-2-0", type: "key", side: "right", x: 17.5, y: 2.375, width: 1, height: 1, rotation: 0, legend: "/" },
    { id: "R-2-1", type: "key", side: "right", x: 16.5, y: 2.375, width: 1, height: 1, rotation: 0, legend: "↑" },
    { id: "R-2-2", type: "key", side: "right", x: 15.5, y: 2.125, width: 1, height: 1, rotation: 0, legend: "." },
    { id: "R-2-3", type: "key", side: "right", x: 14.5, y: 2, width: 1, height: 1, rotation: 0, legend: "," },
    { id: "R-2-4", type: "key", side: "right", x: 13.5, y: 2.125, width: 1, height: 1, rotation: 0, legend: "M" },
    { id: "R-2-5", type: "key", side: "right", x: 12.5, y: 2.25, width: 1, height: 1, rotation: 0, legend: "N" },
    // 右手 段3(外側の下の3つ・親指3つ)
    { id: "R-3-0", type: "key", side: "right", x: 17.5, y: 3.375, width: 1, height: 1, rotation: 0, legend: "→" },
    { id: "R-3-1", type: "key", side: "right", x: 16.5, y: 3.375, width: 1, height: 1, rotation: 0, legend: "↓" },
    { id: "R-3-2", type: "key", side: "right", x: 15.5, y: 3.125, width: 1, height: 1, rotation: 0, legend: "←" },
    { id: "R-3-3", type: "key", side: "right", x: 13.833, y: 3.425, width: 1, height: 1, rotation: 0, legend: "レイヤー2(押している間)" },
    { id: "R-3-4", type: "key", side: "right", x: 12.715, y: 3.504, width: 1, height: 1, rotation: -8, legend: "レイヤー4(押している間)" },
    { id: "R-3-5", type: "key", side: "right", x: 11.606, y: 3.738, width: 1, height: 1, rotation: -16, legend: "Space" },
    // 右手 ダイヤル(押し込みあり)
    { id: "R-KNOB", type: "knob", side: "right", x: 11.3, y: 2, width: 1, height: 1, rotation: 0, legend: "ダイヤル" },
  ],
};
