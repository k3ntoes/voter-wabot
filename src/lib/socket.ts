"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_URL || "http://localhost:3001";

interface WhatsAppStatus {
  connected: boolean;
  online: boolean;
  user: { id?: string; name?: string } | null;
  hasQR: boolean;
}

interface QRData {
  qr: string | null;
}

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useWhatsAppSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    online: false,
    user: null,
    hasQR: false,
  });
  const [qr, setQr] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Inisialisasi socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Event listeners
    newSocket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
      setIsConnected(false);
    });

    newSocket.on("status", (data: WhatsAppStatus) => {
      console.log("📊 Status update:", data);
      setStatus(data);
    });

    newSocket.on("qr", (data: QRData) => {
      console.log("📱 QR update:", data.qr ? "QR received" : "QR cleared");
      setQr(data.qr);
    });

    // Request initial status
    newSocket.emit("request:status");
    newSocket.emit("request:qr");

    // Cleanup on unmount
    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  const startWhatsApp = useCallback(() => {
    return new Promise<ActionResult>((resolve) => {
      if (!socket) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      socket.emit("action:start");
      socket.once("action:result", (result: ActionResult) => {
        resolve(result);
      });

      // Timeout fallback
      setTimeout(() => {
        resolve({ success: false, error: "Request timeout" });
      }, 10000);
    });
  }, [socket]);

  const stopWhatsApp = useCallback(() => {
    return new Promise<ActionResult>((resolve) => {
      if (!socket) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      socket.emit("action:stop");
      socket.once("action:result", (result: ActionResult) => {
        resolve(result);
      });

      setTimeout(() => {
        resolve({ success: false, error: "Request timeout" });
      }, 10000);
    });
  }, [socket]);

  const resetWhatsApp = useCallback(() => {
    return new Promise<ActionResult>((resolve) => {
      if (!socket) {
        resolve({ success: false, error: "Socket not connected" });
        return;
      }

      socket.emit("action:reset");
      socket.once("action:result", (result: ActionResult) => {
        resolve(result);
      });

      setTimeout(() => {
        resolve({ success: false, error: "Request timeout" });
      }, 10000);
    });
  }, [socket]);

  const requestStatus = useCallback(() => {
    if (socket) {
      socket.emit("request:status");
    }
  }, [socket]);

  const requestQR = useCallback(() => {
    if (socket) {
      socket.emit("request:qr");
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    status,
    qr,
    startWhatsApp,
    stopWhatsApp,
    resetWhatsApp,
    requestStatus,
    requestQR,
  };
}
