"use client";

import React, { useEffect, useRef, useState } from "react";
import { SendOutlined, CloseOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { useSupportChat } from "@/hooks/useSupportChat";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, connected, unreadFromAdmin, connect, disconnect, sendMessage, clearUnread } =
    useSupportChat();

  // Connect socket when widget opens for the first time
  useEffect(() => {
    if (open) {
      connect();
      clearUnread();
    }
  }, [open, connect, clearUnread]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Disconnect when widget is closed / component unmounts
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const totalUnread = unreadFromAdmin;

  return (
    <>
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
                <p className="text-[11px] text-white/70">
                  {connected ? "● Online" : "● Connecting..."}
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
            {messages.length === 0 ? (
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
              messages.map((msg) => (
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
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </>
  );
}
