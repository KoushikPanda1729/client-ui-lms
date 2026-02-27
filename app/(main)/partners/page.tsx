"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import {
  AudioOutlined,
  AudioMutedOutlined,
  MessageOutlined,
  PhoneOutlined,
  StarFilled,
  GlobalOutlined,
  TeamOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";

/* ══════════════════════════════════════════
   Partner pool
   ══════════════════════════════════════════ */
const partnerPool = [
  {
    id: "1",
    name: "Emma Williams",
    avatar: "👩‍🏫",
    country: "United States",
    flag: "🇺🇸",
    rating: 4.9,
    sessions: 342,
    specialty: "Conversation",
  },
  {
    id: "2",
    name: "James Anderson",
    avatar: "👨‍💼",
    country: "United Kingdom",
    flag: "🇬🇧",
    rating: 4.8,
    sessions: 567,
    specialty: "Business",
  },
  {
    id: "3",
    name: "Sophia Martin",
    avatar: "👩‍🎓",
    country: "Australia",
    flag: "🇦🇺",
    rating: 4.9,
    sessions: 198,
    specialty: "IELTS Prep",
  },
  {
    id: "4",
    name: "Daniel Thompson",
    avatar: "👨‍💻",
    country: "Canada",
    flag: "🇨🇦",
    rating: 4.7,
    sessions: 412,
    specialty: "Tech English",
  },
  {
    id: "5",
    name: "Olivia Davis",
    avatar: "👩‍🔬",
    country: "Ireland",
    flag: "🇮🇪",
    rating: 4.8,
    sessions: 289,
    specialty: "Academic",
  },
  {
    id: "6",
    name: "Liam Harrison",
    avatar: "🧑‍🏫",
    country: "New Zealand",
    flag: "🇳🇿",
    rating: 4.6,
    sessions: 156,
    specialty: "Pronunciation",
  },
];
type PartnerType = (typeof partnerPool)[0];
type CallState = "idle" | "searching" | "connected";

/* ══════════════════════════════════════════
   Audio Call Modal
   ══════════════════════════════════════════ */
