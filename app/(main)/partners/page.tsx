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
  VideoCameraOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAudioCall } from "@/hooks/useAudioCall";
import { useCall } from "@/contexts/CallContext";

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
    speakerOn,
    videoEnabled,
    remoteVideoEnabled,
    localVideoStreamRef,
    remoteVideoStreamRef,
    startSearch,
    cancelSearch,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    sendMessage,
  } = useAudioCall();

  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
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
  }, [messages, chatOpen]);

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
    if (phase === "searching" || phase === "matched") cancelSearch();
    else endCall();
    onClose();
  };

  if (!open) return null;

  const showVideo = phase === "connected" && (videoEnabled || remoteVideoEnabled);
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

      {/* ══ CONNECTING / CONNECTED ══ */}
      {(phase === "connecting" || phase === "connected") && partner && (
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
                {phase === "connected" && (
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
                {phase === "connected" && (
                  <span className="absolute right-2.5 bottom-2.5 h-5 w-5 rounded-full border-[3px] border-[#0a0a18] bg-emerald-400 shadow-lg shadow-emerald-500/50" />
                )}
              </div>
              {phase === "connected" && (
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
            </div>
          )}

          {/* ── Layer 1: top info ── */}
          <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 bg-linear-to-b from-black/70 via-black/25 to-transparent px-4 pt-8 pb-16 text-center">
            {/* Status pill */}
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 ring-1 ring-white/10 backdrop-blur-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full ${phase === "connected" ? "animate-pulse bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]" : "bg-yellow-400"}`}
              />
              <span className="text-[10px] font-semibold tracking-widest text-white/70 uppercase">
                {phase === "connected" ? "Connected" : "Connecting..."}
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
            {phase === "connected" && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-1 ring-1 ring-white/10 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>

          {/* ── Layer 2: PiP – draggable + tap to swap ── */}
          {(swapped ? remoteVideoEnabled : videoEnabled) && (
            <div
              className="absolute z-30 h-36 w-24 cursor-pointer touch-none overflow-hidden rounded-2xl border border-white/25 shadow-2xl ring-1 ring-black/20 select-none sm:h-44 sm:w-32"
              style={pipPos ? { left: pipPos.x, top: pipPos.y } : { top: 80, right: 16 }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const PIP_W = 96,
                  PIP_H = 144;
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
          {phase === "connected" &&
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
          {phase === "connected" && (
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
                          className={`max-w-[88%] px-3.5 py-2.5 text-sm leading-snug ${
                            msg.fromMe
                              ? "rounded-2xl rounded-br-sm bg-indigo-500 font-medium text-white"
                              : "rounded-2xl rounded-bl-sm bg-white/12 text-white"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-white/10 px-3 py-3">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/8 px-4 py-2.5 ring-1 ring-white/10 transition focus-within:ring-indigo-500/50">
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
              {phase === "connected" && (
                <button
                  onClick={toggleVideo}
                  className="flex flex-col items-center gap-1 transition active:scale-90"
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
                    {videoEnabled ? "Cam on" : "Camera"}
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
              {phase === "connected" && (
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
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
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
                <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
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
                onClick={openModal}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
              >
                <PhoneOutlined className="text-lg" />
                Connect Now — It&apos;s Free
              </button>
            </div>

            {/* Right — iPhone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative h-130 w-65">
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
            onClick={openModal}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            <PhoneOutlined className="text-lg" />
            Start a Free Call
          </button>
        </div>
      </section>

      {/* ── Audio Call Modal ── */}
      <AudioCallModal open={modalOpen} onClose={closeModal} />
    </div>
  );
}
