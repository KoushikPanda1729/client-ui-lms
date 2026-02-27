import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket && _socket.connected) return _socket;

  _socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5503", {
    withCredentials: true, // sends httpOnly accessToken cookie automatically
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