function AudioCallModal({
  state,
  partner,
  onClose,
  duration,
  isMuted,
  onToggleMute,
}: {
  state: CallState;
  partner: PartnerType | null;
  onClose: () => void;
  duration: number;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Modal
      open={state !== "idle"}
      footer={null}
      closable={false}
      centered
      width={420}
      styles={{ body: { padding: 0 } }}
    >
      {state === "searching" && (
        <div className="flex flex-col items-center bg-gradient-to-b from-indigo-600 to-violet-700 px-8 py-14 text-center">
          <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-white/15 [animation-duration:2s]" />
            <div className="absolute h-[85%] w-[85%] animate-ping rounded-full bg-white/15 [animation-delay:0.4s] [animation-duration:2s]" />
            <div className="absolute h-[70%] w-[70%] animate-ping rounded-full bg-white/15 [animation-delay:0.8s] [animation-duration:2s]" />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl shadow-lg backdrop-blur-sm">
              🎧
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">Finding a partner…</h3>
          <p className="mb-6 text-sm text-indigo-200">
            Matching you with an available native speaker
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-white/60"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      )}

      {state === "connected" && partner && (
        <div className="flex flex-col items-center bg-gradient-to-b from-indigo-600 to-violet-700 px-8 py-10 text-center">
          <div className="relative mb-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl shadow-xl backdrop-blur-sm">
              {partner.avatar}
            </div>
            <div className="absolute -right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-600 bg-emerald-500 shadow-lg">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            </div>
          </div>
          <h3 className="mb-0.5 text-xl font-bold text-white">{partner.name}</h3>
          <p className="mb-1 text-sm text-indigo-200">
            {partner.country} {partner.flag}
          </p>
          <div className="mb-5 flex items-center gap-1 text-xs text-indigo-200">
            <StarFilled className="text-amber-400" />{" "}
            <span className="font-semibold text-white">{partner.rating}</span>{" "}
            <span>· {partner.sessions} sessions</span>
          </div>
          <div className="mb-6 rounded-full bg-white/10 px-5 py-2 backdrop-blur-sm">
            <span className="font-mono text-2xl font-bold tracking-wider text-white">
              {fmt(duration)}
            </span>
          </div>
          <div className="mb-8 flex items-end justify-center gap-[3px]">
            {[18, 28, 14, 32, 20, 26, 16, 34, 22, 30, 12, 36, 24, 19, 28, 15, 33, 21, 27, 17].map(
              (h, i) => (
                <div
                  key={i}
                  className="w-[3px] animate-pulse rounded-full bg-white/50"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${0.4 + (i % 5) * 0.12}s`,
                  }}
                />
              ),
            )}
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onToggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg shadow-lg transition-all ${isMuted ? "bg-red-500/30 text-white hover:bg-red-500/40" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              {isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-xl text-white shadow-xl shadow-red-500/30 transition-all hover:scale-110 hover:bg-red-600"
            >
              <PhoneOutlined className="rotate-[135deg]" />
            </button>
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg text-white shadow-lg transition-all hover:bg-white/30"
            >
              <MessageOutlined />
            </button>
          </div>
          <p className="mt-5 text-xs text-indigo-200">Audio only · Tap the red button to end</p>
        </div>
      )}
    </Modal>
  );
}

/* ══════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════ */
export default function PartnersPage() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callPartner, setCallPartner] = useState<PartnerType | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRandomCall = () => {
    setCallState("searching");
    setCallDuration(0);
    setIsMuted(false);
    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      const p = partnerPool[Math.floor(Math.random() * partnerPool.length)];
      setCallPartner(p);
      setCallState("connected");
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }, delay);
  };

  const endCall = () => {
    setCallState("idle");
    setCallPartner(null);
    setCallDuration(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Hero section */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left — text */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                128 native speakers online now
              </div>

              <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-[44px] lg:leading-[1.1]">
                Practice speaking with <span className="gradient-text">native partners</span>
              </h1>
              <p className="mb-8 max-w-md text-base leading-relaxed text-zinc-500">
                One tap to connect with a real English speaker. No scheduling, no awkward silences —
                just genuine conversation that builds your fluency.
              </p>

              {/* Trust points */}
              <div className="mb-8 space-y-2.5">
                {[
                  "Instant matching with native speakers from 50+ countries",
                  "Audio-only calls — comfortable, low-pressure practice",
                  "Completely free — no credit card required",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-sm text-zinc-600">
                    <CheckCircleFilled className="text-emerald-500" />
                    {t}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={startRandomCall}
                className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <PhoneOutlined className="text-lg" />
                </div>
                Connect Now — It&apos;s Free
              </button>
            </div>

            {/* Right — iPhone mockup with call interface */}
            <div className="relative mx-auto w-full max-w-[280px] lg:mx-0 lg:ml-auto">
              {/* iPhone frame */}
              <div className="relative rounded-[44px] border-[6px] border-zinc-900 bg-zinc-900 p-1 shadow-2xl shadow-zinc-900/30">
                {/* Screen */}
                <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-b from-indigo-600 via-violet-600 to-purple-800">
                  {/* Dynamic Island */}
                  <div className="mx-auto mt-2.5 mb-3 h-[22px] w-[90px] rounded-full bg-black" />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-7 pb-3 text-[10px] font-semibold text-white/70">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      {/* Signal bars */}
                      <div className="flex items-end gap-[2px]">
                        <div className="h-[5px] w-[3px] rounded-sm bg-white/70" />
                        <div className="h-[7px] w-[3px] rounded-sm bg-white/70" />
                        <div className="h-[9px] w-[3px] rounded-sm bg-white/70" />
                        <div className="h-[11px] w-[3px] rounded-sm bg-white/40" />
                      </div>
                      <span className="ml-1">5G</span>
                      {/* Battery */}
                      <div className="ml-1 flex h-[10px] w-[20px] items-center rounded-sm border border-white/50 px-[2px]">
                        <div className="h-[6px] w-[12px] rounded-sm bg-emerald-400" />
                      </div>
                    </div>
                  </div>

                  {/* Call content */}
                  <div className="flex flex-col items-center px-6 py-4">
                    {/* Connected indicator */}
                    <div className="mb-4 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 backdrop-blur-sm">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-300">Connected</span>
                    </div>

                    {/* Caller avatar */}
                    <div className="relative mb-4">
                      <div className="absolute -inset-2 animate-pulse rounded-full border-2 border-white/15 [animation-duration:2s]" />
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-4xl shadow-xl backdrop-blur-sm">
                        👩‍�
                      </div>
                      <div className="absolute -right-0.5 bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-indigo-600 bg-emerald-400 shadow-md">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* Caller info */}
                    <h3 className="mb-0.5 text-lg font-bold text-white">Emma Williams</h3>
                    <p className="mb-1 text-xs text-indigo-200">🇺🇸 United States</p>
                    <div className="mb-4 flex items-center gap-1 text-[11px] text-indigo-200">
                      <StarFilled className="text-[10px] text-amber-400" />
                      <span className="font-semibold text-white">4.9</span>
                      <span>· 342 sessions</span>
                    </div>

                    {/* Timer */}
                    <div className="mb-5 rounded-full bg-white/10 px-5 py-1.5 backdrop-blur-sm">
                      <span className="font-mono text-xl font-bold tracking-widest text-white">
                        04:32
                      </span>
                    </div>

                    {/* Audio waveform */}
                    <div className="mb-6 flex items-end justify-center gap-[3px]">
                      {[
                        14, 22, 10, 26, 16, 20, 12, 28, 18, 24, 10, 30, 20, 14, 22, 12, 26, 16, 22,
                        14,
                      ].map((h, i) => (
                        <div
                          key={i}
                          className="w-[2.5px] animate-pulse rounded-full bg-white/40"
                          style={{
                            height: `${h}px`,
                            animationDelay: `${i * 0.08}s`,
                            animationDuration: `${0.4 + (i % 5) * 0.12}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                      >
                        <AudioOutlined className="text-base" />
                      </button>
                      <button
                        type="button"
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-lg text-white shadow-lg shadow-red-500/40 transition-transform hover:scale-105"
                      >
                        <PhoneOutlined className="rotate-[135deg]" />
                      </button>
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                      >
                        <MessageOutlined className="text-base" />
                      </button>
                    </div>

                    {/* Bottom hint */}
                    <p className="mt-4 text-[10px] text-indigo-200/60">
                      Audio only · Tap red to end
                    </p>
                  </div>

                  {/* Home indicator bar */}
                  <div className="mx-auto mt-1 mb-2 h-[4px] w-28 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                icon: <TeamOutlined className="text-indigo-500" />,
                value: "10K+",
                label: "Conversations completed",
              },
              {
                icon: <GlobalOutlined className="text-violet-500" />,
                value: "50+",
                label: "Countries represented",
              },
              {
                icon: <StarFilled className="text-amber-400" />,
                value: "4.9",
                label: "Average speaker rating",
              },
              {
                icon: <ClockCircleOutlined className="text-emerald-500" />,
                value: "<5s",
                label: "Average match time",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-lg">
                  {s.icon}
                </div>
                <div>
                  <div className="text-xl font-bold text-zinc-900">{s.value}</div>
                  <div className="text-xs text-zinc-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-bold text-zinc-900 sm:text-3xl">How it works</h2>
          <p className="text-base text-zinc-500">Three simple steps to your first conversation</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              num: "1",
              color: "text-indigo-600",
              bg: "from-indigo-50 to-violet-50",
              emoji: "👆",
              title: "Press Connect",
              desc: "Hit the connect button and our system instantly starts finding a partner for you.",
            },
            {
              num: "2",
              color: "text-violet-600",
              bg: "from-violet-50 to-purple-50",
              emoji: "🎧",
              title: "Get Matched",
              desc: "Within seconds, you're connected with a native English speaker via audio call.",
            },
            {
              num: "3",
              color: "text-purple-600",
              bg: "from-purple-50 to-pink-50",
              emoji: "💬",
              title: "Start Talking",
              desc: "Practice freely — discuss any topic, ask for feedback, and build your confidence.",
            },
          ].map((s) => (
            <div
              key={s.num}
              className="rounded-2xl border border-zinc-100 bg-white p-6 text-center shadow-sm"
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.bg}`}
              >
                <span className="text-3xl">{s.emoji}</span>
              </div>
              <div className={`mb-2 text-3xl font-black ${s.color}`}>{s.num}</div>
              <h3 className="mb-2 text-base font-bold text-zinc-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features section */}
      <div className="border-y border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                emoji: "🎧",
                title: "Audio Only",
                desc: "No video, no pressure. Just comfortable conversation practice.",
                color: "from-indigo-50 to-indigo-100",
              },
              {
                emoji: "🔒",
                title: "Private & Safe",
                desc: "Anonymous audio calls with reporting tools. Your safety is our priority.",
                color: "from-emerald-50 to-emerald-100",
              },
              {
                emoji: "⚡",
                title: "Instant Match",
                desc: "Get connected in under 5 seconds. No scheduling or waiting around.",
                color: "from-amber-50 to-amber-100",
              },
              {
                emoji: "🌍",
                title: "Global Network",
                desc: "Native speakers from US, UK, Australia, Canada, and 50+ more countries.",
                color: "from-violet-50 to-violet-100",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color}`}
                >
                  <span className="text-2xl">{f.emoji}</span>
                </div>
                <h3 className="mb-2 text-sm font-bold text-zinc-900">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="flex flex-col items-center gap-8 px-8 py-14 text-center md:flex-row md:px-14 md:text-left">
            <div className="flex-1">
              <h3 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Ready to practice?</h3>
              <p className="max-w-md text-sm text-indigo-100">
                Your first conversation is completely free. Connect with a native speaker right now
                and start improving your English today.
              </p>
            </div>
            <button
              type="button"
              onClick={startRandomCall}
              className="flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-[15px] font-bold text-indigo-600 shadow-xl transition-all hover:scale-[1.03] hover:shadow-2xl"
            >
              <PhoneOutlined className="text-lg" />
              Start Free Call
            </button>
          </div>
        </div>
      </div>

      {/* Audio Call Modal */}
      <AudioCallModal
        state={callState}
        partner={callPartner}
        onClose={endCall}
        duration={callDuration}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((m) => !m)}
      />
    </div>
  );
}
