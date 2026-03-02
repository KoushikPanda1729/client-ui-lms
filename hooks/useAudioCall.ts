"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export type CallPhase = "idle" | "searching" | "matched" | "connecting" | "connected" | "ended";

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
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(false);

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
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  // Resolves when local mic stream is added to the PC — receiver waits on this
  const localMediaReadyRef = useRef<Promise<void>>(Promise.resolve());

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
          track.onended = () => {
            remoteVideoStreamRef.current = null;
            setRemoteVideoEnabled(false);
          };
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
          setPhase("connected");
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } else if (state === "failed") {
          setErrorMsg("Connection lost");
          setPhase("ended");
          fullCleanup();
        }
        // "disconnected" is temporary — let ICE attempt recovery; do not cleanup
      };

      pcRef.current = pc;
      return pc;
    },
    [fullCleanup],
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
        setErrorMsg("Partner ended the call");
        setPhase("ended");
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
      setMessages([]);

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
    if (roomIdRef.current && socketRef.current) {
      socketRef.current.emit("end_call", { roomId: roomIdRef.current });
    }
    fullCleanup();
    setPhase("idle");
    partnerRef.current = null;
    setPartner(null);
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
      { id: messageId, text: text.trim(), fromMe: true, senderName: "You", timestamp: Date.now() },
    ]);
  }, []);

  return {
    phase,
    partner,
    errorMsg,
    muted,
    duration,
    audioBlocked,
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
    resumeAudio,
    toggleSpeaker,
    sendMessage,
  };
}
