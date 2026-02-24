import {
	DisconnectReason,
	fetchLatestBaileysVersion,
	isJidBroadcast,
	makeWASocket,
	type WASocket,
} from "@whiskeysockets/baileys";
import * as qrTerminal from "qrcode-terminal";
import { BROWSER_CONFIG, logger, QUEUE_CONFIG } from "../config";
import type { BotState, QueueMessage } from "../types";
import { sleep } from "../utils";
import { useDatabaseAuthState } from "../utils/auth-state";
import prisma from "../utils/db";
import { processIncomingMessage } from "./message-handlers";
import { cleanupOldMessages, processMessageQueue } from "./message-queue";
import { MessageQueueService } from "./message-queue.service";

export class WhatsAppService {
	private socket: WASocket | null = null;
	private onStateUpdate: (state: BotState) => void;
	private messageQueue: MessageQueueService;
	private queueProcessorInterval: NodeJS.Timeout | null = null;
	private setQueueProcessorInterval: (interval: NodeJS.Timeout | null) => void;
	private maxRetries = 3;
	private retryCount = 0;

	constructor(
		onStateUpdate: (state: BotState) => void,
		queueProcessorInterval: NodeJS.Timeout | null,
		setQueueProcessorInterval: (interval: NodeJS.Timeout | null) => void,
	) {
		this.queueProcessorInterval = queueProcessorInterval;
		this.setQueueProcessorInterval = setQueueProcessorInterval;
		this.onStateUpdate = onStateUpdate;

		// this.start(botState);

		// Initialize message queue with anti-spam settings
		this.messageQueue = new MessageQueueService(
			QUEUE_CONFIG.messagesPerMinute,
			QUEUE_CONFIG.messagesPerHour,
			QUEUE_CONFIG.minDelay,
			QUEUE_CONFIG.maxDelay,
		);

		// Set the callback for actually sending messages
		this.messageQueue.setSendCallback(async (queueMsg: QueueMessage) => {
			return await this.sendQueuedMessage(queueMsg);
		});
	}

	// Start queue processor
	startQueueProcessor() {
		if (this.queueProcessorInterval) {
			console.log("⚠️ Queue processor already running");
			return;
		}

		console.log("🚀 Starting message queue processor...");

		// Process queue every 10 seconds
		this.setQueueProcessorInterval(
			setInterval(async () => {
				if (this.socket) {
					await processMessageQueue(this.socket);
				}
			}, 10000),
		);

		// Cleanup old messages every hour
		setInterval(async () => {
			const deleted = await cleanupOldMessages();
			if (deleted > 0) {
				console.log(`🗑️ Cleaned up ${deleted} old messages`);
			}
		}, 3600000); // 1 hour
	}

	async start(botState: BotState): Promise<WASocket> {
		try {
			const { state, saveCreds } = await useDatabaseAuthState();
			const { version } = await fetchLatestBaileysVersion();

			this.socket = makeWASocket({
				version,
				logger,
				auth: state,
				printQRInTerminal: false,
				shouldIgnoreJid: (jid) => isJidBroadcast(jid),
				browser: BROWSER_CONFIG as [string, string, string],
			});

			this.setupConnectionHandler(botState);
			this.setupMessageHandler();
			this.setupErrorHandler(botState);
			this.socket.ev.on("creds.update", saveCreds);

			return this.socket;
		} catch (error) {
			console.error("❌ Failed to start WhatsApp service:", error);
			throw error;
		}
	}

	private setupConnectionHandler(botState: BotState) {
		if (!this.socket) return;

		this.socket.ev.on("connection.update", async (update) => {
			try {
				const { connection, lastDisconnect, qr } = update;

				if (qr) {
					botState.status = "qr";
					botState.qrCode = qr;
					this.onStateUpdate(botState);
					console.log("📱 QR Code generated! Scan with WhatsApp");
					qrTerminal.generate(qr, { small: true });
				}

				if (connection === "close") {
					const shouldReconnect =
						(lastDisconnect?.error as { output?: { statusCode?: number } })?.output
							?.statusCode !== DisconnectReason.loggedOut;
					botState.status = "disconnected";
					botState.qrCode = null;
					this.onStateUpdate(botState);

					console.log("❌ Connection closed. Reconnecting:", shouldReconnect);

					if (shouldReconnect) {
						if (this.retryCount < this.maxRetries) {
							this.retryCount++;
							console.log(
								`🔄 Attempting to reconnect... (${this.retryCount}/${this.maxRetries})`,
							);
							setTimeout(() => this.start(botState), 5000);
						} else {
							await this.removeCredentials(botState);
							this.start(botState);
							console.error(
								"❌ Max reconnection attempts reached. Please check the issue and restart the service.",
							);
						}
					} else {
						await this.removeCredentials(botState);
						this.start(botState);
					}
				} else if (connection === "open") {
					botState.status = "connected";
					botState.qrCode = null;
					botState.user = this.socket?.user;
					this.onStateUpdate(botState);
					console.log("✅ WhatsApp Connected!");

					this.startQueueProcessor();
				}
			} catch (error) {
				console.error("❌ Connection update error:", error);
			}
		});
	}

