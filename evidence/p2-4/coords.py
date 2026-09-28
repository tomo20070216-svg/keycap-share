# 写真(docs/keyboards/orca-echo-photo.png, 1050x652)から読み取った中心座標(px)
U = 66.5  # 1キー分のピクセル数(隣り合うキーの中心間の距離の平均)
px = {
  # 左手
  "L-0-0": (80, 305), "L-0-1": (147.5, 305), "L-0-2": (212.5, 289), "L-0-3": (280, 277.5), "L-0-4": (347.5, 287.5), "L-0-5": (414, 297.5),
  "L-1-0": (80, 367.5), "L-1-1": (147.5, 367.5), "L-1-2": (212.5, 355), "L-1-3": (280, 342.5), "L-1-4": (347.5, 350), "L-1-5": (414, 357.5),
  "L-2-0": (80, 432.5), "L-2-1": (147.5, 432.5), "L-2-2": (212.5, 417.5), "L-2-3": (280, 407.5), "L-2-4": (347.5, 415), "L-2-5": (414, 422.5), "L-2-6": (480, 432.5),
  "L-3-0": (80, 502.5), "L-3-1": (147.5, 502.5), "L-3-2": (212.5, 482.5), "L-3-3": (280, 472.5), "L-3-4": (347.5, 480), "L-3-5": (425, 508),
  "L-SCROLL": (489, 327.5), "L-DIAL": (483, 533),
  # 右手
  "R-SCROLL": (573.5, 318.5),
  "R-0-1": (649, 290), "R-0-2": (715, 282.5), "R-0-3": (781.5, 270), "R-0-4": (847.5, 280), "R-0-5": (915, 292.5), "R-0-6": (981, 292.5),
  "R-1-1": (649, 352.5), "R-1-2": (715, 345), "R-1-3": (781.5, 337.5), "R-1-4": (847.5, 345), "R-1-5": (915, 360), "R-1-6": (981, 360),
  "R-2-0": (584, 427.5), "R-2-1": (649, 420), "R-2-2": (715, 412.5), "R-2-3": (781.5, 402.5), "R-2-4": (847.5, 412.5), "R-2-5": (915, 427.5), "R-2-6": (981, 427.5),
  "R-TRACKBALL": (617.5, 515), "R-3-2": (715, 480), "R-3-3": (781.5, 470), "R-3-4": (847.5, 480), "R-3-5": (917.5, 495), "R-3-6": (982.5, 495),
}
size = {"L-SCROLL": (1.15, 2.1), "R-SCROLL": (1.15, 2.05), "L-DIAL": (0.7, 0.9), "R-TRACKBALL": (0.9, 0.9)}
rot = {"L-3-5": 18, "L-DIAL": 22}
r = lambda v: round(v * 20) / 20
ox = min(c[0] / U - size.get(k, (1, 1))[0] / 2 for k, c in px.items())
oy = min(c[1] / U - size.get(k, (1, 1))[1] / 2 for k, c in px.items())
out = {}
for k, (cx, cy) in px.items():
    w, h = size.get(k, (1, 1))
    out[k] = dict(x=r(cx / U - w / 2 - ox), y=r(cy / U - h / 2 - oy), width=w, height=h, rotation=rot.get(k, 0))
import json; print(json.dumps(out))

# ---- 規則的なモデルへの当てはめ ----
# 通常のキー(id が L-r-c / R-r-c)は、x = 左右ごとの基準 + 列 * Q、y = 列ごとの段のずれ + 段 * P
# と仮定し、P(縦の間隔)・Q(横の間隔)・各列の段のずれを最小二乗法で求める。
import re
regular = {k: v for k, v in px.items() if re.fullmatch(r"[LR]-\d-\d", k) and k != "L-3-5"}
def fit(pairs):  # 傾き共通・切片がグループごとの直線の当てはめ
    groups = {}
    for g, t, v in pairs: groups.setdefault(g, []).append((t, v))
    num = sum((t - sum(a for a, _ in l) / len(l)) * (v - sum(b for _, b in l) / len(l)) for l in groups.values() for t, v in l)
    den = sum((t - sum(a for a, _ in l) / len(l)) ** 2 for l in groups.values() for t, _ in l)
    slope = num / den
    icpt = {g: sum(v - slope * t for t, v in l) / len(l) for g, l in groups.items()}
    return slope, icpt
P, colOff = fit([((k[0], k.split("-")[2]), int(k.split("-")[1]), v[1]) for k, v in regular.items()])
Q, halfOff = fit([(k[0], int(k.split("-")[2]), v[0]) for k, v in regular.items()])
print(f"縦の間隔 P={P:.1f}px 横の間隔 Q={Q:.1f}px", file=__import__("sys").stderr)
U2 = Q  # 1キー分 = 横の間隔
fitted = dict(px)
for k in regular:
    side, row, col = k[0], int(k.split("-")[1]), k.split("-")[2]
    fitted[k] = (halfOff[side] + int(col) * Q, colOff[(side, col)] + row * P)
ox = min(c[0] / U2 - size.get(k, (1, 1))[0] / 2 for k, c in fitted.items())
oy = min(c[1] / U2 - size.get(k, (1, 1))[1] / 2 for k, c in fitted.items())
out = {}
for k, (cx, cy) in fitted.items():
    w, h = size.get(k, (1, 1))
    out[k] = dict(x=r(cx / U2 - w / 2 - ox), y=r(cy / U2 - h / 2 - oy), width=w, height=h, rotation=rot.get(k, 0))
print(json.dumps(out))

# ---- 左右の高さをそろえる(人間の指摘、2026-09-29) ----
# 写真では右手が少し上に写っているが、これは写真の配置のずれで、実物では左右の高さはそろっている。
# 左右で対応する列(左の列c ↔ 右の列6-c)の差の平均だけ、右手の要素すべてを下げる。
pairs = [(f"L-{r}-{c}", f"R-{r}-{6 - c}") for r in range(4) for c in range(6)]
pairs = [(a, b) for a, b in pairs if a in out and b in out and a != "L-3-5"]
dy = r(sum(out[a]["y"] - out[b]["y"] for a, b in pairs) / len(pairs))
for k in out:
    if k.startswith("R-"):
        out[k]["y"] = r(out[k]["y"] + dy)
print(f"右手を下げた量 dy={dy}", file=__import__("sys").stderr)
print(json.dumps(out))
