import type { WASocket } from "@whiskeysockets/baileys";

// Get greeting based on time
export function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour >= 0 && hour < 11) {
		return "Selamat Pagi";
	} else if (hour >= 11 && hour < 15) {
		return "Selamat Siang";
	} else if (hour >= 15 && hour < 18) {
		return "Selamat Sore";
	} else {
		return "Selamat Malam";
	}
}

// Random delay between 2-8 seconds to avoid blocking
export function getRandomDelay(): number {
	return Math.floor(Math.random() * 6000) + 2000; // 2-8 seconds
}

/**
 * Generate random delay between min and max milliseconds
 */
export function randomDelay(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sleep function
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate typing indicator to make bot responses more natural
 */
export async function simulateTyping(
	sock: WASocket,
	jid: string,
	duration: number,
) {
	try {
		await sock.sendPresenceUpdate("composing", jid);
		await sleep(duration);
		await sock.sendPresenceUpdate("paused", jid);
	} catch (error) {
		console.log("⚠️ Error simulasi typing:", error);
	}
}

/**
 * Extract phone number from WhatsApp JID
 */
export function extractPhoneNumber(jid: string): string {
	// Format: 6281234567890@s.whatsapp.net -> 6281234567890
	return jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
}
