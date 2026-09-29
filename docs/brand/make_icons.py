"""人間が作ったアイコン(白い余白つき)から、サイト用のアイコンを作る"""
import sys
from PIL import Image, ImageDraw, ImageFilter

src, sp = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size

# 角の白い余白を塗りつぶしで見つけて透明にする(角の4点から)
marker = (255, 0, 255)
work = im.copy()
for p in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    ImageDraw.floodfill(work, p, marker, thresh=60)
mask = Image.new("L", (W, H), 255)
mp = mask.load(); wp = work.load()
for y in range(H):
    for x in range(W):
        if wp[x, y] == marker:
            mp[x, y] = 0
mask = mask.filter(ImageFilter.GaussianBlur(0.8))
rgba = im.convert("RGBA"); rgba.putalpha(mask)
bbox = mask.point(lambda v: 255 if v > 8 else 0).getbbox()
# 正方形に切り出す(わずかな余白を残す)
x0, y0, x1, y1 = bbox
side = max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
pad = int(side * 0.02)
half = side // 2 + pad
square = rgba.crop((cx - half, cy - half, cx + half, cy + half))
print("bbox", bbox, "square", square.size)

master = square.resize((1024, 1024), Image.LANCZOS)
master.save(f"{sp}/icon-master.png")
master.resize((512, 512), Image.LANCZOS).save("src/app/icon.png", optimize=True)
# ブラウザのタブ用(小さいサイズは .ico にまとめる)
master.save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
# iPhone のホーム画面用: 透明を使わず、角を濃い青で埋める(角はOSが丸める)
bgc = im.getpixel((W // 2, int(H * 0.12)))
apple = Image.new("RGBA", (1024, 1024), bgc + (255,))
inner = square.crop((int(square.width * 0.04),) * 2 + (int(square.width * 0.96),) * 2).resize((1024, 1024), Image.LANCZOS)
apple.alpha_composite(inner)
apple.convert("RGB").resize((180, 180), Image.LANCZOS).save("src/app/apple-icon.png", optimize=True)
# 確認用に、並べたものを作る
prev = Image.new("RGBA", (700, 260), (230, 230, 230, 255))
prev.alpha_composite(master.resize((200, 200), Image.LANCZOS), (20, 30))
prev.alpha_composite(Image.open("src/app/apple-icon.png").convert("RGBA"), (250, 40))
for i, s in enumerate([48, 32, 16]):
    prev.alpha_composite(master.resize((s, s), Image.LANCZOS).resize((s * 3, s * 3), Image.NEAREST), (460 + i * 0, 10 + [0, 150, 0][i] if False else 10))
prev.save(f"{sp}/icon-preview.png")
print("bg", bgc)
