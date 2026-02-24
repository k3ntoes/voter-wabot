import type { proto, WASocket } from "@whiskeysockets/baileys";
import { delay, randomDelay } from "./helpers";
import { queueMessage } from "./message-queue";
import {
  handleRegistration,
  isRegistrationMessage,
} from "./registration-handler";

/**
 * Extract text from various message types
 */
export function extractMessageText(msg: proto.IWebMessageInfo): string {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";

  return text;
}

/**
 * Handle greeting messages (hallo/halo)
 */
async function handleGreeting(phone: string) {
  const hour = new Date().getHours();
  let greeting = "Selamat malam";

  if (hour >= 5 && hour < 11) {
    greeting = "Selamat pagi";
  } else if (hour >= 11 && hour < 15) {
    greeting = "Selamat siang";
  } else if (hour >= 15 && hour < 19) {
    greeting = "Selamat sore";
  }

  const helpText = `${greeting}! 👋\n\n📝 *Cara Daftar Pemilih:*\n\nKirim pesan dengan format:\nNama: [Nama Lengkap]\nBidang: [Nama Bidang]\n\nContoh:\nNama: John Doe\nBidang: SDM TI\n\nAtau format singkat:\nJohn Doe - SDM TI`;

  // Add to queue instead of sending directly
  await queueMessage(phone, helpText);
  console.log("✅ Greeting response queued");
}

/**
 * Handle ping messages
 */
async function handlePing(phone: string) {
  await queueMessage(
    phone,
    "🏓 Pong! Bot aktif dan siap menerima pendaftaran.",
  );
  console.log("✅ Pong response queued");
}

/**
 * Process incoming message and route to appropriate handler
 */
export async function processIncomingMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo,
) {
  // Skip if no message or from self
  if (!msg.message || !msg.key || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  console.log("📨 Pesan dari:", jid);

  const text = extractMessageText(msg);
  console.log("📝 Text pesan:", text);

  if (!jid || !text) return;

  // Extract phone number
  const phone = jid.replace("@s.whatsapp.net", "").replace("@g.us", "");

  // Delay awal sebelum mulai proses (1-3 detik)
  const initialDelay = randomDelay(1000, 3000);
  await delay(initialDelay);

  const lowerText = text.toLowerCase();

  // Route to appropriate handler based on message content
  // 1. Check for greeting
  if (
    lowerText.includes("hallo") ||
    lowerText.includes("halo") ||
    lowerText === "hi" ||
    lowerText === "hai"
  ) {
    await handleGreeting(phone);
  }
  // 2. Check for ping
  else if (lowerText.includes("ping")) {
    await handlePing(phone);
  }
  // 3. Check for registration
  else if (isRegistrationMessage(text)) {
    await handleRegistration(sock, jid, text);
  }
  // 4. Default: provide help message
  else {
    const helpMessage = `ℹ️ Perintah yang tersedia:\n\n1️⃣ Ketik "halo" untuk panduan pendaftaran\n2️⃣ Kirim format:\nNama: [Nama Anda]\nBidang: [Bidang Anda]\n\nUntuk mendaftar sebagai pemilih.`;
    await queueMessage(phone, helpMessage);
  }
}
