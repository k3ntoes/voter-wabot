import { PORT } from "./config";
import { SocketIOService } from "./services/socket.service";
import { WhatsAppService } from "./services/whatsapp.service";
import type { BotState } from "./types";

// Queue processor interval
let queueProcessorInterval: NodeJS.Timeout | null = null;

function setQueueProcessorInterval(interval: NodeJS.Timeout | null) {
	queueProcessorInterval = interval;
}

// Initialize bot state
const botState: BotState = {
	sock: null,
	status: "disconnected",
	qrCode: null,
	user: null,
	logs: [],
};

// Initialize Socket.IO service
const socketService = new SocketIOService(
	botState,
	queueProcessorInterval,
	setQueueProcessorInterval,
);

// Initialize WhatsApp service with state update callback
const whatsappService = new WhatsAppService(
	() => {
		socketService.emitState();
	},
	queueProcessorInterval,
	setQueueProcessorInterval,
);

// Link whatsapp service to socket service
socketService.setWhatsAppService(whatsappService);

// Start server
socketService.listen(PORT, () => {
	console.log(`🚀 WhatsApp Bot Service running on port ${PORT}`);
	console.log(`📡 WebSocket available for frontend connection`);
	console.log(
		`ℹ️  Note: ws.WebSocket warnings from Socket.IO are normal in Bun and can be ignored`,
	);

	// Start WhatsApp connection
	whatsappService.start(botState);
});
