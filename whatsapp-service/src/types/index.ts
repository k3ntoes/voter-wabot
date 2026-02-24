import type { Contact, WASocket } from "@whiskeysockets/baileys";

// Message log interface
export interface MessageLog {
	id: string;
	from: string;
	message: string;
	reply: string;
	timestamp: Date;
	delay: number;
	status: "received" | "queued" | "typing" | "sent" | "failed";
}

// Bot state
export interface BotState {
	sock: WASocket | null;
	status: "disconnected" | "connecting" | "connected" | "qr";
	qrCode: string | null;
	user?: Contact | null;
	logs: MessageLog[];
}

// Export queue types
export type { QueueMessage, QueueStats } from "./queue";
