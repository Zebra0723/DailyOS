"use client";

import * as React from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { testAIAction } from "@/app/brain/actions";
import { card, inputCls, btnStyle, replyBox, errBox, ACCENT } from "@/components/brain-ui";

/** Single-shot connectivity check used on the Overview page to confirm the key
 *  and endpoint actually reach the provider. */
export function QuickTest() {
  const [prompt, setPrompt] = React.useState("");
  const [reply, setReply] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);

  async function test() {
    setTesting(true);
    setReply(null);
    setErr(null);
    const r = await testAIAction(prompt);
    setTesting(false);
    if (r.ok) setReply(r.reply ?? "");
    else setErr(r.error ?? "Failed");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Sparkles className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">Quick test</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Fire a single prompt at the provider to confirm the key and endpoint work.</p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the model something to check it's working…" className={`mt-2 h-20 ${inputCls}`} />
      <button onClick={test} disabled={testing} className="mt-2 inline-flex items-center gap-2" style={{ ...btnStyle, opacity: testing ? 0.6 : 1 }}>
        {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Run test
      </button>
      {err && <div className={`mt-3 ${errBox}`}>{err}</div>}
      {reply !== null && <div className={`mt-3 ${replyBox}`}>{reply}</div>}
    </section>
  );
}
