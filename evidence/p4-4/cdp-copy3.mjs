const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id) pending.get(m.id)?.(m); });
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? "例外: " + JSON.stringify(r.result.exceptionDetails.exception?.description) : r.result?.result?.value; };
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Page.bringToFront");
const g = await send("Browser.grantPermissions", { origin: "http://localhost:3123", permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
console.log("権限の付与:", g.error ? g.error.message : "OK");
await send("Page.reload"); await new Promise((r) => setTimeout(r, 5000));
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await ev(`[...document.querySelectorAll("button")].find(b => b.textContent === "画像をコピー").click()`);
await new Promise((r) => setTimeout(r, 4000));
console.log("コピー後の表示:", await ev(`document.querySelector('[role="status"]')?.textContent`));
console.log("クリップボード:", await ev(`(async () => { try {
  const out = [];
  for (const it of await navigator.clipboard.read()) for (const t of it.types) {
    const b = await it.getType(t);
    const bmp = t.startsWith("image/") ? await createImageBitmap(b) : null;
    out.push(t + " " + b.size + "バイト " + (bmp ? bmp.width + "x" + bmp.height : ""));
  }
  return out.join(" / ") || "(空)";
} catch (e) { return "読み取りエラー " + e.name + ": " + e.message; } })()`));
// コピーに対応していないブラウザのふり: ClipboardItem を消してからボタンを押す
await ev(`window.ClipboardItem = undefined; [...document.querySelectorAll("button")].find(b => b.textContent === "画像をコピー").click(); "ok"`);
await new Promise((r) => setTimeout(r, 1000));
console.log("非対応のときの表示:", await ev(`document.querySelector('[role="status"]')?.textContent`));
ws.close();
