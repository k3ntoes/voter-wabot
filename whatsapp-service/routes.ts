import type { WASocket } from "@whiskeysockets/baileys";
import type { Express, Request, Response } from "express";
import prisma from "./db";
import { delay } from "./helpers";
import { getQueueStats } from "./message-queue";

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
 * Setup REST API routes for WhatsApp service
 * Used for Next.js app integration (backward compatibility)
 */
export function setupRoutes(
  app: Express,
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
  /**
   * GET /api/qr
   * Get current QR code for WhatsApp authentication
   */
  app.get("/api/qr", (_req: Request, res: Response) => {
    const { qrCode } = getState();
    res.json({ qr: qrCode });
  });

  /**
   * GET /api/status
   * Get WhatsApp connection status
   */
  app.get("/api/status", (_req: Request, res: Response) => {
    const { sock, qrCode } = getState();
    res.json({
      connected: sock?.user ? true : false,
      online: sock?.user ? true : false,
      user: sock?.user || null,
      hasQR: qrCode ? true : false,
    });
  });

  /**
   * POST /api/send-message
   * Send WhatsApp message directly (bypasses queue)
   * Body: { to: string, message: string }
   */
  app.post("/api/send-message", async (req: Request, res: Response) => {
    try {
      const { to, message } = req.body;
      const { sock } = getState();

      if (!sock || !sock.user) {
        return res.status(503).json({ error: "WhatsApp tidak terkoneksi" });
      }

      // Format nomor: pastikan ada @s.whatsapp.net
      const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

      await sock.sendMessage(jid, { text: message });
      res.json({ success: true, message: "Pesan terkirim" });
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * POST /api/start
   * Start WhatsApp connection
   */
  app.post("/api/start", async (_req: Request, res: Response) => {
    try {
      const { sock } = getState();

      if (sock?.user) {
        return res.json({
          success: true,
          message: "WhatsApp sudah terkoneksi",
        });
      }

      await connectToWhatsApp();
      res.json({ success: true, message: "Memulai koneksi WhatsApp..." });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * POST /api/stop
   * Stop WhatsApp connection
   */
  app.post("/api/stop", async (_req: Request, res: Response) => {
    try {
      const { sock } = getState();

      if (sock) {
        await sock.logout();
        setState({ sock: null, qrCode: null });
        stopQueueProcessor();
        emitStatus();
        emitQR(null);
        res.json({ success: true, message: "WhatsApp disconnected" });
      } else {
        res.json({
          success: true,
          message: "WhatsApp sudah tidak terkoneksi",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * POST /api/reset
   * Reset WhatsApp connection and clear auth
   */
  app.post("/api/reset", async (_req: Request, res: Response) => {
    try {
      const { sock } = getState();

      // Logout jika terkoneksi
      if (sock) {
        await sock.logout();
        setState({ sock: null, qrCode: null });
      }

      // Hapus auth files
      await cleanupAuth();

      // Tunggu sebentar sebelum reconnect
      await delay(1000);

      // Restart koneksi
      await connectToWhatsApp();

      res.json({
        success: true,
        message: "WhatsApp connection direset, silakan scan QR code kembali",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * GET /api/queue/stats
   * Get message queue statistics
   */
  app.get("/api/queue/stats", async (_req: Request, res: Response) => {
    try {
      const stats = await getQueueStats();
      res.json(stats);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
