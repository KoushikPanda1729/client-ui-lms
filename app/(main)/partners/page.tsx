"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AudioOutlined,
  AudioMutedOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  SoundOutlined,
  SendOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CloseOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useAudioCall } from "@/hooks/useAudioCall";
import { useCall } from "@/contexts/CallContext";
import { sessionService } from "@/lib/services/session";

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
   Audio Call Modal — WhatsApp-style full screen
   ══════════════════════════════════════════ */
function AudioCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    phase,
    partner,
    errorMsg,
    muted,
    duration,
    messages,
    isPartnerTyping,
    speakerOn,
    videoEnabled,
    remoteVideoEnabled,
    isPartnerMuted,
    localVideoStreamRef,
    remoteVideoStreamRef,
    lastRoomId,
    startSearch,
    cancelSearch,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    sendMessage,
    sendTyping,
  } = useAudioCall();

  // ── Review state ────────────────────────────────────────────────────────────
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // When a call ends (lastRoomId set), look up the session ID for rating
  useEffect(() => {
    if (!lastRoomId) return;
    setReviewDone(false);
    setReviewStars(0);
    setReviewFeedback("");
    setReviewSessionId(null);
    sessionService
      .getByRoom(lastRoomId)
      .then((s) => {
        // Only show review prompt if the session actually ended
        if (s.endedAt) setReviewSessionId(s.id);
        else {
          // Poll once more after a short delay — server may still be marking ended
          setTimeout(() => {
            sessionService
              .getByRoom(lastRoomId)
              .then((s2) => {
                if (s2.endedAt) setReviewSessionId(s2.id);
              })
              .catch(() => {});
          }, 2000);
        }
      })
      .catch(() => {});
  }, [lastRoomId]);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewSessionId || reviewStars === 0) return;
    setReviewLoading(true);
    try {
      await sessionService.rate(reviewSessionId, reviewStars, reviewFeedback || undefined);
    } catch {
      // silent — don't block user
    } finally {
      setReviewLoading(false);
      setReviewDone(true);
    }
  }, [reviewSessionId, reviewStars, reviewFeedback]);

  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypingInput = useCallback(
    (value: string) => {
      setChatInput(value);
      if (value.length > 0) {
        sendTyping(true);
        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = setTimeout(() => sendTyping(false), 1500);
      } else {
        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
        sendTyping(false);
      }
    },
    [sendTyping],
  );

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    sendTyping(false);
  }, [chatInput, sendMessage, sendTyping]);
  const [videoRequestDismissed, setVideoRequestDismissed] = useState(false);
  const [prevRemoteVideoEnabled, setPrevRemoteVideoEnabled] = useState(false);
  // swapped: when true, local feed is the BG and remote feed is the PiP
  const [swapped, setSwapped] = useState(false);
  // null = default top-right corner; {x,y} = dragged absolute position
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);

  // During-render derived state update (React docs recommended pattern — no effect needed)
  // When partner freshly enables camera, reset the dismissed flag
  if (prevRemoteVideoEnabled !== remoteVideoEnabled) {
    setPrevRemoteVideoEnabled(remoteVideoEnabled);
    if (remoteVideoEnabled) setVideoRequestDismissed(false);
  }
  // Tracks whether both peers were simultaneously on video (used for auto-sync)
  const wasInMutualVideoRef = useRef(false);

  // Auto-sync: once both were on video, if remote turns off → auto turn off local too
  useEffect(() => {
    if (videoEnabled && remoteVideoEnabled) {
      wasInMutualVideoRef.current = true;
    } else if (
      wasInMutualVideoRef.current &&
      !remoteVideoEnabled &&
      videoEnabled &&
      phase === "connected"
    ) {
      wasInMutualVideoRef.current = false;
      toggleVideo();
    } else if (!videoEnabled && !remoteVideoEnabled) {
      wasInMutualVideoRef.current = false;
    }
  }, [videoEnabled, remoteVideoEnabled, phase, toggleVideo]);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pipDragState = useRef<{
    startPointerX: number;
    startPointerY: number;
    startElemX: number;
    startElemY: number;
    moved: boolean;
  } | null>(null);

  // Start searching when modal opens
  useEffect(() => {
    if (open) startSearch();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current && chatOpen) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isPartnerTyping, chatOpen]);

  // Sync video streams → elements (swap-aware)
  // PiP slot (localVideoRef):  local stream normally, remote stream when swapped
  // BG  slot (remoteVideoRef): remote stream normally, local stream when swapped
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = swapped
        ? remoteVideoEnabled
          ? remoteVideoStreamRef.current
          : null
        : videoEnabled
          ? localVideoStreamRef.current
          : null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = swapped
        ? videoEnabled
          ? localVideoStreamRef.current
          : null
        : remoteVideoEnabled
          ? remoteVideoStreamRef.current
          : null;
    }
  }, [videoEnabled, remoteVideoEnabled, localVideoStreamRef, remoteVideoStreamRef, swapped]);

  const handleEndOrCancel = () => {
    if (phase === "searching" || phase === "matched") {
      cancelSearch();
      onClose();
    } else if (phase === "connected") {
      // endCall will set phase → "ended" so the review modal shows inside the overlay
      endCall();
    } else {
      endCall();
      onClose();
    }
  };

  if (!open) return null;

  const isReconnecting = phase === "reconnecting";
  // Only stay in video layout when BOTH sides have video — if either turns off, switch to audio UI
  const showVideo = (phase === "connected" || isReconnecting) && videoEnabled && remoteVideoEnabled;
  // Show unread dot only when partner sent a message and chat is closed
  const hasUnread = !chatOpen && messages.some((m) => !m.fromMe);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg,#16163a 0%,#0a0a18 55%,#0c0c20 100%)" }}
    >
      {/* ══ SEARCHING ══ */}
      {(phase === "idle" || phase === "searching" || phase === "matched") && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          {/* Pulsing search orb */}
          <div className="relative flex h-36 w-36 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/15 [animation-duration:2s]" />
            <span className="absolute inset-3 animate-ping rounded-full bg-indigo-500/10 [animation-delay:0.5s] [animation-duration:2s]" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-5xl ring-1 ring-white/15 backdrop-blur-sm">
              🔍
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-white">
              {phase === "matched" ? "Connecting..." : "Finding Partner"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/40">
              {phase === "matched"
                ? "Match found! Setting up the call..."
                : "Matching you with a native English speaker"}
            </p>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-white/30"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>

          <button
            onClick={handleEndOrCancel}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-2xl shadow-red-500/40 transition-transform hover:scale-105 active:scale-95"
          >
            <PhoneOutlined className="rotate-[135deg] text-2xl text-white" />
          </button>
          <p className="text-xs text-white/30">Tap to cancel</p>
        </div>
      )}

      {/* ══ CONNECTING / CONNECTED / RECONNECTING ══ */}
      {(phase === "connecting" || phase === "connected" || phase === "reconnecting") && partner && (
        <div ref={containerRef} className="absolute inset-0">
          {/* ── Layer 0: full-screen background ── */}
          {showVideo ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full bg-black object-cover"
              />
              {(swapped ? !videoEnabled : !remoteVideoEnabled) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  {partner.avatarUrl ? (
                    <Image
                      src={partner.avatarUrl}
                      alt={partner.displayName}
                      width={96}
                      height={96}
                      className="mb-2 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-5xl">
                      👤
                    </div>
                  )}
                  <p className="text-sm text-white/40">Camera off</p>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
              <div className="relative h-44 w-44">
                {(phase === "connected" || isReconnecting) && (
                  <>
                    <span className="absolute -inset-5 animate-ping rounded-full bg-indigo-500/10 [animation-duration:3s]" />
                    <span className="absolute -inset-2.5 animate-ping rounded-full bg-indigo-500/15 [animation-delay:0.6s] [animation-duration:2.5s]" />
                  </>
                )}
                <div className="relative h-full w-full overflow-hidden rounded-full bg-white/10 shadow-2xl ring-[3px] shadow-indigo-900/40 ring-white/20">
                  {partner.avatarUrl ? (
                    <Image
                      src={partner.avatarUrl}
                      alt={partner.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl">
                      👤
                    </div>
                  )}
                </div>
                {/* Online dot */}
                {phase === "connected" && !isReconnecting && !isPartnerMuted && (
                  <span className="absolute right-2.5 bottom-2.5 h-5 w-5 rounded-full border-[3px] border-[#0a0a18] bg-emerald-400 shadow-lg shadow-emerald-500/50" />
                )}
              </div>
              {/* Waveform — hidden when muted */}
              {phase === "connected" && !isReconnecting && !isPartnerMuted && (
                <div className="flex h-10 items-end justify-center gap-0.75">
                  {Array.from({ length: 26 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-0.75 rounded-full"
                      style={{
                        height: `${12 + Math.sin(i * 0.75) * 10}px`,
                        background: `rgba(255,255,255,${0.18 + Math.sin(i * 0.5) * 0.15})`,
                        animation: `waveBar 1.4s ease-in-out ${(i * 0.055) % 0.7}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Muted pill — shown below avatar when partner is muted */}
              {phase === "connected" && !isReconnecting && isPartnerMuted && (
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <AudioMutedOutlined style={{ color: "white", fontSize: 14 }} />
                  <span className="text-sm font-medium text-white/70">
                    {partner.displayName} muted this call
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Layer 1: top info ── */}
          <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 bg-linear-to-b from-black/70 via-black/25 to-transparent px-4 pt-8 pb-16 text-center">
            {/* Status pill */}
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 ring-1 ring-white/10 backdrop-blur-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  phase === "connected"
                    ? "animate-pulse bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]"
                    : phase === "reconnecting"
                      ? "animate-pulse bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.7)]"
                      : "bg-yellow-400"
                }`}
              />
              <span className="text-[10px] font-semibold tracking-widest text-white/70 uppercase">
                {phase === "connected"
                  ? "Connected"
                  : phase === "reconnecting"
                    ? "Reconnecting..."
                    : "Connecting..."}
              </span>
            </div>
            {/* Name */}
            <p className="text-xl leading-tight font-bold text-white drop-shadow-lg sm:text-2xl">
              {partner.displayName}
            </p>
            {partner.level && (
              <p className="mt-0.5 text-xs text-white/50 capitalize">{partner.level} Level</p>
            )}
            {/* Timer */}
            {phase === "connected" && !isReconnecting && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-1 ring-1 ring-white/10 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>

          {/* ── Layer 2: PiP – draggable + tap to swap ── */}
          {showVideo && (swapped ? remoteVideoEnabled : videoEnabled) && (
            <div
              className="absolute z-30 h-36 w-24 cursor-pointer touch-none overflow-hidden rounded-2xl border border-white/25 shadow-2xl ring-1 ring-black/20 select-none sm:h-44 sm:w-32"
              style={pipPos ? { left: pipPos.x, top: pipPos.y } : { top: 80, right: 16 }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const PIP_W = 96;
                pipDragState.current = {
                  startPointerX: e.clientX,
                  startPointerY: e.clientY,
                  startElemX: pipPos?.x ?? rect.width - PIP_W - 16,
                  startElemY: pipPos?.y ?? 80,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                const s = pipDragState.current;
                if (!s) return;
                const dx = e.clientX - s.startPointerX;
                const dy = e.clientY - s.startPointerY;
                if (!s.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) s.moved = true;
                if (!s.moved) return;
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const PIP_W = 96,
                  PIP_H = 144;
                setPipPos({
                  x: Math.max(8, Math.min(s.startElemX + dx, rect.width - PIP_W - 8)),
                  y: Math.max(8, Math.min(s.startElemY + dy, rect.height - PIP_H - 8)),
                });
              }}
              onPointerUp={() => {
                const s = pipDragState.current;
                pipDragState.current = null;
                if (s && !s.moved) setSwapped((v) => !v);
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Tap-to-swap hint */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/0 opacity-0 transition-all duration-200 hover:bg-black/35 hover:opacity-100">
                <span className="text-lg text-white drop-shadow">⇄</span>
                <span className="text-[9px] font-semibold tracking-wide text-white/80 uppercase">
                  Swap
                </span>
              </div>
            </div>
          )}

          {/* ── Layer 3: video-request card ── */}
          {(phase === "connected" || isReconnecting) &&
            remoteVideoEnabled &&
            !videoEnabled &&
            !videoRequestDismissed && (
              <div
                className="pointer-events-auto absolute top-1/2 left-1/2 z-40 w-72 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl backdrop-blur-xl"
                style={{
                  background: "rgba(15,15,35,0.92)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <VideoCameraOutlined className="text-base text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{partner?.displayName}</p>
                    <p className="text-xs text-white/45">wants to switch to video</p>
                  </div>
                </div>
                <div className="flex border-t border-white/10">
                  <button
                    onClick={() => setVideoRequestDismissed(true)}
                    className="flex flex-1 items-center justify-center border-r border-white/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-white/5 active:scale-95"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      toggleVideo();
                      setVideoRequestDismissed(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-white/5 active:scale-95"
                  >
                    <VideoCameraOutlined className="text-sm" /> Accept
                  </button>
                </div>
              </div>
            )}

          {/* ── Layer 4: chat sidebar (slides in from right) ── */}
          {(phase === "connected" || isReconnecting) && (
            <>
              {/* Backdrop dim on mobile */}
              {chatOpen && (
                <div
                  className="pointer-events-auto absolute inset-0 z-30 bg-black/40 sm:hidden"
                  onClick={() => setChatOpen(false)}
                />
              )}

              <div
                className={`pointer-events-auto absolute top-0 right-0 bottom-0 z-40 flex w-[78vw] max-w-xs flex-col transition-transform duration-300 ease-in-out sm:w-80 ${chatOpen ? "translate-x-0" : "translate-x-full"}`}
                style={{
                  background: "rgba(6,6,20,0.88)",
                  backdropFilter: "blur(24px)",
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20">
                      <MessageOutlined className="text-xs text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm leading-none font-semibold text-white">In-call Chat</p>
                      {partner && (
                        <p className="mt-0.5 text-[10px] text-white/35">{partner.displayName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 transition hover:bg-white/15 active:scale-90"
                  >
                    <CloseOutlined className="text-xs text-white/60" />
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-2xl">
                        💬
                      </div>
                      <p className="text-xs leading-relaxed text-white/30">
                        No messages yet.
                        <br />
                        Say something to your partner!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-0.5 ${msg.fromMe ? "items-end" : "items-start"}`}
                      >
                        {!msg.fromMe && (
                          <p className="ml-1 text-[10px] font-semibold text-indigo-300">
                            {msg.senderName}
                          </p>
                        )}
                        <div
                          className={`max-w-[88%] px-3.5 py-2 text-sm leading-snug ${
                            msg.fromMe
                              ? "rounded-2xl rounded-br-sm bg-indigo-500 font-medium text-white"
                              : "rounded-2xl rounded-bl-sm bg-white/12 text-white"
                          }`}
                        >
                          <p>{msg.text}</p>
                          {msg.fromMe && (
                            <div className="mt-0.5 flex items-center justify-end gap-0.5">
                              {msg.status === "delivered" ? (
                                /* Double tick — delivered */
                                <svg
                                  width="16"
                                  height="9"
                                  viewBox="0 0 16 9"
                                  fill="none"
                                  className="text-white/80"
                                >
                                  <path
                                    d="M1 4.5L3.8 7L9 1"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5 4.5L7.8 7L13 1"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                /* Single tick — sent */
                                <svg
                                  width="10"
                                  height="9"
                                  viewBox="0 0 10 9"
                                  fill="none"
                                  className="text-white/50"
                                >
                                  <path
                                    d="M1 4.5L3.8 7L9 1"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Typing indicator */}
                {isPartnerTyping && (
                  <div className="flex items-start px-4 pb-1">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/12 px-3.5 py-2.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
                          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="shrink-0 border-t border-white/10 px-3 py-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/8 px-4 py-2.5 ring-1 ring-white/10 transition focus-within:ring-indigo-500/50">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => handleTypingInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      onClick={handleSend}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 transition hover:bg-indigo-400 active:scale-90 disabled:opacity-40"
                      disabled={!chatInput.trim()}
                    >
                      <SendOutlined className="text-xs text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Layer 4b: Reconnecting overlay ── */}
          {isReconnecting && (
            <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20 ring-2 ring-yellow-400/40">
                <svg
                  className="h-8 w-8 animate-spin text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">Reconnecting...</p>
                <p className="mt-1 text-xs text-white/50">Network issue detected. Please wait.</p>
              </div>
            </div>
          )}

          {/* ── Layer 5: bottom control bar ── */}
          <div className="absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/70 via-black/25 to-transparent px-4 pt-20 pb-8">
            <div className="mx-auto flex w-full max-w-sm items-center justify-between gap-2 rounded-2xl bg-black/50 px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl sm:max-w-md sm:gap-3 sm:px-6">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className="flex flex-col items-center gap-1 transition active:scale-90"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all sm:h-13 sm:w-13 ${muted ? "bg-white shadow-lg" : "bg-white/15 hover:bg-white/25"}`}
                >
                  {muted ? (
                    <AudioMutedOutlined className="text-lg text-zinc-800" />
                  ) : (
                    <AudioOutlined className="text-lg text-white" />
                  )}
                </div>
                <span className="text-[9px] font-medium text-white/50">
                  {muted ? "Unmute" : "Mute"}
                </span>
              </button>

              {/* Video */}
              {(phase === "connected" || isReconnecting) && (
                <button
                  onClick={() => {
                    // If turning OFF our own video, suppress the "wants to switch" card
                    // so it doesn't immediately reappear just because partner is still on video
                    if (videoEnabled) setVideoRequestDismissed(true);
                    toggleVideo();
                  }}
                  disabled={isReconnecting}
                  className="flex flex-col items-center gap-1 transition active:scale-90 disabled:opacity-50"
                >
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all sm:h-13 sm:w-13 ${videoEnabled ? "bg-white shadow-lg" : "bg-white/15 hover:bg-white/25"}`}
                  >
                    <VideoCameraOutlined
                      className={`text-lg ${videoEnabled ? "text-zinc-800" : "text-white"}`}
                    />
                    {remoteVideoEnabled && !videoEnabled && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-black/50 bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-white/50">
                    {videoEnabled ? "Video Off" : "Camera"}
                  </span>
                </button>
              )}

              {/* End Call — prominent centre */}
              <button
                onClick={handleEndOrCancel}
                className="flex flex-col items-center gap-1 transition active:scale-90"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/40 transition-transform hover:scale-105 sm:h-15 sm:w-15">
                  <PhoneOutlined className="rotate-135 text-xl text-white" />
                </div>
                <span className="text-[9px] font-medium text-white/40">End</span>
              </button>

              {/* Chat */}
              {(phase === "connected" || isReconnecting) && (
                <button
                  onClick={() => setChatOpen((v) => !v)}
                  className="flex flex-col items-center gap-1 transition active:scale-90"
                >
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all sm:h-13 sm:w-13 ${chatOpen ? "bg-white shadow-lg" : "bg-white/15 hover:bg-white/25"}`}
                  >
                    <MessageOutlined
                      className={`text-lg ${chatOpen ? "text-zinc-800" : "text-white"}`}
                    />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black/50 bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-white/50">
                    {chatOpen ? "Close" : "Chat"}
                  </span>
                </button>
              )}

              {/* Speaker */}
              <button
                onClick={toggleSpeaker}
                className="flex flex-col items-center gap-1 transition active:scale-90"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all sm:h-13 sm:w-13 ${speakerOn ? "bg-white shadow-lg" : "bg-white/15 hover:bg-white/25"}`}
                >
                  <SoundOutlined
                    className={`text-lg ${speakerOn ? "text-zinc-800" : "text-white"}`}
                  />
                </div>
                <span className="text-[9px] font-medium text-white/50">Speaker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ENDED ══ */}
      {phase === "ended" && (
        <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-5xl">
            {errorMsg ? "⚠️" : "👋"}
          </div>
          <p className="mb-2 text-2xl font-bold text-white">{errorMsg ? "Oops!" : "Call Ended"}</p>
          <p className="mb-8 text-sm leading-relaxed text-white/50">
            {errorMsg || `Duration: ${formatDuration(duration)}`}
          </p>
          <div className="flex w-full max-w-xs flex-col gap-3">
            {errorMsg?.toLowerCase().includes("username") ||
            errorMsg?.toLowerCase().includes("english level") ? (
              <Link
                href="/settings"
                onClick={onClose}
                className="w-full rounded-2xl bg-white px-6 py-3 text-center text-sm font-semibold text-indigo-700 no-underline shadow-lg transition hover:bg-indigo-50"
              >
                Complete Profile →
              </Link>
            ) : (
              <button
                onClick={() => startSearch()}
                className="w-full rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
              >
                Find New Partner
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Close
            </button>
          </div>

          {/* ── Review overlay (shows on top when session is ready) ── */}
          {reviewSessionId && !reviewDone && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
              <div
                className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
                style={{
                  background: "rgba(15,15,35,0.97)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <p className="mb-1 text-lg font-bold text-white">Rate your session</p>
                <p className="mb-5 text-xs text-white/40">How was your conversation partner?</p>

                {/* Stars */}
                <div className="mb-5 flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setReviewStars(n)}
                      className="transition-transform active:scale-90"
                    >
                      <StarFilled
                        style={{
                          fontSize: 32,
                          color: n <= reviewStars ? "#facc15" : "rgba(255,255,255,0.15)",
                          transition: "color 0.15s",
                        }}
                      />
                    </button>
                  ))}
                </div>

                {/* Feedback textarea */}
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Leave a comment (optional)..."
                  maxLength={500}
                  rows={3}
                  className="mb-4 w-full resize-none rounded-xl bg-white/8 px-4 py-3 text-sm text-white ring-1 ring-white/10 transition outline-none placeholder:text-white/30 focus:ring-indigo-500/60"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewDone(true)}
                    className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/15"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewStars === 0 || reviewLoading}
                    className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:opacity-40"
                  >
                    {reviewLoading ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
   How It Works — auto-progressing stepper
   ══════════════════════════════════════════ */
const STEPS = [
  {
    emoji: "👆",
    title: "Press Connect",
    desc: "Tap the button to enter the queue",
    color: "#6366f1",
  },
  { emoji: "🔗", title: "Get Matched", desc: "Paired with a speaker in seconds", color: "#8b5cf6" },
  { emoji: "🗣️", title: "Start Talking", desc: "Jump into a real conversation", color: "#a855f7" },
];

const STEP_DURATION = 3000;

function HowItWorks() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0→100 over STEP_DURATION, then jump to next step
    let raf: number;
    let start: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min((elapsed / STEP_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= STEP_DURATION) {
        setActive((prev) => (prev + 1) % STEPS.length);
        start = ts;
        setProgress(0);
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // SVG ring circumference for timer
  const RADIUS = 28;
  const CIRC = 2 * Math.PI * RADIUS;

  return (
    <section className="border-t border-zinc-100 bg-zinc-50/50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="mb-2 text-center text-xl font-bold text-zinc-900 sm:text-2xl">
          How it works
        </h2>
        <p className="mx-auto mb-10 max-w-md text-center text-xs text-zinc-400 sm:mb-14 sm:text-sm">
          Three simple steps to start practicing
        </p>

        {/* ── Stepper ── */}
        <div className="relative mx-auto flex max-w-md items-start justify-between overflow-visible sm:max-w-none">
          {/* Track line */}
          <div className="absolute top-5 right-[16.6%] left-[16.6%] z-0 h-[2px] bg-zinc-200 sm:top-7" />
          {/* Filled track */}
          <div
            className="absolute top-5 left-[16.6%] z-[1] h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500 sm:top-7"
            style={{
              width: `${active === 0 ? 0 : active === 1 ? 50 : 100}%`,
              maxWidth: "66.6%",
              transition: "width 0.6s ease-in-out",
            }}
          />

          {STEPS.map((step, i) => {
            const isDone = i < active;
            const isCurrent = i === active;

            return (
              <div
                key={step.title}
                className="relative z-10 flex w-1/3 flex-col items-center text-center"
              >
                {/* Glow behind active */}
                {isCurrent && (
                  <div
                    className="absolute top-0 h-10 w-10 animate-pulse rounded-full sm:h-14 sm:w-14"
                    style={{
                      background: `radial-gradient(circle, ${step.color}30 0%, transparent 70%)`,
                      transform: "scale(2)",
                    }}
                  />
                )}

                {/* Circle with SVG timer ring */}
                <div className="relative flex h-10 w-10 items-center justify-center sm:h-14 sm:w-14">
                  {/* Timer ring (only on active) */}
                  {isCurrent && (
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60">
                      <circle
                        cx="30"
                        cy="30"
                        r={RADIUS}
                        fill="none"
                        stroke={step.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={CIRC - (progress / 100) * CIRC}
                        className="opacity-60"
                      />
                    </svg>
                  )}

                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-base transition-all duration-500 sm:h-12 sm:w-12 sm:text-xl ${
                      isCurrent
                        ? "scale-105 shadow-lg"
                        : isDone
                          ? "shadow-md"
                          : "bg-white shadow-sm ring-1 ring-zinc-200"
                    }`}
                    style={
                      isCurrent || isDone
                        ? { background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }
                        : undefined
                    }
                  >
                    {isDone ? (
                      <CheckCircleFilled className="text-sm text-white sm:text-lg" />
                    ) : (
                      <span className={isCurrent ? "drop-shadow" : "opacity-60 grayscale"}>
                        {step.emoji}
                      </span>
                    )}
                  </div>
                </div>

                {/* Floating card behind active step */}
                <div
                  className={`mt-2 rounded-lg px-2 py-2 transition-all duration-500 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3 ${
                    isCurrent
                      ? "translate-y-0 bg-white opacity-100 shadow-lg ring-1 ring-zinc-100"
                      : "translate-y-1 opacity-100"
                  }`}
                >
                  <h3
                    className={`text-xs font-bold transition-colors duration-300 sm:text-sm ${
                      isCurrent ? "text-indigo-600" : isDone ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`mt-0.5 hidden text-xs leading-relaxed transition-all duration-300 sm:block ${
                      isCurrent
                        ? "max-h-10 text-zinc-500 opacity-100"
                        : "max-h-10 text-zinc-400 opacity-70"
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Phone mockup ── */}
        <div className="mt-10 flex justify-center sm:mt-14">
          <div className="relative w-[180px] sm:w-[220px]">
            {/* Phone frame */}
            <div
              className="relative overflow-hidden rounded-[1.5rem] border-[3px] border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-[2rem]"
              style={{ aspectRatio: "9/19" }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-zinc-800 sm:h-6 sm:w-24 sm:rounded-b-2xl" />
              {/* Status bar */}
              <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-5 pt-1.5 text-[7px] font-semibold text-white/50 sm:px-6 sm:pt-2 sm:text-[8px]">
                <span>9:41</span>
                <span>●●●</span>
              </div>

              {/* Screen content — transitions based on step */}
              <div className="relative h-full w-full overflow-hidden">
                {/* Step 1: Connect screen */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center px-4 transition-all duration-500 ${
                    active === 0 ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
                  }`}
                  style={{ background: "linear-gradient(160deg, #16163a 0%, #0a0a18 100%)" }}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl sm:mb-4 sm:h-16 sm:w-16 sm:text-3xl">
                    🎧
                  </div>
                  <p className="mb-1 text-[10px] font-bold text-white sm:text-xs">
                    Ready to practice?
                  </p>
                  <p className="mb-4 text-[8px] text-white/40 sm:mb-5 sm:text-[9px]">
                    Find a partner instantly
                  </p>
                  <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-1.5 text-[9px] font-bold text-white shadow-lg shadow-indigo-500/30 sm:rounded-xl sm:px-6 sm:py-2 sm:text-[10px]">
                    Connect Now
                  </div>
                </div>

                {/* Step 2: Searching screen */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center px-4 transition-all duration-500 ${
                    active === 1
                      ? "translate-x-0 opacity-100"
                      : active === 0
                        ? "translate-x-full opacity-0"
                        : "-translate-x-full opacity-0"
                  }`}
                  style={{ background: "linear-gradient(160deg, #16163a 0%, #0a0a18 100%)" }}
                >
                  <div className="relative mb-4 h-16 w-16 sm:mb-5 sm:h-20 sm:w-20">
                    <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/15 [animation-duration:2s]" />
                    <span className="absolute inset-2 animate-ping rounded-full bg-indigo-500/10 [animation-delay:0.5s] [animation-duration:2s]" />
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/10 text-2xl ring-1 ring-white/15 sm:text-3xl">
                      🔍
                    </div>
                  </div>
                  <p className="mb-1 text-[10px] font-bold text-white sm:text-xs">
                    Finding Partner
                  </p>
                  <p className="mb-2 text-[8px] text-white/40 sm:mb-3 sm:text-[9px]">
                    Matching you with a speaker...
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((j) => (
                      <span
                        key={j}
                        className="h-1 w-1 animate-bounce rounded-full bg-white/30"
                        style={{ animationDelay: `${j * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Step 3: Connected/call screen */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center px-4 transition-all duration-500 ${
                    active === 2 ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                  }`}
                  style={{ background: "linear-gradient(160deg, #16163a 0%, #0a0a18 100%)" }}
                >
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 ring-1 ring-white/10 sm:mb-3">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[7px] font-semibold tracking-wide text-white/60 uppercase sm:text-[8px]">
                      Connected
                    </span>
                  </div>
                  <div className="relative mb-2 h-12 w-12 sm:h-16 sm:w-16">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 text-2xl ring-2 ring-white/20 sm:text-3xl">
                      👤
                    </div>
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-400 sm:right-0.5 sm:bottom-0.5 sm:h-3 sm:w-3" />
                  </div>
                  <p className="text-[10px] font-bold text-white sm:text-xs">Sarah M.</p>
                  <p className="text-[8px] text-white/40 sm:text-[9px]">Intermediate Level</p>
                  <div className="mt-1.5 mb-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 ring-1 ring-white/10 sm:mt-2 sm:mb-4 sm:px-2.5">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    <span className="font-mono text-[9px] font-bold text-white sm:text-[10px]">
                      02:47
                    </span>
                  </div>
                  {/* Audio wave */}
                  <div className="mb-4 flex h-4 items-end gap-[2px] sm:mb-5 sm:h-5">
                    {Array.from({ length: 16 }).map((_, j) => (
                      <span
                        key={j}
                        className="w-[2px] rounded-full"
                        style={{
                          height: `${6 + Math.sin(j * 0.8) * 6}px`,
                          background: `rgba(255,255,255,${0.2 + Math.sin(j * 0.5) * 0.15})`,
                          animation: `waveBar 1.4s ease-in-out ${(j * 0.055) % 0.7}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[9px] text-white sm:h-8 sm:w-8 sm:text-[10px]">
                      <AudioOutlined />
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-[10px] text-white shadow-lg shadow-red-500/40 sm:h-10 sm:w-10 sm:text-xs">
                      <PhoneOutlined className="rotate-[135deg]" />
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[9px] text-white sm:h-8 sm:w-8 sm:text-[10px]">
                      <MessageOutlined />
                    </div>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 z-20 h-0.5 w-8 -translate-x-1/2 rounded-full bg-white/20 sm:bottom-1.5 sm:h-1 sm:w-10" />
            </div>

            {/* Phone reflection/shadow */}
            <div className="absolute -bottom-3 left-1/2 h-5 w-[140px] -translate-x-1/2 rounded-[50%] bg-zinc-900/10 blur-xl sm:-bottom-4 sm:h-6 sm:w-[180px]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.5); opacity: 0.45; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════
   Main Partners Page
   ══════════════════════════════════════════ */
export default function PartnersPage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const { setCallActive } = useCall();

  const openModal = () => {
    setModalOpen(true);
    setCallActive(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setCallActive(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-violet-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="flex flex-col items-center text-center">
            {/* Live indicator */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Native speakers online now
            </div>

            <h1 className="mb-5 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
              Practice English with{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                real partners
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-lg leading-relaxed text-zinc-500">
              One tap to connect with a native speaker. No scheduling, no pressure — just real
              conversation.
            </p>

            {/* CTA Button */}
            <button
              onClick={openModal}
              className="group mb-12 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
            >
              <PhoneOutlined className="text-lg transition-transform group-hover:rotate-12" />
              Connect Now — It&apos;s Free
            </button>

            {/* Quick benefits inline */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              {["Audio calls, no video pressure", "Matched in seconds", "100% free"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Audio Call Modal ── */}
      <AudioCallModal open={modalOpen} onClose={closeModal} />
    </div>
  );
}
