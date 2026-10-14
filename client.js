// Talks to /api/game, or to an in-browser game when the host runs offline.
import { dispatch, memoryKV } from "./core.js";
export async function call(action, params = {}) {
  let r;
  try { r = await fetch("/api/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...params }), cache: "no-store" }); }
  catch { const e = new Error("Can't reach the game. Check the Wi-Fi."); e.code = "network"; throw e; }
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok || !j) { const e = new Error((j && j.message) || "Server error (" + r.status + ")."); e.code = (j && j.error) || "server"; throw e; }
  return j;
}
export function offlineCaller() { const kv = memoryKV(); return (action, params = {}) => dispatch(kv, action, JSON.parse(JSON.stringify(params))); }
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
export const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { localStorage.removeItem(k); } catch {} } };
