import type { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import * as qrcode from "qrcode-terminal";
import { useDatabaseAuthState } from "./auth-state";
import prisma from "./db";
import { processIncomingMessage } from "./message-handlers";

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
 * Create WhatsApp connection manager
 */
export function createWhatsAppConnection(
  getState: () => {
    sock: WASocket | null;
    qrCode: string | null;
  },
  setState: (updates: {
    sock?: WASocket | null;
    qrCode?: string | null;
  }) => void,
  emitStatus: () => void,
  emitQR: (qr: string | null) => void,
  startQueueProcessor: () => void,
) {
  /**
   * Connect to WhatsApp
   */
  async function connectToWhatsApp(): Promise<void> {
    // Use database-based auth state
    const { state, saveCreds } = await useDatabaseAuthState();

    const sock = makeWASocket({
      auth: state,
      syncFullHistory: false,
      browser: ["Voter WhatsApp Bot", "Chrome", "10.0.0"],
    });

    setState({ sock });

    // Simpan kredensial saat update
    sock.ev.on("creds.update", saveCreds);

    // Handle koneksi
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        setState({ qrCode: qr });
        console.log("📱 QR Code tersedia, scan untuk login:");
        console.log("\n");
        qrcode.generate(qr, { small: true });
        console.log("\n");
        emitQR(qr); // Emit QR ke semua client
        emitStatus(); // Emit status update
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          "❌ Koneksi ditutup karena:",
          lastDisconnect?.error,
          "reconnecting:",
          shouldReconnect,
        );

        // Jika logged out (device dihapus dari WhatsApp), cleanup dan reset
        if (statusCode === DisconnectReason.loggedOut) {
          console.log("🔄 Device dihapus dari WhatsApp, reset auth...");
          setState({ sock: null, qrCode: null });
          emitStatus(); // Emit status update
          emitQR(null); // Clear QR

          // Cleanup auth files
          await cleanupAuth();

          // Reconnect setelah cleanup
          console.log("🔄 Memulai koneksi baru untuk QR code...");
          setTimeout(() => connectToWhatsApp(), 2000);
        } else if (shouldReconnect) {
          console.log("🔄 Mencoba reconnect...");
          emitStatus(); // Emit status update
          setTimeout(() => connectToWhatsApp(), 5000);
        }
      } else if (connection === "open") {
        setState({ qrCode: null });
        console.log("✅ Koneksi WhatsApp terbuka");
        console.log("👤 User:", sock?.user);
        emitQR(null); // Clear QR
        emitStatus(); // Emit status update

        // Start queue processor when connection is open
        startQueueProcessor();
      }
    });

    // Handle pesan masuk
    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      const currentSock = getState().sock;
      if (currentSock) {
        await processIncomingMessage(currentSock, msg);
      }
    });
  }

  return { connectToWhatsApp };
}
