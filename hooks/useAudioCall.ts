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

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

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
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {
            // Autoplay blocked by browser — user must tap to resume
            setAudioBlocked(true);
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setPhase("connected");
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } else if (state === "failed" || state === "disconnected") {
          setErrorMsg("Connection lost");
          setPhase("ended");
          fullCleanup();
        }
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
        setPartner(p);
        setPhase("matched");
        socket.emit("join_room", { roomId });
      });

      // Both peers in room — start WebRTC
      socket.on("peer_joined", async ({ role, roomId }: PeerJoinedPayload) => {
        setPhase("connecting");
        const pc = createPeerConnection(iceServersRef.current);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: false,
          });
          localStreamRef.current = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch {
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
        if (err.code === "PROFILE_INCOMPLETE") {
          setErrorMsg("Please set your username and English level in your profile first.");
        } else {
          setErrorMsg(err.message || "Something went wrong");
        }
        setPhase("ended");
        fullCleanup();
      });

      socket.on("connect_error", (err) => {
        setErrorMsg(err.message === "UNAUTHORIZED" ? "Please log in first." : "Connection failed");
        setPhase("idle");
        disconnectSocket();
        socketRef.current = null;
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

  const resumeAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => setAudioBlocked(false))
        .catch(() => null);
    }
  }, []);

  // Attach remote audio element
  const setRemoteAudioEl = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el;
  }, []);

  return {
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
  };
}
