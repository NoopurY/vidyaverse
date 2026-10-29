"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Select } from "../ui";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type Msg = { _id: string; to?: string; from?: string; message: string; direction: "in" | "out"; createdAt: string; status: string };
type Data = { mode: "mock" | "live"; personas: { id: string; label: string; phone: string }[]; messages: Msg[] };

const QUICK: Record<string, string[]> = {
  employer: ["VERIFY ", "HELP"],
  student: ["YES ", "NO ", "REVOKE "],
  institution: ["HELP"],
  institution2: ["HELP"],
};

/** Chat-style WhatsApp bot simulator (runs the real bot; messages stored in Notifications in MOCK mode) */
export function WhatsAppSimulator() {
  const [persona, setPersona] = useState("employer");
  const { data: base } = useSWR<Data>("/api/whatsapp/simulate");
  const phone = base?.personas.find((p) => p.id === persona)?.phone;
  const { data, mutate } = useSWR<Data>(phone ? `/api/whatsapp/simulate?phone=${phone}` : null, { refreshInterval: 10_000 });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [data?.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !phone) return;
    setBusy(true);
    try {
      await api("/api/whatsapp/simulate", "POST", { from: phone, text: text.trim() });
      setText("");
      mutate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <div className="space-y-3">
        <label htmlFor="persona" className="label">
          Chat as
        </label>
        <Select id="persona" value={persona} onChange={(e) => setPersona(e.target.value)}>
          {base?.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted">
          Number: <span className="font-mono">+{phone}</span>
        </p>
        <Badge tone={base?.mode === "live" ? "green" : "navy"}>{base?.mode === "live" ? "Live – Meta Cloud API" : "MOCK mode"}</Badge>
        <div className="rounded border border-line bg-page p-3 text-xs text-muted">
          <p className="font-semibold text-ink">Try</p>
          <p>Employer: VERIFY &lt;APAAR&gt; &lt;CODE&gt;</p>
          <p>Student: YES &lt;code&gt; · NO &lt;code&gt; · REVOKE &lt;consent ID&gt;</p>
          <p>Institution: receives intake-breach alerts</p>
        </div>
      </div>
      <div className="flex h-[420px] flex-col overflow-hidden rounded border border-line bg-[#EFEAE2]">
        <div className="bg-[#075E54] px-4 py-2.5 text-sm font-semibold text-white">AICTE VidyaVerse Bot</div>
        <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite" aria-label="Conversation">
          {!data?.messages.length && <p className="pt-10 text-center text-xs text-muted">No messages yet for this number.</p>}
          {data?.messages.map((m) => (
            <div key={m._id} className={cn("max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-sm", m.direction === "in" ? "ml-auto bg-[#D9FDD3]" : "bg-white")}>
              {m.message}
              <span className="mt-1 block text-right text-[10px] text-muted">{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-line bg-white p-2">
          <div className="hidden gap-1 sm:flex">
            {(QUICK[persona] ?? []).map((q) => (
              <button key={q} type="button" onClick={() => setText(q)} className="rounded-full border border-line px-2.5 text-xs text-navy hover:bg-navy-tint">
                {q.trim()}
              </button>
            ))}
          </div>
          <label htmlFor="wa-text" className="sr-only">
            Message
          </label>
          <input id="wa-text" value={text} onChange={(e) => setText(e.target.value)} className="input h-9 flex-1" placeholder="Type a message" autoComplete="off" />
          <Button type="submit" size="sm" loading={busy} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
