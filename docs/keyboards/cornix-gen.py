"""Cornix の物理レイアウトと工場出荷時配列を、公開されている Vial の定義から作る(フェーズ8)。

入力:
- adong660_rmk-cornix-vial.json: キーの位置(KLE 形式。3つの有志の定義で位置は一致)
- default.vil: 工場出荷時の配列の書き出し(oklahomer/cornix-keymap vendor/cornix-default-keymap.vil)
出力: TypeScript のデータ(標準出力に JSON で出し、TS ファイルは別に組み立てる)
"""
import json
import math
import sys

vial = json.load(open("adong660_rmk-cornix-vial.json", encoding="utf-8"))
vil = json.load(open("default.vil", encoding="utf-8"))


def parse_kle(rows):
    keys = []
    r = rx = ry = 0.0
    x = y = 0.0
    w = h = 1.0
    for row in rows:
        for item in row:
            if isinstance(item, dict):
                if "r" in item:
                    r = item["r"]
                if "rx" in item:
                    rx = item["rx"]
                    x = rx
                    y = ry
                if "ry" in item:
                    ry = item["ry"]
                    y = ry
                    x = rx
                x += item.get("x", 0)
                y += item.get("y", 0)
                w = item.get("w", 1)
                h = item.get("h", 1)
            else:
                keys.append({"label": item, "x": x, "y": y, "w": w, "h": h, "r": r, "rx": rx, "ry": ry})
                x += w
                w = h = 1
        y += 1
        x = rx
    return keys


def center(k):
    """KLE のキー(回転前の左上 + 回転の中心と角度)から、実際の中心の位置を求める"""
    px, py = k["x"] + k["w"] / 2, k["y"] + k["h"] / 2
    if not k["r"]:
        return px, py
    a = math.radians(k["r"])
    dx, dy = px - k["rx"], py - k["ry"]
    return k["rx"] + dx * math.cos(a) - dy * math.sin(a), k["ry"] + dx * math.sin(a) + dy * math.cos(a)


keys = parse_kle(vial["layouts"]["keymap"])
# エンコーダー(ダイヤル)の回転は Vial の画面の都合で中央に描かれているだけなので、物理レイアウトには使わない
matrix_keys = [k for k in keys if "\n" not in k["label"]]
assert len(matrix_keys) == 50, len(matrix_keys)

X_OFFSET = 0.5  # 左手の外側の列が x=0 から始まるようにする


def element_id(row, col):
    if (row, col) == (2, 6):
        return "L-KNOB"
    if (row, col) == (5, 6):
        return "R-KNOB"
    if row < 4:
        return f"L-{row}-{col}"
    return f"R-{row - 4}-{col}"


# 工場出荷時の表示名(キーコード → 表示用の名前。キーの一覧 key-palette.ts の名前にそろえる)
NAMES = {
    "KC_TAB": "Tab", "KC_CAPSLOCK": "Caps Lock", "KC_LSHIFT": "Shift", "KC_LCTRL": "Ctrl", "KC_LGUI": "Win",
    "KC_LALT": "Alt", "KC_SPACE": "Space", "KC_BSPACE": "BackSpace", "KC_ENTER": "Enter", "KC_BSLASH": "\\",
    "KC_SLASH": "/", "KC_UP": "↑", "KC_DOWN": "↓", "KC_LEFT": "←", "KC_RIGHT": "→", "KC_DOT": ".", "KC_COMMA": ",",
    "KC_MUTE": "ミュート", "KC_BTN3": "中クリック", "KC_ESCAPE": "Esc", "KC_DELETE": "Del", "KC_SCOLON": ";",
    "KC_MINUS": "-", "KC_QUOTE": "'", "KC_EQUAL": "=", "USER00": "Bluetooth 1", "USER01": "Bluetooth 2",
    "USER02": "Bluetooth 3", "KC_VOLD": "音量−", "KC_VOLU": "音量+", "KC_WH_U": "ホイール↑", "KC_WH_D": "ホイール↓",
}


def name(code):
    if code in NAMES:
        return NAMES[code]
    if code.startswith("MO(") and code.endswith(")"):
        n = code[3:-1]
        return f"レイヤー{n}(押している間)"
    if code.startswith("KC_") and len(code) == 4:  # KC_A など
        return code[3:]
    if code.startswith("KC_") and code[3:].isdigit():
        return code[3:]
    raise SystemExit(f"表示名が決まっていないキーコード: {code}")


base = vil["layout"][0]
elements = []
for k in matrix_keys:
    row, col = map(int, k["label"].split(","))
    cx, cy = center(k)
    eid = element_id(row, col)
    is_knob = eid.endswith("KNOB")
    legend = "ダイヤル" if is_knob else name(base[row][col])
    elements.append({
        "id": eid,
        "type": "knob" if is_knob else "key",
        "side": "left" if row < 4 else "right",
        "x": round(cx - k["w"] / 2 - X_OFFSET, 3),
        "y": round(cy - k["h"] / 2, 3),
        "width": k["w"],
        "height": k["h"],
        "rotation": k["r"],
        "legend": legend,
    })

# 並び: 左手 → 右手、段 → 列(読みやすさのため)
def sort_key(e):
    side = 0 if e["side"] == "left" else 1
    knob = 1 if e["id"].endswith("KNOB") else 0
    parts = e["id"].split("-")
    r = int(parts[1]) if not knob else 9
    c = int(parts[2]) if not knob else 9
    return (side, knob, r, c)


elements.sort(key=sort_key)

# 工場出荷時の配列: 割り当てのあるレイヤー(0〜3。レイヤー4以降は空)
layers = []
for n, layer in enumerate(vil["layout"]):
    assignments = []
    for row in range(8):
        for col in range(7):
            code = layer[row][col]
            if code in (-1, "KC_NO", "KC_TRNS"):
                continue
            eid = element_id(row, col)
            assignments.append({"elementId": eid, "action": "press", "label": name(code)})
    # ダイヤル(Vial の encoder_layout は [左回し, 右回し] の順)
    for idx, eid in enumerate(["L-KNOB", "R-KNOB"]):
        ccw, cw = vil["encoder_layout"][n][idx]
        assignments.append({"elementId": eid, "action": "cw", "label": name(cw)})
        assignments.append({"elementId": eid, "action": "ccw", "label": name(ccw)})
    # ダイヤル以外に割り当てがないレイヤーは含めない
    if all(a["elementId"].endswith("KNOB") for a in assignments):
        continue
    layers.append({"layerNumber": n, "layerName": "通常" if n == 0 else f"レイヤー{n}", "assignments": assignments})

json.dump({"elements": elements, "layers": layers}, sys.stdout, ensure_ascii=False, indent=1)
