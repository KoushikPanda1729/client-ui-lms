import { io, Socket } from "socket.io-client";

// Separate socket instance for the support widget, so that
// disconnectSocket() called by the WebRTC call flow never kills
// the support connection.
let _supportSocket: Socket | null = null;

export function getSupportSocket(): Socket {
  if (_supportSocket && _supportSocket.connected) return _supportSocket;

  _supportSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5503", {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  return _supportSocket;
}

export function disconnectSupportSocket(): void {
  if (_supportSocket) {
    _supportSocket.disconnect();
    _supportSocket = null;
  }
}
