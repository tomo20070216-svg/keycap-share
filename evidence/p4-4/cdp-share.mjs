// 共有パネルの動作確認(ヘッドレスChromeをDevTools Protocolで操作する)
// 使い方: node cdp-share.mjs <ページURL> <ダウンロード先フォルダ> <スクリーンショットの保存先>
import { writeFileSync, readdirSync } from "node:fs";

const [pageUrl, downloadDir, shotPath] = process.argv.slice(2);
const origin = new URL(pageUrl).origin;
const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const pageTarget = targets.find((t) => t.type === "page");
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const events = [];
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method) events.push(msg);
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;

await send("Page.enable");
await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir, eventsEnabled: true });
await send("Browser.grantPermissions", { origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
await send("Page.navigate", { url: pageUrl });
await sleep(6000);

// 1. 文面を書き換えて、Xで共有するリンクの行き先を確認
const edited = "編集した文面のテスト #OrcaEcho";
await evaluate(`(() => {
  const ta = document.querySelector("textarea");
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  setter.call(ta, ${JSON.stringify(edited)});
  ta.dispatchEvent(new Event("input", { bubbles: true }));
})()`);
await sleep(500);
const intentHref = await evaluate(`[...document.querySelectorAll("a")].find(a => a.textContent === "Xで共有する").href`);
const intent = new URL(intentHref);
console.log("X投稿画面のURL:", intent.origin + intent.pathname);
console.log("  text =", JSON.stringify(intent.searchParams.get("text")), intent.searchParams.get("text") === edited ? "(編集した文面と一致)" : "(不一致!)");
console.log("  url  =", intent.searchParams.get("url"));

// 2. 画像をダウンロード
await evaluate(`[...document.querySelectorAll("a")].find(a => a.textContent === "画像をダウンロード").click()`);
for (let i = 0; i < 30 && !events.some((e) => e.method === "Browser.downloadProgress" && e.params.state === "completed"); i++) await sleep(500);
const done = events.find((e) => e.method === "Browser.downloadProgress" && e.params.state === "completed");
console.log("ダウンロード:", done ? "完了" : "未完了", readdirSync(downloadDir));

// 3. 画像をコピー → クリップボードの中身を読む
await evaluate(`[...document.querySelectorAll("button")].find(b => b.textContent === "画像をコピー").click()`);
await sleep(4000);
const status = await evaluate(`document.querySelector('[role="status"]')?.textContent ?? null`);
console.log("コピー後の表示:", status);
const clip = await evaluate(`(async () => {
  const items = await navigator.clipboard.read();
  const out = [];
  for (const item of items) for (const type of item.types) {
    const blob = await item.getType(type);
    const bmp = type.startsWith("image/") ? await createImageBitmap(blob) : null;
    out.push({ type, size: blob.size, width: bmp?.width, height: bmp?.height });
  }
  return out;
})()`);
console.log("クリップボードの中身:", JSON.stringify(clip));

// 共有パネル付近のスクリーンショット
const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1100, height: 700, scale: 1 } });
writeFileSync(shotPath, Buffer.from(shot.result.data, "base64"));
console.log("スクリーンショット:", shotPath);
ws.close();
