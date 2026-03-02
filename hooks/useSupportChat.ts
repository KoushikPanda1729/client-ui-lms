"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSupportSocket, disconnectSupportSocket } from "@/lib/supportSocket";
import type { Socket } from "socket.io-client";

// ── Types ────────────────────────────────────────────────────────────────────

export type MsgStatus = "sending" | "sent" | "read";

export interface SupportMessage {
  id: string;
  text: string;
  fromAdmin: boolean;
  createdAt: Date;
  status?: MsgStatus; // only meaningful for user-sent messages (fromAdmin=false)
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSupportChat() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadFromAdmin, setUnreadFromAdmin] = useState(0);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Connect / bootstrap listeners ────────────────────────────────────────

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = getSupportSocket();
    socketRef.current = socket;

    socket.off("support_sent");
    socket.off("support_reply");
    socket.off("support_admin_typing");
    socket.off("support_admin_online");
    socket.off("support_admin_status");
    socket.off("support_read_by_admin");
    socket.off("connect");
    socket.off("disconnect");

    socket.on("connect", () => {
      setConnected(true);
      // Ask server if any admin is online right now
      socket.emit("support_status_check");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setAdminOnline(false);
      setIsAdminTyping(false);
    });

    // One-time response to support_status_check
    socket.on("support_admin_status", ({ online }: { online: boolean }) => {
      setAdminOnline(online);
    });

    // Real-time admin online/offline broadcast
    socket.on("support_admin_online", ({ online }: { online: boolean }) => {
      setAdminOnline(online);
      if (!online) setIsAdminTyping(false);
    });

    // Admin is typing / stopped typing in our thread
    socket.on("support_admin_typing", ({ typing }: { typing: boolean }) => {
      setIsAdminTyping(typing);
    });

    // Confirmation that our message was saved → upgrade to "sent"
    socket.on(
      "support_sent",
      ({ messageId, createdAt }: { messageId: string; createdAt: Date }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === `pending-${messageId}`
              ? { ...m, id: messageId, createdAt, status: "sent" }
              : m,
          ),
        );
      },
    );

    // Reply from admin
    socket.on("support_reply", (payload: { messageId: string; text: string; createdAt: Date }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: payload.messageId,
          text: payload.text,
          fromAdmin: true,
          createdAt: payload.createdAt,
        },
      ]);
      setIsAdminTyping(false);
      setUnreadFromAdmin((n) => n + 1);
    });

    // Admin opened our thread → all our sent messages are now "read" (blue ticks)
    socket.on("support_read_by_admin", () => {
      setMessages((prev) => prev.map((m) => (!m.fromAdmin ? { ...m, status: "read" } : m)));
    });

    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current?.off("support_sent");
    socketRef.current?.off("support_reply");
    socketRef.current?.off("support_admin_typing");
    socketRef.current?.off("support_admin_online");
    socketRef.current?.off("support_admin_status");
    socketRef.current?.off("support_read_by_admin");
    socketRef.current = null;
    setConnected(false);
    setIsAdminTyping(false);
    disconnectSupportSocket();
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected || !text.trim()) return;

    // Stop typing indicator immediately on send
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socket.emit("support_typing", { typing: false });

    const tempId = `pending-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: text.trim(),
        fromAdmin: false,
        createdAt: new Date(),
        status: "sending",
      },
    ]);
    socket.emit("support_send", { text: text.trim() });
  }, []);

  // ── Emit typing indicator (debounced stop after 2s) ───────────────────────

  const emitTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit("support_typing", { typing: true });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("support_typing", { typing: false });
    }, 2000);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearUnread = useCallback(() => setUnreadFromAdmin(0), []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
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
  };
}
