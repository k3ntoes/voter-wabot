import pino from "pino";

export const PORT = Number(process.env.PORT) || 3030;
export const API_TOKEN = process.env.API_TOKEN || "your-secret-api-token-here";
export const FE_URL = process.env.FE_URL || "http://localhost:3000";

export const logger = pino({
	level: process.env.LOG_LEVEL || "silent",
});

export const AUTH_PATH = process.env.AUTH_PATH || "./auth_info_baileys";

export const CORS_CONFIG = {
	origin: process.env.CORS_ORIGIN || "*",
	methods: ["GET", "POST"],
};

export const BROWSER_CONFIG = ["WhatsApp Bot", "Chrome", "1.0.0"] as const;

// Queue Configuration (Anti-Spam Protection)
export const QUEUE_CONFIG = {
	messagesPerMinute: Number(process.env.QUEUE_MSG_PER_MIN) || 10,
	messagesPerHour: Number(process.env.QUEUE_MSG_PER_HOUR) || 100,
	minDelay: Number(process.env.QUEUE_MIN_DELAY) || 3000, // 3 seconds
	maxDelay: Number(process.env.QUEUE_MAX_DELAY) || 8000, // 8 seconds
};

export const helpRegistrationMessage = `Silahkan gunakan format:\n\nNama: [Nama Lengkap]\nBidang: [Nama Bidang]\n\nAtau:\n[Nama] - [Bidang]\n\nContoh:\nNama: John Doe\nBidang: SDM TI\n\nAtau:\nJohn Doe - SDM TI`;
