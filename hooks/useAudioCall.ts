"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export type CallPhase =
  | "idle"
  | "searching"
  | "matched"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended";

export interface PartnerInfo {
  userId?: string;
  displayName: string;
  avatarUrl?: string | null;
  level?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  senderName: string;
  timestamp: number;
  /** Only set on fromMe messages: "sent" = server received; "delivered" = partner got it */
  status?: "sent" | "delivered";
}

interface MatchFoundPayload {
  roomId: string;
  partner: PartnerInfo;
  iceServers: RTCIceServer[];
}

interface PeerJoinedPayload {
  role: "caller" | "receiver";
  roomId: string;
}

interface SignalPayload {
  roomId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

// Google STUN as fallback for dev
const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useAudioCall() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(false);
  // Tracks the last completed call's roomId so the UI can prompt for a review
  const [lastRoomId, setLastRoomId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE);
  const partnerRef = useRef<PartnerInfo | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const partnerTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  // Resolves when local mic stream is added to the PC — receiver waits on this
  const localMediaReadyRef = useRef<Promise<void>>(Promise.resolve());
  // True once WebRTC peer connection reaches "connected" state
  const wasConnectedRef = useRef(false);

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    localVideoStreamRef.current?.getTracks().forEach((t) => t.stop());
    localVideoStreamRef.current = null;
    remoteVideoStreamRef.current = null;
    setVideoEnabled(false);
    setRemoteVideoEnabled(false);
  }, []);

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const fullCleanup = useCallback(() => {
    stopTimer();
    stopLocalStream();
    closePeerConnection();
    disconnectSocket();
    socketRef.current = null;
    roomIdRef.current = null;
    pendingCandidates.current = [];
    localMediaReadyRef.current = Promise.resolve();
    setDuration(0);
    setMuted(false);
    setIsPartnerTyping(false);
    if (partnerTypingTimerRef.current) {
      clearTimeout(partnerTypingTimerRef.current);
      partnerTypingTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [stopTimer, stopLocalStream, closePeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fullCleanup();
    };
  }, [fullCleanup]);

  // ─── WebRTC helpers ────────────────────────────────────────────────────────

  const createPeerConnection = useCallback(
    (iceServers: RTCIceServer[]) => {
      const pc = new RTCPeerConnection({
        iceServers: [...iceServers, ...FALLBACK_ICE],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && roomIdRef.current) {
          socketRef.current.emit("webrtc_ice", {
            roomId: roomIdRef.current,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const track = event.track;
        const stream = event.streams?.[0];

        if (track.kind === "video") {
          remoteVideoStreamRef.current = stream ?? new MediaStream([track]);
          setRemoteVideoEnabled(true);
          const handleVideoOff = () => {
            remoteVideoStreamRef.current = null;
            setRemoteVideoEnabled(false);
          };
          track.onended = handleVideoOff;
          // onmute fires in browsers where onended doesn't when track is removed
          track.onmute = handleVideoOff;
          return;
        }

        // Audio track — bypass React DOM + autoplay restrictions with new Audio()
        if (!stream) return;
        if (remoteAudioRef.current) {
          remoteAudioRef.current.pause();
          remoteAudioRef.current.srcObject = null;
        }
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        remoteAudioRef.current = audio;
        audio.play().catch(() => {
          setAudioBlocked(true);
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          wasConnectedRef.current = true;
          // Clear any pending reconnect timer
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          setPhase("connected");
          // Resume timer if it was stopped during reconnect
          if (!timerRef.current) {
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          }
        } else if (state === "disconnected") {
          // Temporary network blip — show reconnecting UI and give ICE 15s to recover
          if (wasConnectedRef.current) {
            setPhase("reconnecting");
            // Pause the call timer while reconnecting
            stopTimer();
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              setErrorMsg("Network connection lost. Please try again.");
              setPhase("ended");
              fullCleanup();
            }, 15000);
          }
        } else if (state === "failed") {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          setErrorMsg("Connection lost");
          setPhase("ended");
          fullCleanup();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [fullCleanup, stopTimer],
  );

  const addPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    for (const c of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        // ignore stale candidates
      }
    }
    pendingCandidates.current = [];
  }, []);

  // ─── Socket event handlers ─────────────────────────────────────────────────

  const setupSocketEvents = useCallback(
    (socket: Socket) => {
      // Server confirmed we're in the queue
      socket.on("searching", () => {
        setPhase("searching");
      });

      // Match found — store room info and join
      socket.on("match_found", async (payload: MatchFoundPayload) => {
        const { roomId, partner: p, iceServers } = payload;
        roomIdRef.current = roomId;
        iceServersRef.current = iceServers?.length ? iceServers : FALLBACK_ICE;
        partnerRef.current = p;
        setPartner(p);
        setPhase("matched");
        socket.emit("join_room", { roomId });
      });

      // Both peers in room — start WebRTC
      socket.on("peer_joined", async ({ role, roomId }: PeerJoinedPayload) => {
        setPhase("connecting");
        const pc = createPeerConnection(iceServersRef.current);

        // Store a promise that resolves once local mic tracks are added to the PC.
        // The receiver's webrtc_offer handler awaits this before answering,
        // preventing a race where the answer is sent without our audio track.
        let resolveLocalMedia!: () => void;
        localMediaReadyRef.current = new Promise<void>((res) => {
          resolveLocalMedia = res;
        });

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
          localStreamRef.current = stream;
          // Always start unmuted — ensure tracks are enabled regardless of previous call state
          stream.getAudioTracks().forEach((t) => {
            t.enabled = true;
          });
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
          resolveLocalMedia(); // tracks are now on the PC
        } catch {
          resolveLocalMedia(); // unblock even on error so receiver doesn't hang
          setErrorMsg("Microphone access denied. Please allow microphone.");
          setPhase("ended");
          fullCleanup();
          return;
        }

        if (role === "caller") {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc_offer", { roomId, sdp: pc.localDescription });
          } catch {
            setErrorMsg("Failed to create offer");
          }
        }
        // receiver waits for the offer event
      });

      // Receiver: handle incoming offer
      socket.on("webrtc_offer", async ({ roomId, sdp }: SignalPayload) => {
        const pc = pcRef.current;
        if (!pc || !sdp) return;
        try {
          // Wait until our local mic tracks are on the PC before answering.
          // Without this, the answer is sent before addTrack() runs → caller
          // never receives our audio track → one-way audio.
          await localMediaReadyRef.current;
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await addPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc_answer", { roomId, sdp: pc.localDescription });
        } catch {
          setErrorMsg("Failed to handle offer");
        }
      });

      // Caller: handle incoming answer
      socket.on("webrtc_answer", async ({ sdp }: SignalPayload) => {
        const pc = pcRef.current;
        if (!pc || !sdp) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await addPendingCandidates(pc);
        } catch {
          setErrorMsg("Failed to handle answer");
        }
      });

      // ICE candidates from peer
      socket.on("webrtc_ice", async ({ candidate }: SignalPayload) => {
        if (!candidate) return;
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            // ignore
          }
        } else {
          // Buffer until remote description is set
          pendingCandidates.current.push(candidate);
        }
      });

      // Peer disconnected or ended the call
      socket.on("peer_left", () => {
        if (wasConnectedRef.current && roomIdRef.current) {
          setLastRoomId(roomIdRef.current);
        }
        wasConnectedRef.current = false;
        setErrorMsg("Partner ended the call");
        setPhase("ended");
        setMuted(false);
        stopTimer();
        stopLocalStream();
        closePeerConnection();
      });

      // Server error
      socket.on("error", (err: { code: string; message: string }) => {
        setErrorMsg(err.message || "Something went wrong");
        setPhase("ended");
        fullCleanup();
      });

      socket.on("connect_error", (err) => {
        setErrorMsg(err.message === "UNAUTHORIZED" ? "Please log in first." : "Connection failed");
        setPhase("idle");
        disconnectSocket();
        socketRef.current = null;
      });

      // Chat messages relayed from peer
      socket.on("chat_message", (payload: { messageId: string; text: string }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: payload.messageId,
            text: payload.text,
            fromMe: false,
            senderName: partnerRef.current?.displayName || "Partner",
            timestamp: Date.now(),
          },
        ]);
        // Ack delivery so sender gets double-tick
        if (socketRef.current && roomIdRef.current) {
          socketRef.current.emit("message_delivered", {
            roomId: roomIdRef.current,
            messageId: payload.messageId,
          });
        }
      });

      // Partner's delivery ack → upgrade our sent message to double-tick
      socket.on("message_delivered", ({ messageId }: { messageId: string }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, status: "delivered" } : m)),
        );
      });

      // Partner typing indicator
      socket.on("typing", ({ isTyping }: { isTyping: boolean }) => {
        setIsPartnerTyping(isTyping);
        // Auto-clear after 3s in case the "stop typing" event is dropped
        if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);
        if (isTyping) {
          partnerTypingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      });
    },
    [
      createPeerConnection,
      addPendingCandidates,
      fullCleanup,
      stopTimer,
      stopLocalStream,
      closePeerConnection,
    ],
  );

  // ─── Public actions ────────────────────────────────────────────────────────

  const startSearch = useCallback(
    (level?: string) => {
      setErrorMsg(null);
      setLastRoomId(null);
      setMuted(false);
      wasConnectedRef.current = false;
      setPhase("searching");

      const socket = getSocket();
      socketRef.current = socket;

      // Remove old listeners before adding new ones
      socket.off("searching");
      socket.off("match_found");
      socket.off("peer_joined");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice");
      socket.off("peer_left");
      socket.off("error");
      socket.off("connect_error");
      socket.off("chat_message");
      socket.off("message_delivered");
      socket.off("typing");
      setMessages([]);
      setIsPartnerTyping(false);

      setupSocketEvents(socket);

      if (socket.connected) {
        socket.emit("find_partner", { level });
      } else {
        socket.connect();
        socket.once("connect", () => {
          socket.emit("find_partner", { level });
        });
      }
    },
    [setupSocketEvents],
  );

  const cancelSearch = useCallback(() => {
    socketRef.current?.emit("cancel_search");
    fullCleanup();
    setPhase("idle");
  }, [fullCleanup]);

  const endCall = useCallback(() => {
    const roomId = roomIdRef.current;
    const wasConn = wasConnectedRef.current;
    wasConnectedRef.current = false;

    if (roomId && socketRef.current) {
      socketRef.current.emit("end_call", { roomId });
    }

    if (wasConn && roomId) {
      setLastRoomId(roomId);
      fullCleanup();
      partnerRef.current = null;
      setPartner(null);
      setPhase("ended");
    } else {
      fullCleanup();
      partnerRef.current = null;
      setPartner(null);
      setPhase("idle");
    }
  }, [fullCleanup]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMuted((m) => !m);
  }, []);

  const toggleVideo = useCallback(async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    const roomId = roomIdRef.current;
    if (!pc || !socket || !roomId) return;

    if (!videoEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        localVideoStreamRef.current = stream;
        pc.addTrack(videoTrack, stream);
        setVideoEnabled(true);
        // Renegotiate so peer receives our video track
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { roomId, sdp: pc.localDescription });
      } catch {
        localVideoStreamRef.current?.getTracks().forEach((t) => t.stop());
        localVideoStreamRef.current = null;
      }
    } else {
      const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (videoSender) pc.removeTrack(videoSender);
      localVideoStreamRef.current?.getTracks().forEach((t) => t.stop());
      localVideoStreamRef.current = null;
      setVideoEnabled(false);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { roomId, sdp: pc.localDescription });
      } catch {
        /* ignore renegotiation errors */
      }
    }
  }, [videoEnabled]);

  const resumeAudio = useCallback(() => {
    const audio = remoteAudioRef.current;
    if (!audio) return;
    // load() resets the element state before play — fixes stale/blocked audio
    audio.load();
    audio
      .play()
      .then(() => setAudioBlocked(false))
      .catch(() => null);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn((prev) => {
      const next = !prev;
      const audio = remoteAudioRef.current;
      if (audio) {
        audio.muted = !next;
        if (next && audio.paused) {
          audio.play().catch(() => {});
        }
      }
      return next;
    });
    setAudioBlocked(false);
  }, []);

  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    const roomId = roomIdRef.current;
    if (!socket || !roomId || !text.trim()) return;
    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    socket.emit("chat_message", { roomId, text: text.trim(), messageId });
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: text.trim(),
        fromMe: true,
        senderName: "You",
        timestamp: Date.now(),
        status: "sent",
      },
    ]);
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    const socket = socketRef.current;
    const roomId = roomIdRef.current;
    if (!socket || !roomId) return;
    socket.emit("typing", { roomId, isTyping });
  }, []);

  return {
    phase,
    partner,
    errorMsg,
    muted,
    duration,
    audioBlocked,
    messages,
    isPartnerTyping,
    speakerOn,
    videoEnabled,
    remoteVideoEnabled,
    localVideoStreamRef,
    remoteVideoStreamRef,
    lastRoomId,
    startSearch,
    cancelSearch,
    endCall,
    toggleMute,
    toggleVideo,
    resumeAudio,
    toggleSpeaker,
    sendMessage,
    sendTyping,
  };
}
