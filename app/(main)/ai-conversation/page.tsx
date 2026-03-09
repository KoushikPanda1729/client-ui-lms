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

// ─── Persona Card — tap-to-talk style ────────────────────────────────────────
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
      className="group relative flex w-full flex-col items-center overflow-hidden rounded-3xl bg-white text-center shadow-md ring-1 ring-zinc-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-100 hover:ring-indigo-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
    >
      {/* Full gradient background that animates on hover */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${d.bar} opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.14]`}
      />

      <div className="relative flex w-full flex-col items-center gap-4 px-6 pt-8 pb-6">
        {/* Pulse rings + Avatar */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <span
            className={`absolute h-28 w-28 rounded-full bg-linear-to-br ${d.bar} opacity-0 transition-opacity duration-300 group-hover:animate-ping group-hover:opacity-10`}
          />
          {/* Mid ring */}
          <span
            className={`absolute h-24 w-24 rounded-full bg-linear-to-br ${d.bar} opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-20`}
          />
          {/* Avatar */}
          <div
            className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-br ${d.bar} p-0.5 shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105`}
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-3xl">
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
        </div>

        {/* Name + badge */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className={`rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wide uppercase ${d.pill}`}
          >
            {d.label}
          </span>
          <p className="text-lg font-extrabold text-zinc-900">{persona.name}</p>
          <p className="text-xs font-medium text-zinc-400">{persona.expertise}</p>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500">{persona.description}</p>

        {/* Tap to talk CTA */}
        <div className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-3.5 shadow-md shadow-indigo-200 transition-all duration-200 group-hover:bg-indigo-700 group-hover:shadow-lg group-hover:shadow-indigo-300">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              {/* Live bip dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              {/* Mic icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 text-white/90"
              >
                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H10.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
              </svg>
              <span className="text-sm font-bold tracking-wide text-white">Tap to Talk</span>
            </>
          )}
        </div>

        {/* Sessions count */}
        <p className="text-[11px] text-zinc-400">
          🎙 {persona.usageCount.toLocaleString()} conversations
        </p>
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
  const [isMuted, setIsMuted] = useState(false);
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

  // Shared message list renderer
  const renderMessages = () => (
    <>
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          {isConnecting ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200" />
              <p className="text-sm text-zinc-500">Connecting to {persona.name}...</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
                🎙️
              </div>
              <p className="text-sm text-zinc-500">
                Start speaking — your conversation
                <br />
                will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[70%] rounded-2xl bg-zinc-700 px-4 py-2.5 text-sm leading-relaxed text-zinc-100">
                  &ldquo;{msg.text}&rdquo;
                </div>
              ) : (
                <p className="max-w-[85%] text-base leading-relaxed text-zinc-100 sm:max-w-2xl sm:text-lg">
                  {msg.text}
                </p>
              )}
            </div>
          ))}
          {isAI && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-800 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br ${d.bar} shadow-sm`}
        >
          {persona.avatar.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={persona.avatar} alt={persona.name} className="h-full w-full object-cover" />
          ) : (
            persona.avatar
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-white">{persona.name}</span>
          <span className="text-sm text-zinc-500">Voice</span>
        </div>
        {/* Live status dot */}
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`h-2 w-2 animate-pulse rounded-full ${isAI ? "bg-indigo-400" : isUser ? "bg-emerald-400" : isConnecting ? "bg-amber-400" : "bg-zinc-600"}`}
          />
          <span className="text-xs text-zinc-500">
            {isAI ? "Speaking" : isUser ? "Listening" : isConnecting ? "Connecting" : "Ready"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={transcriptRef}
        className="flex-1 space-y-5 overflow-y-auto px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-10 sm:py-6 [&::-webkit-scrollbar]:hidden"
      >
        {renderMessages()}
      </div>

      {/* Bottom bar — mic mute + End */}
      <div className="flex shrink-0 items-center justify-center gap-4 px-4 pt-3 pb-8">
        {/* Mute toggle button */}
        <button
          onClick={() => {
            const next = !isMuted;
            setIsMuted(next);
            if (vapiRef.current) vapiRef.current.setMuted(next);
          }}
          title={isMuted ? "Unmute" : "Mute"}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500/20 ring-2 ring-red-500/50"
              : isUser
                ? "bg-emerald-500/20 ring-2 ring-emerald-500/40"
                : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          {isMuted ? (
            /* Mic-off (slashed) */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-red-400"
            >
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 01-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            /* Mic-on */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`h-5 w-5 ${isUser ? "text-emerald-400" : "text-zinc-400"}`}
            >
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 01-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          )}
          {/* Muted label */}
          {isMuted && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-red-400">
              Muted
            </span>
          )}
        </button>
        {/* End button */}
        <button
          onClick={handleEnd}
          disabled={callStatus === "ending"}
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
        >
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          End
        </button>
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
    <div className="min-h-screen bg-linear-to-b from-indigo-50/60 via-white to-white pt-16 pb-20 sm:pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 sm:px-4 sm:py-1.5 sm:text-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Real-time Voice AI · Powered by Vapi
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Practice English with
            <span className="ml-2 bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Tutors
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-base text-zinc-500 sm:text-lg">
            Pick a tutor below and start speaking right away — no setup, no waiting.
          </p>
        </div>

        {/* Filter — pill chips on mobile, boxed tabs on desktop */}
        <div className="mb-6 sm:mb-8 sm:flex sm:justify-center">
          {/* Mobile: horizontal scrollable chips, no scrollbar */}
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
            {(["all", "beginner", "intermediate", "advanced"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
                  filter === f
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "border border-zinc-200 bg-white text-zinc-500"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          {/* Desktop: boxed tab bar */}
          <div className="hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-sm sm:inline-flex">
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
          <div
            className={
              filtered.length === 1
                ? "flex justify-center"
                : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {filtered.map((persona) => (
              <div key={persona.id} className={filtered.length === 1 ? "w-full max-w-sm" : ""}>
                <PersonaCard
                  persona={persona}
                  onSelect={handleSelectPersona}
                  loading={starting === persona.id}
                />
              </div>
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
