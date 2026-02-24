import type { WASocket } from "@whiskeysockets/baileys";
import type { Socket, Server as SocketIOServer } from "socket.io";
import prisma from "./db";
import { delay } from "./helpers";

/**
 * Cleanup and reset auth from database
 */
async function cleanupAuth() {
  try {
    await prisma.whatsAppSession.deleteMany({});
    console.log("🗑️ Session database dibersihkan");
  } catch (error) {
    console.log("⚠️ Error menghapus session database:", error);
  }
}

/**
 * Setup Socket.IO event handlers
 * Used for real-time communication with Next.js frontend
 */
export function setupSocketHandlers(
  io: SocketIOServer,
  getState: () => {
    sock: WASocket | null;
    qrCode: string | null;
  },
  setState: (updates: {
    sock?: WASocket | null;
    qrCode?: string | null;
  }) => void,
  connectToWhatsApp: () => Promise<void>,
  stopQueueProcessor: () => void,
  emitStatus: () => void,
  emitQR: (qr: string | null) => void,
) {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 Client terhubung:", socket.id);

    const { sock, qrCode } = getState();

    // Kirim status saat ini ke client yang baru connect
    socket.emit("status", {
      connected: sock?.user ? true : false,
      online: sock?.user ? true : false,
      user: sock?.user || null,
      hasQR: qrCode ? true : false,
    });

    // Kirim QR code jika ada
    if (qrCode) {
      socket.emit("qr", { qr: qrCode });
    }

    // Handle request status dari client
    socket.on("request:status", () => {
      const { sock: currentSock, qrCode: currentQr } = getState();
      socket.emit("status", {
        connected: currentSock?.user ? true : false,
        online: currentSock?.user ? true : false,
        user: currentSock?.user || null,
        hasQR: currentQr ? true : false,
      });
    });

    // Handle request QR dari client
    socket.on("request:qr", () => {
      const { qrCode: currentQr } = getState();
      socket.emit("qr", { qr: currentQr });
    });

    // Handle start WhatsApp
    socket.on("action:start", async () => {
      try {
        const { sock: currentSock } = getState();

        if (currentSock?.user) {
          socket.emit("action:result", {
            success: true,
            message: "WhatsApp sudah terkoneksi",
          });
          return;
        }

        await connectToWhatsApp();
        socket.emit("action:result", {
          success: true,
          message: "Memulai koneksi WhatsApp...",
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        socket.emit("action:result", { success: false, error: errorMessage });
      }
    });

    // Handle stop WhatsApp
    socket.on("action:stop", async () => {
      try {
        const { sock: currentSock } = getState();

        if (currentSock) {
          await currentSock.logout();
          setState({ sock: null, qrCode: null });
          stopQueueProcessor();
          emitStatus();
          emitQR(null);
          socket.emit("action:result", {
            success: true,
            message: "WhatsApp disconnected",
          });
        } else {
          socket.emit("action:result", {
            success: true,
            message: "WhatsApp sudah tidak terkoneksi",
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        socket.emit("action:result", { success: false, error: errorMessage });
      }
    });

    // Handle reset WhatsApp
    socket.on("action:reset", async () => {
      try {
        const { sock: currentSock } = getState();

        if (currentSock) {
          await currentSock.logout();
          setState({ sock: null, qrCode: null });
        }

        await cleanupAuth();
        await delay(1000);

        await connectToWhatsApp();

        socket.emit("action:result", {
          success: true,
          message: "WhatsApp connection direset, silakan scan QR code kembali",
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        socket.emit("action:result", { success: false, error: errorMessage });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client terputus:", socket.id);
    });
  });
}
