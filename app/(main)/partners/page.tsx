"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AudioOutlined,
  AudioMutedOutlined,
  PhoneOutlined,
  StarFilled,
  GlobalOutlined,
  TeamOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SoundOutlined,
  SendOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAudioCall } from "@/hooks/useAudioCall";

/* ══════════════════════════════════════════
   Format seconds → MM:SS
   ══════════════════════════════════════════ */
function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ══════════════════════════════════════════
   Audio Call Modal — real WebRTC
   ══════════════════════════════════════════ */
function AudioCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    phase,
    partner,
    errorMsg,
    muted,
    duration,
    messages,
    speakerOn,
    startSearch,
    cancelSearch,
    endCall,
    toggleMute,
    toggleSpeaker,
    sendMessage,
  } = useAudioCall();

  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Start searching when modal opens
  useEffect(() => {
    if (open) {
      startSearch();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new messages arrive or chat opens
  useEffect(() => {
    if (chatScrollRef.current && chatOpen) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatOpen]);

  const handleEndOrCancel = () => {
    if (phase === "searching" || phase === "matched") {
      cancelSearch();
    } else {
      endCall();
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* remote audio is created programmatically via new Audio() inside the hook */}

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 shadow-2xl">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative p-8 text-center">
          {/* ── Searching state ── */}
          {(phase === "idle" || phase === "searching" || phase === "matched") && (
            <>
              <p className="mb-6 text-sm font-medium text-indigo-200">
                {phase === "matched" ? "Match found! Connecting..." : "Finding you a partner..."}
              </p>
              {/* Pulsing avatar */}
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/20" />
                <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-white/10 delay-75" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur-sm">
                  🔍
                </div>
              </div>
              <p className="mb-2 text-xl font-bold text-white">Searching...</p>
              <p className="mb-8 text-sm text-indigo-200">
                Matching you with a native English speaker
              </p>
              {/* animated dots */}
              <div className="mb-8 flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-white/50"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <button
                onClick={handleEndOrCancel}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/40 transition-transform hover:scale-110 active:scale-95"
              >
                <PhoneOutlined className="rotate-[135deg] text-xl text-white" />
              </button>
              <p className="mt-3 text-xs text-indigo-300">Tap to cancel</p>
            </>
          )}

          {/* ── Connecting / Connected state ── */}
          {(phase === "connecting" || phase === "connected") && partner && (
            <>
              {/* Status badge */}
              <div className="mb-5 flex items-center justify-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    phase === "connected"
                      ? "animate-pulse bg-emerald-400 shadow-lg shadow-emerald-400/60"
                      : "bg-yellow-400"
                  }`}
                />
                <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
                  {phase === "connected" ? "Connected" : "Connecting..."}
                </p>
              </div>

              {/* Partner avatar with glow ring */}
              <div className="relative mx-auto mb-5 h-28 w-28">
                {phase === "connected" && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/10 [animation-duration:2.5s]" />
                )}
                <div className="relative h-full w-full rounded-full bg-gradient-to-br from-white/30 to-white/5 p-[3px]">
                  {partner.avatarUrl ? (
                    <Image
                      src={partner.avatarUrl}
                      alt={partner.displayName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-5xl backdrop-blur-sm">
                      👤
                    </div>
                  )}
                </div>
                {phase === "connected" && (
                  <span className="absolute right-1.5 bottom-1.5 h-4 w-4 rounded-full border-2 border-violet-700 bg-emerald-400 shadow-lg shadow-emerald-500/60" />
                )}
              </div>

              {/* Name + Level */}
              <p className="mb-1 text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {partner.displayName}
              </p>
              {partner.level && (
                <p className="mb-4 text-sm font-medium text-white/50 capitalize">
                  {partner.level} Level
                </p>
              )}

              {/* Timer pill */}
              {phase === "connected" && (
                <div className="mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full bg-black/30 px-6 py-2 shadow-inner ring-1 ring-white/10">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-mono text-lg font-bold tracking-[0.2em] text-white tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}

              {/* Waveform */}
              {phase === "connected" && (
                <div className="mb-7 flex h-10 items-end justify-center gap-[3px]">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-full"
                      style={{
                        height: `${16 + Math.sin(i * 0.75) * 14}px`,
                        background: `rgba(255,255,255,${0.35 + Math.sin(i * 0.5) * 0.25})`,
                        animation: `waveBar 1.4s ease-in-out ${(i * 0.055) % 0.7}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {/* Mic */}
                <button
                  onClick={toggleMute}
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    muted ? "bg-red-500/25 ring-2 ring-red-400/70" : "bg-white/20 hover:bg-white/30"
                  }`}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <AudioMutedOutlined className="text-lg text-red-300" />
                  ) : (
                    <AudioOutlined className="text-lg text-white" />
                  )}
                </button>

                {/* End call */}
                <button
                  onClick={handleEndOrCancel}
                  className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-red-500 shadow-2xl shadow-red-500/60 transition-transform hover:scale-110 active:scale-95"
                >
                  <PhoneOutlined className="rotate-[135deg] text-2xl text-white" />
                </button>

                {/* Speaker */}
                <button
                  onClick={toggleSpeaker}
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    speakerOn
                      ? "bg-white/20 ring-2 ring-white/70 hover:bg-white/30"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  title={speakerOn ? "Turn off speaker" : "Turn on speaker"}
                >
                  <SoundOutlined
                    className={`text-lg ${speakerOn ? "text-white" : "text-white/35"}`}
                  />
                </button>

                {/* Chat toggle — only visible when connected */}
                {phase === "connected" && (
                  <button
                    onClick={() => setChatOpen((v) => !v)}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${
                      chatOpen
                        ? "bg-white/25 ring-2 ring-white/60"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                    title={chatOpen ? "Close chat" : "Open chat"}
                  >
                    <MessageOutlined className="text-lg text-white" />
                    {/* Unread dot — shows when chat is closed and messages exist */}
                    {!chatOpen && messages.length > 0 && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-violet-700 bg-emerald-400" />
                    )}
                  </button>
                )}
              </div>

              <p className="mt-4 text-[11px] font-medium tracking-wider text-white/30 uppercase">
                Audio + Chat · Tap red to end
              </p>

              {/* ── Chat panel slides up from bottom ── */}
              {phase === "connected" && (
                <div
                  className={`-mx-8 mt-5 -mb-8 overflow-hidden border-t transition-all duration-300 ease-in-out ${
                    chatOpen
                      ? "max-h-[320px] border-white/[0.12] opacity-100"
                      : "max-h-0 border-transparent opacity-0"
                  }`}
                >
                  <div
                    ref={chatScrollRef}
                    className="h-44 space-y-3 overflow-y-auto px-4 pt-4 pb-2 text-left"
                    style={{ background: "rgba(0,0,0,0.22)" }}
                  >
                    {messages.length === 0 ? (
                      <p className="pt-8 text-center text-xs text-white/25">
                        Say something to your partner...
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] px-3.5 py-2 text-sm leading-snug shadow-sm ${
                              msg.fromMe
                                ? "rounded-2xl rounded-br-[4px] bg-white font-medium text-gray-800"
                                : "rounded-2xl rounded-bl-[4px] bg-white/[0.15] text-white"
                            }`}
                          >
                            {!msg.fromMe && (
                              <p className="mb-0.5 text-[10px] font-bold text-indigo-300">
                                {msg.senderName}
                              </p>
                            )}
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    className="flex items-center gap-3 border-t border-white/10 px-4 py-3"
                    style={{ background: "rgba(0,0,0,0.28)" }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && chatInput.trim()) {
                          sendMessage(chatInput.trim());
                          setChatInput("");
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          sendMessage(chatInput.trim());
                          setChatInput("");
                        }
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/70 shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-400/80 active:scale-95"
                    >
                      <SendOutlined className="text-sm text-white" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Error / Ended state ── */}
          {phase === "ended" && (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
                {errorMsg ? "⚠️" : "👋"}
              </div>
              <p className="mb-2 text-xl font-bold text-white">
                {errorMsg ? "Oops!" : "Call Ended"}
              </p>
              <p className="mb-6 text-sm text-indigo-200">
                {errorMsg || `Duration: ${formatDuration(duration)}`}
              </p>
              <div className="flex flex-col items-center gap-3">
                {errorMsg?.toLowerCase().includes("username") ||
                errorMsg?.toLowerCase().includes("english level") ? (
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="w-full rounded-xl bg-white px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 no-underline shadow-lg transition-all hover:bg-indigo-50"
                  >
                    Complete Profile →
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      startSearch();
                    }}
                    className="w-full rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
                  >
                    Find New Partner
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/30"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes waveBar {
          from {
            transform: scaleY(0.5);
            opacity: 0.45;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Partners Page
   ══════════════════════════════════════════ */
export default function PartnersPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  const stats = [
    { icon: <TeamOutlined />, value: "10K+", label: "Conversations" },
    { icon: <GlobalOutlined />, value: "50+", label: "Countries" },
    { icon: <StarFilled />, value: "4.9", label: "Avg Rating" },
    { icon: <ClockCircleOutlined />, value: "<5s", label: "Match Time" },
  ];

  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                128 native speakers online now
              </div>
              <h1 className="mb-5 text-4xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-[52px]">
                Practice speaking with{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  native partners
                </span>
              </h1>
              <p className="mb-8 max-w-md text-lg leading-relaxed text-zinc-500">
                One tap to connect with a real English speaker. No scheduling, no awkward silences —
                just genuine conversation that builds your fluency.
              </p>
              <ul className="mb-10 space-y-2.5 text-sm text-zinc-500">
                {[
                  "Instant matching with native speakers from 50+ countries",
                  "Audio-only calls — comfortable, low-pressure practice",
                  "Completely free — no credit card required",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
              >
                <PhoneOutlined className="text-lg" />
                Connect Now — It&apos;s Free
              </button>
            </div>

            {/* Right — iPhone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative h-[520px] w-[260px]">
                <Image
                  src="/iphone-call-mockup.png"
                  alt="SpeakEasy audio call interface"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-zinc-100 bg-zinc-50/60 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mb-1 text-2xl text-indigo-500">{s.icon}</div>
                <p className="text-2xl font-extrabold text-zinc-900">{s.value}</p>
                <p className="text-sm text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                emoji: "👆",
                title: "Press Connect",
                desc: "Tap the button to enter the matching queue.",
              },
              {
                step: "2",
                emoji: "🔗",
                title: "Get Matched",
                desc: "Our system pairs you with a speaker in seconds.",
              },
              {
                step: "3",
                emoji: "🗣️",
                title: "Start Talking",
                desc: "Jump straight into a real English conversation.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-zinc-100 bg-white p-7 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  {s.emoji}
                </div>
                <div className="mb-2 text-3xl font-black text-indigo-600">{s.step}</div>
                <h3 className="mb-1.5 text-base font-bold text-zinc-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-indigo-50/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-zinc-900">
            Built for real practice
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { emoji: "🎧", title: "Audio Only", desc: "No video pressure. Just talk naturally." },
              {
                emoji: "🔒",
                title: "Private & Safe",
                desc: "Encrypted calls. Anonymous matching.",
              },
              { emoji: "⚡", title: "Instant Match", desc: "No scheduling. Connect in under 5s." },
              { emoji: "🌍", title: "Global Network", desc: "Speakers from 50+ countries." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white p-6 text-center shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 text-4xl">{f.emoji}</div>
                <h3 className="mb-1 text-sm font-bold text-zinc-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl">Ready to practice?</h2>
          <p className="mb-8 text-base text-zinc-500">
            Join thousands of learners having real English conversations every day.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            <PhoneOutlined className="text-lg" />
            Start a Free Call
          </button>
        </div>
      </section>

      {/* ── Audio Call Modal ── */}
      <AudioCallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
