"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export interface SupportMessage {
  id: string;
  text: string;
  fromAdmin: boolean;
  createdAt: Date;
}

export function useSupportChat() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadFromAdmin, setUnreadFromAdmin] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.off("support_sent");
    socket.off("support_reply");
    socket.off("connect");
    socket.off("disconnect");

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Confirmation that our message was saved
    socket.on(
      "support_sent",
      ({ messageId, createdAt }: { messageId: string; createdAt: Date }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === `pending-${messageId}` ? { ...m, id: messageId, createdAt } : m,
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
      setUnreadFromAdmin((n) => n + 1);
    });

    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.off("support_sent");
    socketRef.current?.off("support_reply");
    socketRef.current = null;
    setConnected(false);
  }, []);

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected || !text.trim()) return;

    const tempId = `pending-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, text: text.trim(), fromAdmin: false, createdAt: new Date() },
    ]);
    socket.emit("support_send", { text: text.trim() });
  }, []);

  const clearUnread = useCallback(() => setUnreadFromAdmin(0), []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { messages, connected, unreadFromAdmin, connect, disconnect, sendMessage, clearUnread };
}
