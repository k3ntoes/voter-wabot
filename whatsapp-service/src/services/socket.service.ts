import { Server as HttpServer } from "node:http";
import * as qrcode from "qrcode-terminal";
import { Server as SocketServer } from "socket.io";
import { CORS_CONFIG } from "../config";
import type { BotState } from "../types";
import { sleep } from "../utils";
import { WhatsAppService } from "./whatsapp.service";

export class SocketIOService {
	private httpServer: HttpServer;
	private io: SocketServer;
	private botState: BotState;
	private queueProcessorInterval: NodeJS.Timeout | null = null;
	private setQueueProcessorInterval: (interval: NodeJS.Timeout | null) => void;
	private whatsappService: WhatsAppService | null = null;

	constructor(
		botState: BotState,
		queueProcessorInterval: NodeJS.Timeout | null,
		setQueueProcessorInterval: (interval: NodeJS.Timeout | null) => void,
	) {
		this.queueProcessorInterval = queueProcessorInterval;
		this.setQueueProcessorInterval = setQueueProcessorInterval;
		this.botState = botState;
		this.httpServer = new HttpServer();
		this.io = new SocketServer(this.httpServer, {
			cors: CORS_CONFIG,
			// Note: Bun shows ws.WebSocket warnings but works fine
			transports: ["polling", "websocket"],
		});

		this.setupSocketHandlers();
	}

	setWhatsAppService(service: WhatsAppService) {
		this.whatsappService = service;
	}

	private setupSocketHandlers() {
		this.io.on("connection", (socket) => {
			console.log("📱 Frontend connected");
			this.emitState();

			socket.on("disconnect", () => {
				console.log("📱 Frontend disconnected");
			});

			// Handle start WhatsApp
			socket.on("action:start", async () => {
				try {
					if (this.botState.user) {
						this.io.emit("action:result", {
							success: true,
							message: "WhatsApp sudah terkoneksi",
						});
						return;
					}

					console.log("🚀 Starting WhatsApp connection...");
					console.log(this.botState);

					await this.whatsappService?.start(this.botState);
					this.io.emit("action:result", {
						success: true,
						message: "Memulai koneksi WhatsApp...",
					});
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					this.io.emit("action:result", {
						success: false,
						error: errorMessage,
					});
				}
			});

			// Handle stop WhatsApp
			socket.on("action:stop", async () => {
				try {
					if (this.botState.sock) {
						await this.botState.sock.logout();
						this.botState.sock = null;
						this.botState.qrCode = null;
						const ws = new WhatsAppService(
							() => {
								this.emitState();
							},
							this.queueProcessorInterval,
							this.setQueueProcessorInterval,
						);
						ws.start(this.botState);
						this.io.emit("action:result", {
							success: true,
							message: "WhatsApp disconnected",
						});
					} else {
						this.io.emit("action:result", {
							success: true,
							message: "WhatsApp sudah tidak terkoneksi",
						});
					}
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					this.io.emit("action:result", {
						success: false,
						error: errorMessage,
					});
				}
			});

			// Handle reset WhatsApp
			socket.on("action:reset", async () => {
				try {
					console.log("🔄 Resetting WhatsApp connection...");

					if (this.whatsappService) {
						await this.whatsappService.removeCredentials(this.botState);
						console.log("✅ Credentials removed successfully");
					}

					// Emit updated state to frontend
					this.emitState();

					await sleep(1000);

					this.io.emit("action:result", {
						success: true,
						message:
							"WhatsApp connection direset, silakan scan QR code kembali",
					});
				} catch (error: unknown) {
					console.error("❌ Error during reset:", error);
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					this.io.emit("action:result", {
						success: false,
						error: errorMessage,
					});
				}
			});
		});
	}

	emitState() {
		this.io.emit("status", {
			connected: this.botState.status === "connected",
			online: this.botState.status === "connected",
			user: this.botState.user || null,
			hasQR: this.botState.qrCode !== null,
		});

		// Kirim QR code jika ada
		if (this.botState.qrCode) {
			qrcode.generate(this.botState.qrCode, { small: true });
			this.io.emit("qr", { qr: this.botState.qrCode });
		}
	}

	listen(port: number, callback: () => void) {
		this.httpServer.on("error", (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				console.error(`❌ Port ${port} is already in use`);
				process.exit(1);
			} else {
				console.error("❌ Server error:", error);
				process.exit(1);
			}
		});

		this.httpServer.listen(port, callback);
	}

	getIO(): SocketServer {
		return this.io;
	}
}