	private setupMessageHandler() {
		if (!this.socket) return;

		this.socket.ev.on("messages.upsert", async ({ messages }) => {
			const msg = messages[0];
			const socket = this.getSocket();
			if (socket && msg) {
				await processIncomingMessage(socket, msg);
			}
		});
	}

	private setupErrorHandler(_botState: BotState) {
		if (!this.socket) return;

		// Handle session errors (Bad MAC, decryption errors, etc.)
		this.socket.ev.on("creds.update", () => {
			// Session updated successfully
		});

		// Global error handler for uncaught errors
		this.socket.ev.on("messaging-history.set", ({ isLatest }) => {
			if (isLatest) {
				console.log("📱 Synced message history");
			}
		});

		// Log any errors during message decryption
		process.on("unhandledRejection", (error: Error) => {
			if (error?.message?.includes("Bad MAC")) {
				console.error("⚠️  Session decryption error detected (Bad MAC)");
				console.error("ℹ️  This usually means the session is corrupted.");
				console.error("ℹ️  Please run: bun run clean:auth && bun run dev");
				console.error("ℹ️  Then scan the QR code again.");
			}
		});
	}

	/**
	 * Actually send a message from the queue
	 */
	private async sendQueuedMessage(queueMsg: QueueMessage): Promise<boolean> {
		if (!this.socket) {
			console.error("❌ Socket not initialized");
			return false;
		}

		try {
			console.log(`📤 Sending message to ${queueMsg.from}...`);

			// Send typing indicator
			await this.socket.presenceSubscribe(queueMsg.from);
			await this.socket.sendPresenceUpdate("composing", queueMsg.from);

			// Simulate typing for realism (1-2 seconds)
			const typingDelay = Math.floor(Math.random() * 1000) + 1000;
			await sleep(typingDelay);

			// Stop typing indicator
			await this.socket.sendPresenceUpdate("paused", queueMsg.from);

			// Send the actual message
			await this.socket.sendMessage(queueMsg.from, { text: queueMsg.reply });

			return true;
		} catch (error) {
			console.error(`❌ Error sending queued message to ${queueMsg.from}:`, error);
			return false;
		}
	}

	async removeCredentials(botState: BotState) {
		console.log("🗑️ Removing credentials and resetting connection...");
		// Close socket if exists
		if (this.socket) {
			try {
				// Only logout if socket connection is still open
				if (this.socket.ws?.isOpen) {
					await this.socket.logout();
					console.log("✅ Socket logged out successfully");
				} else {
					console.log("ℹ️ Socket already closed, skipping logout");
				}
			} catch (error: unknown) {
				// Ignore connection closed errors as they're expected
				const statusCode = (error as { output?: { statusCode?: number } })?.output
					?.statusCode;
				if (statusCode === DisconnectReason.connectionClosed) {
					console.log("ℹ️ Socket connection already closed");
				} else {
					console.error("⚠️ Error closing socket:", error);
				}
			} finally {
				this.socket = null;
			}
		}

		// Clear queue processor
		if (this.queueProcessorInterval) {
			clearInterval(this.queueProcessorInterval);
			this.setQueueProcessorInterval(null);
			console.log("✅ Queue processor stopped");
		}

		// Reset retry count
		this.retryCount = 0;

		// Update bot state
		botState.status = "disconnected";
		botState.user = null;
		botState.qrCode = null;
		botState.sock = null;

		// Notify state update
		this.onStateUpdate(botState);

		// Delete credentials from database
		await prisma.$executeRawUnsafe(`DELETE FROM WhatsAppSession`);
		console.log("✅ Credentials removed from database");
	}

	getSocket(): WASocket | null {
		return this.socket;
	}

	getQueue(): MessageQueueService {
		return this.messageQueue;
	}
}
