/**
 * キーの一覧(パレット)。エディタでキー図へドラッグ&ドロップして割り当てを置くときに使う(P5-9)。
 *
 * 出典: Keychron Launcher(https://launcher.keychron.com/)で設定できるキーの種類
 * (Basic・Special・Mouse・Macro・Layer・Custom。2026-09-29確認。詳細は docs/requirements.md)。
 * Launcher のデータそのものは使わず、「どんなキーがあるか」の参考にして、表示名は日本語で付けた。
 * 表示名は plan.md 方針4 のとおり「表示用の名前」で、キーコードとは結びつけない。
 * レイヤーのキーは「レイヤー1(押している間)」のような日本語(人間の決定。Launcher の MO/TG/TO に当たる)。
 */

export type PaletteKey = {
  /** キーに表示する名前(割り当ての label になる) */
  label: string;
  /** 補足の説明(一覧で名前にカーソルを合わせたときなどに出す) */
  hint?: string;
};

export type PaletteCategory = {
  id: string;
  name: string;
  keys: PaletteKey[];
};

const keys = (...labels: string[]): PaletteKey[] => labels.map((label) => ({ label }));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** レイヤーの数(Launcher の MO/TG/TO は 0〜7) */
const LAYER_NUMBERS = range(0, 7);

export const KEY_PALETTE: PaletteCategory[] = [
  {
    id: "common",
    name: "よく使う",
    keys: keys("Esc", "Tab", "Enter", "BackSpace", "Space", "Del", "Shift", "Ctrl", "Alt", "Opt", "Win", "Cmd", "Caps Lock", "↑", "↓", "←", "→"),
  },
  {
    id: "japanese",
    name: "日本語入力",
    keys: [
      { label: "変換" },
      { label: "無変換" },
      { label: "英数", hint: "Macの英数キー(日本語入力をオフ)" },
      { label: "かな", hint: "かなキー(日本語入力をオン)" },
      { label: "半角/全角" },
      { label: "¥" },
      { label: "ろ", hint: "日本語キーボードの「\\ _ ろ」キー" },
    ],
  },
  { id: "letters", name: "英字", keys: keys(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")) },
  { id: "numbers", name: "数字", keys: keys("1", "2", "3", "4", "5", "6", "7", "8", "9", "0") },
  {
    id: "symbols",
    name: "記号",
    keys: keys(
      "-", "=", "[", "]", "\\", ";", "'", "`", ",", ".", "/",
      "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "{", "}", "|", ":", "\"", "~", "<", ">", "?"
    ),
  },
  {
    id: "editing",
    name: "編集・移動",
    keys: [
      ...keys("Home", "End", "PgUp", "PgDn", "Insert", "Print Screen", "Scroll Lock", "Pause", "Menu"),
      { label: "コピー", hint: "Copy キー" },
      { label: "貼り付け", hint: "Paste キー" },
      { label: "切り取り", hint: "Cut キー" },
      { label: "元に戻す", hint: "Undo キー" },
      { label: "検索", hint: "Find キー" },
    ],
  },
  { id: "function", name: "ファンクション", keys: keys(...range(1, 24).map((n) => `F${n}`)) },
  {
    id: "numpad",
    name: "テンキー",
    keys: keys("Num Lock", ...range(0, 9).map((n) => `Num ${n}`), "Num +", "Num -", "Num ×", "Num ÷", "Num .", "Num Enter"),
  },
  {
    id: "mouse",
    name: "マウス",
    keys: [
      ...keys("左クリック", "右クリック", "中クリック", "ダブルクリック"),
      { label: "戻る(マウス)", hint: "マウスの戻るボタン" },
      { label: "進む(マウス)", hint: "マウスの進むボタン" },
      ...keys("ホイール↑", "ホイール↓", "ホイール←", "ホイール→", "カーソル↑", "カーソル↓", "カーソル←", "カーソル→"),
    ],
  },
  {
    id: "media",
    name: "メディア",
    keys: keys("音量+", "音量−", "ミュート", "再生/一時停止", "停止", "前の曲", "次の曲", "画面の明るさ+", "画面の明るさ−"),
  },
  {
    id: "layers",
    name: "レイヤー",
    keys: LAYER_NUMBERS.flatMap((n) => [
      { label: `レイヤー${n}(押している間)`, hint: `押している間だけレイヤー${n}になる(MO)` },
      { label: `レイヤー${n}(ON/OFF)`, hint: `押すたびにレイヤー${n}のON/OFFを切り替える(TG)` },
      { label: `レイヤー${n}へ移動`, hint: `レイヤー${n}へ切り替えたままにする(TO)` },
    ]),
  },
  {
    id: "device",
    name: "接続・本体",
    keys: [
      ...keys("Bluetooth 1", "Bluetooth 2", "Bluetooth 3", "2.4GHz"),
      { label: "接続先の選択/解除", hint: "Bluetoothの接続先を選ぶ・ペアリングを解除する" },
      ...keys("バッテリー残量", "スリープ", "電源"),
    ],
  },
  {
    id: "mac",
    name: "Mac",
    keys: keys(
      "Mission Control",
      "Launchpad",
      "画面ロック(Mac)",
      "スクショ(Mac)",
      "絵文字(Mac)",
      "デスクトップ←(Mac)",
      "デスクトップ→(Mac)",
      "アプリの設定(Mac)",
      "Siri"
    ),
  },
  {
    id: "windows",
    name: "Windows",
    keys: keys(
      "タスクビュー",
      "エクスプローラー",
      "画面ロック(Win)",
      "スクショ(Win)",
      "絵文字(Win)",
      "デスクトップ←(Win)",
      "デスクトップ→(Win)",
      "設定(Win)",
      "Winキー無効"
    ),
  },
  { id: "macros", name: "マクロ", keys: keys(...range(0, 15).map((n) => `M${n}`)) },
  {
    id: "trackball",
    name: "トラックボール",
    keys: [
      { label: "DPI+", hint: "ポインターの速さを上げる" },
      { label: "DPI−", hint: "ポインターの速さを下げる" },
      { label: "DPI切替", hint: "ポインターの速さを順に切り替える" },
      { label: "向き+", hint: "トラックボールの向きを回す" },
      { label: "向き−", hint: "トラックボールの向きを逆に回す" },
      { label: "向き切替", hint: "トラックボールの向きを順に切り替える" },
      { label: "レポートレート+" },
      { label: "レポートレート−" },
    ],
  },
];

/**
 * Vial(Cornix など)で使うキーの一覧(フェーズ8)。
 * 出典: Vial の設定画面のキーの種類(Basic・Media・Macro・Layers・Quantum・Tap Dance・User)と、
 * Cornix のファームウェア(RMK)の Bluetooth 用のキー(User0〜 = BT0〜。RMK のドキュメント、2026-09-30確認)。
 * Keychron Launcher の一覧と共通のもの(英字・記号・マウスなど)はそのまま使い、
 * Launcher だけのもの(Mac・Windows の専用キー、トラックボール、2.4GHz など)は除く。
 */
const VIAL_ONLY_REMOVED = new Set(["device", "mac", "windows", "trackball", "layers"]);

export const VIAL_KEY_PALETTE: PaletteCategory[] = [
  ...KEY_PALETTE.filter((c) => !VIAL_ONLY_REMOVED.has(c.id) && c.id !== "macros"),
  {
    id: "layers",
    name: "レイヤー",
    keys: LAYER_NUMBERS.flatMap((n) => [
      { label: `レイヤー${n}(押している間)`, hint: `押している間だけレイヤー${n}になる(MO)` },
      { label: `レイヤー${n}(ON/OFF)`, hint: `押すたびにレイヤー${n}のON/OFFを切り替える(TG)` },
      { label: `レイヤー${n}へ移動`, hint: `レイヤー${n}へ切り替えたままにする(TO)` },
      { label: `レイヤー${n}(1回だけ)`, hint: `次に押す1キーだけレイヤー${n}になる(OSL)` },
      { label: `レイヤー${n}(長押し/2回タップ)`, hint: `押している間はレイヤー${n}、素早く2回押すと切り替えたままにする(TT)` },
    ]),
  },
  {
    id: "device",
    name: "Bluetooth・接続",
    keys: [
      ...[1, 2, 3, 4, 5].map((n) => ({ label: `Bluetooth ${n}`, hint: `Bluetooth の接続先${n}に切り替える(長押し5秒でペアリングし直す)` })),
      { label: "次のBluetooth", hint: "次の接続先に切り替える" },
      { label: "前のBluetooth", hint: "前の接続先に切り替える" },
      { label: "接続先の解除", hint: "今の接続先のペアリング情報を消す" },
      { label: "USB/無線の切り替え", hint: "USB と Bluetooth のどちらで送るかを切り替える" },
      { label: "左右の接続の解除", hint: "左右のつながりの情報を消す(5秒長押し)" },
    ],
  },
  { id: "macros", name: "マクロ", keys: keys(...range(0, 15).map((n) => `M${n}`)) },
  {
    id: "tapdance",
    name: "タップダンス",
    keys: range(0, 15).map((n) => ({ label: `TD${n}`, hint: `タップダンス${n}(押し方で入力が変わる。中身は説明欄に書いてください)` })),
  },
];

/** キーマップを変えるツールに合わせたキーの一覧 */
export function keyPaletteFor(tool: "keychron-launcher" | "vial"): PaletteCategory[] {
  return tool === "vial" ? VIAL_KEY_PALETTE : KEY_PALETTE;
}

