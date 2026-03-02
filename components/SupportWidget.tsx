"use client";

import React, { useEffect, useRef, useState } from "react";
import { SendOutlined, CloseOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { useSupportChat, type MsgStatus } from "@/hooks/useSupportChat";

// ── Tick marks (WhatsApp-style) ──────────────────────────────────────────────
// Single grey ✓  = sent to server
// Double blue ✓✓ = read by admin

function TickMark({ status }: { status: MsgStatus }) {
  if (status === "sending") {
    return <span style={{ opacity: 0.45, fontSize: 10, letterSpacing: -1 }}>✓</span>;
  }
  if (status === "sent") {
    return (
      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, letterSpacing: -1 }}>✓</span>
    );
  }
  // read
  return <span style={{ color: "#93c5fd", fontSize: 10, letterSpacing: -2 }}>✓✓</span>;
}

// ── Animated typing dots ─────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-[4px] px-3.5 py-2.5" style={{ background: "#f0f0f7" }}>
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="block h-2 w-2 rounded-full bg-zinc-400"
              style={{
                animation: "supportBounce 1.2s ease-in-out infinite",
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    connected,
    unreadFromAdmin,
    isAdminTyping,
    adminOnline,
    connect,
    disconnect,
    sendMessage,
    emitTyping,
    clearUnread,
  } = useSupportChat();

  // Connect socket when widget opens for the first time
  useEffect(() => {
    if (open) {
      connect();
      clearUnread();
    }
  }, [open, connect, clearUnread]);

  // Auto-scroll to newest message / typing indicator
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAdminTyping, open]);

  // Disconnect when widget is unmounted
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim()) emitTyping();
  };

  return (
    <>
      {/* Bounce keyframes injected inline */}
      <style>{`
        @keyframes supportBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>

      {/* ── Chat Window ── */}
      {open && (
        <div
          className="fixed right-5 bottom-24 z-50 flex w-80 flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: "#fff", border: "1px solid #e8e8f0", maxHeight: 480 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <CustomerServiceOutlined className="text-sm text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">SpeakEasy Support</p>
                <p className="flex items-center gap-1 text-[11px] text-white/70">
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: adminOnline ? "#4ade80" : "#94a3b8",
                      flexShrink: 0,
                    }}
                  />
                  {!connected
                    ? "Connecting..."
                    : adminOnline
                      ? "Support is online"
                      : "Support is offline"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <CloseOutlined className="text-xs text-white" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            style={{ minHeight: 200, maxHeight: 300 }}
          >
            {messages.length === 0 && !isAdminTyping ? (
              <div className="flex flex-col items-center gap-2 pt-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl">
                  👋
                </div>
                <p className="text-sm font-medium text-zinc-700">Hi! How can we help?</p>
                <p className="text-xs text-zinc-400">
                  Send us a message and we&apos;ll get back to you shortly.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.fromAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                        msg.fromAdmin
                          ? "rounded-bl-[4px] bg-zinc-100 text-zinc-800"
                          : "rounded-br-[4px] bg-indigo-600 text-white"
                      }`}
                    >
                      <div>{msg.text}</div>
                      {/* Tick mark for user-sent messages */}
                      {!msg.fromAdmin && msg.status && (
                        <div className="mt-0.5 flex justify-end">
                          <TickMark status={msg.status} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Admin typing indicator */}
                {isAdminTyping && <TypingDots />}
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
            >
              <SendOutlined className="text-xs text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) clearUnread();
        }}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#6C5CE7,#a29bfe)" }}
        aria-label="Support chat"
      >
        {open ? (
          <CloseOutlined className="text-xl text-white" />
        ) : (
          <CustomerServiceOutlined className="text-xl text-white" />
        )}
        {/* Unread badge */}
        {!open && unreadFromAdmin > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadFromAdmin > 9 ? "9+" : unreadFromAdmin}
          </span>
        )}
        {/* Online pulse dot when admin is online and widget is closed */}
        {!open && adminOnline && unreadFromAdmin === 0 && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-green-400" />
          </span>
        )}
      </button>
    </>
  );
}
