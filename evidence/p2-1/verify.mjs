import { ImageResponse } from "next/og.js";
import { createElement as h } from "react";
import { readFile, writeFile } from "node:fs/promises";

const font = await readFile("public/fonts/NotoSansJP-Bold.ttf");
const keys = [
  { x: 40, y: 40, press: "Esc", hold: "" },
  { x: 150, y: 40, press: "変換", hold: "Ctrl" },
  { x: 260, y: 40, press: "左クリック", hold: "" },
];
const W = 400, H = 160, S = 100;
const opts = { width: W, height: H, fonts: [{ name: "Noto Sans JP", data: font, weight: 700, style: "normal" }] };
const bg = { width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "#f4f4f5", fontFamily: "Noto Sans JP" };

// A: SVGの<text>で文字を描く
const a = h("div", { style: bg },
  h("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}` },
    ...keys.flatMap((k) => [
      h("rect", { x: k.x, y: k.y, width: S, height: S * 0.9, rx: 10, fill: "#27272a" }),
      h("text", { x: k.x + S / 2, y: k.y + 45, fill: "#fff", fontSize: 18, textAnchor: "middle", fontFamily: "Noto Sans JP" }, k.press),
      h("text", { x: k.x + S / 2, y: k.y + 75, fill: "#a1a1aa", fontSize: 12, textAnchor: "middle", fontFamily: "Noto Sans JP" }, k.hold),
    ])));

// B: SVGで図形、文字はHTML(div)を絶対配置で重ねる
const b = h("div", { style: bg },
  h("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: { position: "absolute", left: 0, top: 0 } },
    ...keys.map((k) => h("rect", { x: k.x, y: k.y, width: S, height: S * 0.9, rx: 10, fill: "#27272a" }))),
  ...keys.map((k) => h("div", { style: { position: "absolute", left: k.x, top: k.y, width: S, height: S * 0.9, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
    h("div", { style: { color: "#fff", fontSize: 18 } }, k.press),
    h("div", { style: { color: "#a1a1aa", fontSize: 12, marginTop: 6, height: 14 } }, k.hold))));

for (const [name, el] of [["A-svg-text", a], ["B-svg-plus-html", b]]) {
  try {
    const res = new ImageResponse(el, opts);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(`evidence/p2-1/${name}.png`, buf);
    console.log(name, "OK", buf.length, "bytes");
  } catch (e) { console.log(name, "FAILED", e.message); }
}
