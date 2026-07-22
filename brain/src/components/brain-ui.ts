// Shared Tailwind class strings + inline styles for the Brain section cards, so
// every section renders with the same warm DailyOS palette.
import type { CSSProperties } from "react";

export const ACCENT = "#bf502b";
export const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";
export const inputCls = "w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#bf502b]";
export const btnStyle: CSSProperties = { background: ACCENT, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
export const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#d9d2c6] bg-white px-3 py-2 text-sm font-semibold text-[#4b443b] transition hover:bg-[#f2e6da]";
export const chipCls = "rounded-full border border-[#e6ded2] bg-[#faf7f1] px-3 py-1 text-xs font-semibold text-[#bf502b] transition hover:bg-[#f2e6da]";
export const replyBox = "whitespace-pre-wrap rounded-lg border border-[#f2e6da] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]";
export const errBox = "rounded-lg border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]";
