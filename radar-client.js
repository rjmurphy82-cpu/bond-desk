// Recession Radar Live: talks to /api/radar, or to an in-browser game when the host plays without iPads.
import { dispatch, memoryKV } from "./radar-core.js";
export async function call(action, params = {}) {
  let r;
  try { r = await fetch("/api/radar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...params }), cache: "no-store" }); }
  catch { const e = new Error("Can't reach the game. Check the Wi-Fi."); e.code = "network"; throw e; }
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok || !j) { const e = new Error((j && j.message) || "Server error (" + r.status + ")."); e.code = (j && j.error) || "server"; throw e; }
  return j;
}
export function offlineCaller() { const kv = memoryKV(); return (action, params = {}) => dispatch(kv, action, JSON.parse(JSON.stringify(params))); }
export { esc, $, $$, store } from "./client.js";
