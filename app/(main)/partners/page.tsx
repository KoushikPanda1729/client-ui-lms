"use client";

import React, { useEffect, useRef } from "react";
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
    audioBlocked,
    startSearch,
    cancelSearch,
    endCall,
    toggleMute,
    resumeAudio,
    setRemoteAudioEl,
  } = useAudioCall();

  // Hidden audio element for remote audio output
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    setRemoteAudioEl(audioRef.current);
  }, [setRemoteAudioEl]);

  // Start searching when modal opens
  useEffect(() => {
    if (open) {
      startSearch();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* hidden remote audio */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />

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
              <div className="mb-2 flex items-center justify-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${phase === "connected" ? "animate-pulse bg-emerald-400" : "bg-yellow-400"}`}
                />
                <p className="text-sm font-medium text-indigo-200">
                  {phase === "connected" ? "Connected" : "Connecting..."}
                </p>
              </div>

              {/* Partner avatar */}
              <div className="relative mx-auto mb-4 h-24 w-24">
                {partner.avatarUrl ? (
                  <Image
                    src={partner.avatarUrl}
                    alt={partner.displayName}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur-sm">
                    👤
                  </div>
                )}
                {phase === "connected" && (
                  <span className="absolute right-1 bottom-1 h-4 w-4 rounded-full border-2 border-indigo-700 bg-emerald-400" />
                )}
              </div>

              <p className="mb-1 text-xl font-bold text-white">{partner.displayName}</p>
              {partner.level && (
                <p className="mb-1 text-sm text-indigo-200 capitalize">{partner.level} level</p>
              )}

              {/* Timer */}
              {phase === "connected" && (
                <div className="mt-2 mb-6 inline-flex items-center rounded-full bg-white/10 px-5 py-1.5">
                  <span className="font-mono text-lg font-bold tracking-widest text-white">
                    {formatDuration(duration)}
                  </span>
                </div>
              )}

              {/* Waveform (visual only) */}
              {phase === "connected" && (
                <div className="mb-6 flex h-8 items-end justify-center gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-white/50"
                      style={{
                        height: `${20 + Math.sin(i * 0.8) * 10}px`,
                        animation: `waveBar 1.2s ease-in-out ${(i * 0.05) % 0.6}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={toggleMute}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30"
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <AudioMutedOutlined className="text-lg text-white" />
                  ) : (
                    <AudioOutlined className="text-lg text-white" />
                  )}
                </button>

                <button
                  onClick={handleEndOrCancel}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/40 transition-transform hover:scale-110 active:scale-95"
                >
                  <PhoneOutlined className="rotate-[135deg] text-2xl text-white" />
                </button>

                <button
                  onClick={resumeAudio}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all hover:bg-white/30 ${audioBlocked ? "animate-pulse bg-amber-400/40" : "bg-white/20"}`}
                  title="Play audio"
                >
                  <SoundOutlined className="text-lg text-white" />
                </button>
              </div>

              {audioBlocked && <p className="mt-3 text-xs text-amber-300">Tap 🔊 to hear audio</p>}

              <p className="mt-4 text-xs text-indigo-300">Audio only · Tap red to end</p>
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
            opacity: 0.4;
          }
          to {
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
