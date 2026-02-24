import { createServer } from "node:http";
import type { WASocket } from "@whiskeysockets/baileys";
import cors from "cors";
import express from "express";
import { Server as SocketIOServer } from "socket.io";
import { createWhatsAppConnection } from "./connection";
import { cleanupOldMessages, processMessageQueue } from "./message-queue";
import { setupRoutes } from "./routes";
import { setupSocketHandlers } from "./socket-handlers";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store aktif sesi
let sock: WASocket | null = null;
let qrCode: string | null = null;

// Queue processor interval
let queueProcessorInterval: NodeJS.Timeout | null = null;

// Start queue processor
function startQueueProcessor() {
  if (queueProcessorInterval) {
    console.log("⚠️ Queue processor already running");
    return;
  }

  console.log("🚀 Starting message queue processor...");

  // Process queue every 10 seconds
  queueProcessorInterval = setInterval(async () => {
    if (sock?.user) {
      await processMessageQueue(sock);
    }
  }, 10000);

  // Cleanup old messages every hour
  setInterval(async () => {
    const deleted = await cleanupOldMessages();
    if (deleted > 0) {
      console.log(`🗑️ Cleaned up ${deleted} old messages`);
    }
  }, 3600000); // 1 hour
}

// Stop queue processor
function stopQueueProcessor() {
  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
    queueProcessorInterval = null;
    console.log("⏹️ Queue processor stopped");
  }
}

// Fungsi untuk emit status ke semua client
function emitStatus() {
  io.emit("status", {
    connected: sock?.user ? true : false,
    online: sock?.user ? true : false,
    user: sock?.user || null,
    hasQR: qrCode ? true : false,
  });
}

// Fungsi untuk emit QR code ke semua client
function emitQR(qr: string | null) {
  io.emit("qr", { qr });
}

// Helper functions untuk routes
function getState() {
  return { sock, qrCode };
}

function setState(updates: { sock?: WASocket | null; qrCode?: string | null }) {
  if ("sock" in updates) sock = updates.sock ?? null;
  if ("qrCode" in updates) qrCode = updates.qrCode ?? null;
}

// Create WhatsApp connection handler
const { connectToWhatsApp } = createWhatsAppConnection(
  getState,
  setState,
  emitStatus,
  emitQR,
  startQueueProcessor,
);

// Setup Socket.IO handlers (for real-time Next.js communication)
setupSocketHandlers(
  io,
  getState,
  setState,
  connectToWhatsApp,
  stopQueueProcessor,
  emitStatus,
  emitQR,
);

// Setup REST API routes (for Next.js backward compatibility)
setupRoutes(
  app,
  getState,
  setState,
  connectToWhatsApp,
  stopQueueProcessor,
  emitStatus,
  emitQR,
);

// Start service
const PORT = process.env.WHATSAPP_SERVICE_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WhatsApp service running di port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO ready for connections`);
  connectToWhatsApp();
});
