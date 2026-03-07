"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import {
  aiConversationService,
  type AIPersona,
  type StartSessionResult,
} from "@/lib/services/ai-conversation";

type Message = { role: "user" | "ai"; text: string };
type CallStatus = "idle" | "connecting" | "active" | "ending" | "error";

// ─── Vapi singleton ───────────────────────────────────────────────────────────
let _vapiInstance: Vapi | null = null;
function destroyVapiInstance() {
  if (_vapiInstance) {
    _vapiInstance.stop();
    _vapiInstance = null;
  }
}

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFF: Record<string, { pill: string; bar: string; label: string }> = {
  beginner: {
    pill: "bg-emerald-100 text-emerald-700",
    bar: "from-emerald-400 to-teal-400",
    label: "Beginner",
  },
  intermediate: {
    pill: "bg-amber-100 text-amber-700",
    bar: "from-amber-400 to-orange-400",
    label: "Intermediate",
  },
  advanced: {
    pill: "bg-rose-100 text-rose-700",
    bar: "from-rose-400 to-pink-500",
    label: "Advanced",
  },
};

// ─── Persona Card — profile style ─────────────────────────────────────────────
function PersonaCard({
  persona,
  onSelect,
  loading,
}: {
  persona: AIPersona;
  onSelect: (p: AIPersona) => void;
  loading: boolean;
}) {
  const d = DIFF[persona.difficulty] ?? DIFF.beginner;
  return (
    <button
      onClick={() => onSelect(persona)}
      disabled={loading}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-100/80 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
    >
      {/* Gradient banner */}
      <div
        className={`h-20 w-full bg-linear-to-br ${d.bar} opacity-15 transition-opacity group-hover:opacity-25`}
      />

      {/* Avatar — overlaps banner */}
      <div className="-mt-10 flex flex-col items-center px-5 pb-5">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-3xl shadow-md">
          {persona.avatar.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={persona.avatar} alt={persona.name} className="h-full w-full object-cover" />
          ) : (
            persona.avatar
          )}
        </div>

        <div className="mt-3 flex w-full flex-col items-center gap-1 text-center">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${d.pill}`}>
            {d.label}
          </span>
          <p className="mt-1 text-base font-bold text-zinc-900">{persona.name}</p>
          <p className="text-xs text-zinc-500">{persona.expertise}</p>
        </div>

        <p className="mt-3 line-clamp-2 text-center text-sm leading-relaxed text-zinc-500">
          {persona.description}
        </p>

        <div className="mt-4 flex w-full items-center justify-between">
          <span className="text-xs text-zinc-400">
            🎙 {persona.usageCount.toLocaleString()} sessions
          </span>
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          ) : (
            <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition-all group-hover:bg-indigo-700 group-hover:shadow-indigo-300">
              Start →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Conversation Screen ──────────────────────────────────────────────────────
function VapiConversationScreen({
  persona,
  session,
  onEnd,
}: {
  persona: AIPersona;
  session: StartSessionResult;
  onEnd: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>("connecting");
  const [isSpeaking, setIsSpeaking] = useState<"ai" | "user" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [volume, setVolume] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const onEndRef = useRef(onEnd);
  const endedByUserRef = useRef(false);
  const retryingRef = useRef(false);
  const aiPartialRef = useRef("");
  const userPartialRef = useRef("");

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages]);

  const handleEnd = useCallback(async () => {
    if (endedByUserRef.current) return;
    endedByUserRef.current = true;
    setCallStatus("ending");
    destroyVapiInstance();
    vapiRef.current = null;
    try {
      await aiConversationService.endSession(session.sessionId);
    } catch {
      /* */
    }
    onEndRef.current();
  }, [session.sessionId]);

  useEffect(() => {
    const vapiKey = process.env.NEXT_PUBLIC_VAPI_KEY;
    if (!vapiKey) {
      setErrorMsg("NEXT_PUBLIC_VAPI_KEY not set.");
      setCallStatus("error");
      return;
    }

    const startOptions = {
      transcriber: {
        provider: "deepgram" as const,
        model: "nova-2" as const,
        language: "en-US" as const,
      },
      model: {
        provider: "openai" as const,
        model: "gpt-4o-mini" as const,
        messages: [{ role: "system" as const, content: session.systemPrompt }],
      },
      voice: { provider: "openai" as const, voiceId: "nova" as const },
      firstMessage: `Hello! I'm ${persona.name}. ${persona.description} Let's begin!`,
    };

    const attach = (v: Vapi) => {
      v.on("call-start", () => setCallStatus("active"));
      v.on("call-end", () => {
        if (retryingRef.current) return;
        if (!endedByUserRef.current) {
          endedByUserRef.current = true;
          aiConversationService.endSession(session.sessionId).catch(() => {});
          onEndRef.current();
        }
      });
      v.on("error", (e) => {
        const msg: string = e?.error?.message ?? e?.message ?? JSON.stringify(e) ?? "";
        if (msg.includes("Duplicate DailyIframe")) {
          retryingRef.current = true;
          setTimeout(() => {
            if (endedByUserRef.current) return;
            document.querySelectorAll("iframe").forEach((el) => {
              if (el.id?.startsWith("daily-") || el.src?.includes("daily.co")) el.remove();
            });
            _vapiInstance = null;
            const nv = new Vapi(vapiKey);
            _vapiInstance = nv;
            vapiRef.current = nv;
            attach(nv);
            retryingRef.current = false;
            nv.start(startOptions);
          }, 800);
          return;
        }
        setErrorMsg(msg || "Vapi error");
        setCallStatus("error");
      });
      v.on("speech-start", () => setIsSpeaking("ai"));
      v.on("speech-end", () => setIsSpeaking(null));
      v.on("volume-level", (vol: number) => setVolume(vol));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      v.on("message", (msg: any) => {
        if (msg.type !== "transcript") return;
        if (msg.role === "assistant") {
          if (msg.transcriptType === "partial") {
            aiPartialRef.current = msg.transcript;
          } else {
            const t = msg.transcript || aiPartialRef.current;
            aiPartialRef.current = "";
            if (t.trim()) setMessages((p) => [...p, { role: "ai", text: t }]);
          }
        } else if (msg.role === "user") {
          if (msg.transcriptType === "partial") {
            userPartialRef.current = msg.transcript;
            setIsSpeaking("user");
          } else {
            const t = msg.transcript || userPartialRef.current;
            userPartialRef.current = "";
            setIsSpeaking(null);
            if (t.trim()) setMessages((p) => [...p, { role: "user", text: t }]);
          }
        }
      });
    };

    destroyVapiInstance();
    const vapi = new Vapi(vapiKey);
    _vapiInstance = vapi;
    vapiRef.current = vapi;
    attach(vapi);
    vapi.start(startOptions);
    return () => {
      destroyVapiInstance();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = DIFF[persona.difficulty] ?? DIFF.beginner;
  const isAI = isSpeaking === "ai";
  const isUser = isSpeaking === "user";
  const isConnecting = callStatus === "connecting";

  if (callStatus === "error")
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-5xl">⚠️</p>
        <p className="text-xl font-bold text-zinc-900">Something went wrong</p>
        <p className="max-w-xs text-center text-sm text-zinc-500">{errorMsg}</p>
        <button
          onClick={onEnd}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50 text-xl">
          {persona.avatar.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={persona.avatar} alt={persona.name} className="h-full w-full object-cover" />
          ) : (
            persona.avatar
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-zinc-900">{persona.name}</p>
          <p className="text-[11px] text-zinc-500">{persona.expertise}</p>
        </div>

        {/* Live status */}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            isAI
              ? "bg-indigo-50 text-indigo-600"
              : isUser
                ? "bg-emerald-50 text-emerald-600"
                : isConnecting
                  ? "bg-amber-50 text-amber-600"
                  : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <span
            className={`h-2 w-2 animate-pulse rounded-full ${
              isAI
                ? "bg-indigo-500"
                : isUser
                  ? "bg-emerald-500"
                  : isConnecting
                    ? "bg-amber-400"
                    : "bg-zinc-400"
            }`}
          />
          {isAI
            ? `${persona.name} speaking`
            : isUser
              ? "You're speaking"
              : isConnecting
                ? "Connecting..."
                : "Listening"}
        </div>

        <button
          onClick={handleEnd}
          disabled={callStatus === "ending"}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
        >
          ✕ End
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Voice panel */}
        <div className="flex w-60 shrink-0 flex-col items-center justify-between border-r border-zinc-200 bg-white px-5 py-8">
          <div className="flex w-full flex-col items-center gap-5">
            {/* Avatar with ring */}
            <div className="relative">
              {(isAI || isUser) && (
                <div
                  className={`absolute -inset-3 animate-ping rounded-full opacity-20 ${isAI ? "bg-indigo-500" : "bg-emerald-500"}`}
                />
              )}
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br text-5xl shadow-lg transition-all duration-300 ${d.bar} ${
                  isAI
                    ? "ring-4 shadow-indigo-200 ring-indigo-400/50"
                    : isUser
                      ? "ring-4 shadow-emerald-200 ring-emerald-400/50"
                      : "shadow-zinc-200"
                } overflow-hidden opacity-90`}
              >
                {persona.avatar.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  persona.avatar
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="font-bold text-zinc-900">{persona.name}</p>
              <p className="text-xs text-zinc-500">{persona.expertise}</p>
            </div>

            {/* Volume bars */}
            <div className="flex h-8 items-end gap-1">
              {Array.from({ length: 9 }).map((_, i) => {
                const active = callStatus === "active" && (isAI || isUser);
                const h = active
                  ? Math.max(4, Math.round(volume * 32 * (0.4 + Math.abs(Math.sin(i * 0.9)) * 0.6)))
                  : 4;
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      isAI ? "bg-indigo-400" : isUser ? "bg-emerald-400" : "bg-zinc-200"
                    }`}
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>

            {/* Status pill */}
            <div
              className={`w-full rounded-xl py-2 text-center text-sm font-semibold ${
                isAI
                  ? "bg-indigo-50 text-indigo-600"
                  : isUser
                    ? "bg-emerald-50 text-emerald-700"
                    : isConnecting
                      ? "bg-amber-50 text-amber-600"
                      : "bg-zinc-50 text-zinc-500"
              }`}
            >
              {isAI
                ? "AI is speaking..."
                : isUser
                  ? "You're speaking..."
                  : isConnecting
                    ? "Connecting..."
                    : "Listening..."}
            </div>

            {callStatus === "active" && !isSpeaking && (
              <p className="text-center text-xs leading-relaxed text-zinc-400">
                🎙️ Speak naturally
                <br />
                after the AI stops
              </p>
            )}
          </div>

          {/* End call */}
          <button
            onClick={handleEnd}
            disabled={callStatus === "ending"}
            className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-200 transition hover:bg-red-600 active:scale-95 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                clipRule="evenodd"
              />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* RIGHT: Chat */}
        <div className="flex flex-1 flex-col">
          <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-3">
            <p className="text-sm font-semibold text-zinc-800">Live Transcript</p>
            <p className="text-[11px] text-zinc-400">Powered by Vapi · Real-time voice AI</p>
          </div>

          <div
            ref={transcriptRef}
            className="flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-5 py-5"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                {isConnecting ? (
                  <>
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <p className="text-sm text-zinc-500">Connecting to {persona.name}...</p>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                      🎙️
                    </div>
                    <p className="text-sm text-zinc-400">
                      Your conversation will appear here.
                      <br />
                      Start speaking!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${d.bar} overflow-hidden text-sm shadow-sm`}
                      >
                        {persona.avatar.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          persona.avatar
                        )}
                      </div>
                    )}
                    <div className="flex max-w-[75%] flex-col gap-1">
                      <span
                        className={`text-[10px] font-semibold text-zinc-400 ${msg.role === "user" ? "text-right" : ""}`}
                      >
                        {msg.role === "user" ? "You" : persona.name}
                      </span>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "rounded-tr-sm bg-indigo-600 text-white"
                            : "rounded-tl-sm border border-zinc-100 bg-white text-zinc-800"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                        You
                      </div>
                    )}
                  </div>
                ))}
                {isAI && (
                  <div className="flex gap-3">
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${d.bar} overflow-hidden text-sm`}
                    >
                      {persona.avatar.startsWith("http") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={persona.avatar}
                          alt={persona.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        persona.avatar
                      )}
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-2 w-2 animate-bounce rounded-full bg-zinc-300"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIConversationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [personas, setPersonas] = useState<AIPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<StartSessionResult | null>(null);
  const [activePersona, setActivePersona] = useState<AIPersona | null>(null);
  const [endedPersona, setEndedPersona] = useState<AIPersona | null>(null);
  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);
  useEffect(() => {
    if (!user) return;
    aiConversationService
      .listPersonas()
      .then(setPersonas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSelectPersona = async (persona: AIPersona) => {
    setStarting(persona.id);
    try {
      const session = await aiConversationService.startSession(persona.id);
      setActivePersona(persona);
      setActiveSession(session);
    } catch {
      setStarting(null);
    }
  };

  const handleEndSession = useCallback(() => {
    setEndedPersona(activePersona);
    setActiveSession(null);
    setActivePersona(null);
    setStarting(null);
  }, [activePersona]);

  if (activeSession && activePersona)
    return (
      <VapiConversationScreen
        persona={activePersona}
        session={activeSession}
        onEnd={handleEndSession}
      />
    );

  if (endedPersona)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-indigo-50/60 via-white to-white px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-indigo-100 shadow-xl shadow-indigo-200">
          {endedPersona.avatar.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={endedPersona.avatar}
              alt={endedPersona.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-5xl">{endedPersona.avatar}</span>
          )}
        </div>
        <div className="mb-2 rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
          Session Complete
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-zinc-900">Great practice!</h2>
        <p className="mt-2 max-w-sm text-zinc-500">
          You just practiced with{" "}
          <span className="font-semibold text-zinc-800">{endedPersona.name}</span>. Keep it up —
          consistency is the key to fluency.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              setEndedPersona(null);
              handleSelectPersona(endedPersona);
            }}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            Practice Again
          </button>
          <button
            onClick={() => setEndedPersona(null)}
            className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Choose Another
          </button>
        </div>
      </div>
    );

  const filtered = filter === "all" ? personas : personas.filter((p) => p.difficulty === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-white pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Real-time Voice AI · Powered by Vapi
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-zinc-900">
            Practice English with
            <span className="ml-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Tutors
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-zinc-500">
            Pick a tutor below and start speaking right away — no setup, no waiting.
          </p>
        </div>

        {/* Filter */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {(["all", "beginner", "intermediate", "advanced"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all ${
                  filter === f
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading || authLoading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onSelect={handleSelectPersona}
                loading={starting === persona.id}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-base text-zinc-400">No tutors for this level yet.</p>
          </div>
        )}
      </div>

      {/* Full-screen loading overlay */}
      {starting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-white/80 backdrop-blur-sm">
          <div className="flex h-20 w-20 animate-pulse items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-300">
            {(() => {
              const av = personas.find((p) => p.id === starting)?.avatar ?? "";
              return av.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={av} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl">{av || "🤖"}</span>
              );
            })()}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-zinc-900">Starting session...</p>
            <p className="mt-1 text-sm text-zinc-500">Connecting to your AI tutor</p>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-indigo-600" />
          </div>
        </div>
      )}
    </div>
  );
}
