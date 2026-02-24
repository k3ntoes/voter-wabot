import type { WASocket } from "@whiskeysockets/baileys";
import { randomDelay, simulateTyping, sleep } from "../utils";
import prisma from "../utils/db";

/**
 * Queue message for delayed sending
 */
export async function queueMessage(
	phone: string,
	message: string,
): Promise<void> {
	try {
		await prisma.messageQueue.create({
			data: {
				phone,
				message,
				status: "pending",
			},
		});
		console.log(`📤 Message queued for ${phone}`);
	} catch (error) {
		console.error("Error queueing message:", error);
	}
}

/**
 * Process message queue and send messages
 */
export async function processMessageQueue(sock: WASocket): Promise<void> {
	try {
		// Get pending messages (limit to 5 per batch)
		const pendingMessages = await prisma.messageQueue.findMany({
			where: {
				status: "pending",
				attempts: { lt: 3 }, // Max 3 attempts
			},
			orderBy: { created_at: "asc" },
			take: 5,
		});

		if (pendingMessages.length === 0) {
			return;
		}

		console.log(`📬 Processing ${pendingMessages.length} queued messages...`);

		for (const queuedMsg of pendingMessages) {
			try {
				const jid = queuedMsg.phone.includes("@")
					? queuedMsg.phone
					: `${queuedMsg.phone}@s.whatsapp.net`;

				// Simulate typing before sending
				const typingDuration = randomDelay(2000, 4000);
				await simulateTyping(sock, jid, typingDuration);

				// Send message
				await sock.sendMessage(jid, { text: queuedMsg.message });

				// Mark as sent
				await prisma.messageQueue.update({
					where: { id: queuedMsg.id },
					data: {
						status: "sent",
						sent_at: new Date(),
					},
				});

				console.log(`✅ Message sent to ${queuedMsg.phone}`);

				// Delay between messages (3-7 seconds to avoid spam detection)
				const messageDelay = randomDelay(3000, 7000);
				await sleep(messageDelay);
			} catch (error) {
				console.error(`❌ Error sending message to ${queuedMsg.phone}:`, error);

				// Increment attempts
				await prisma.messageQueue.update({
					where: { id: queuedMsg.id },
					data: {
						attempts: { increment: 1 },
						error: error instanceof Error ? error.message : "Unknown error",
						status: queuedMsg.attempts + 1 >= 3 ? "failed" : "pending",
					},
				});
			}
		}

		console.log("✅ Queue processing batch completed");
	} catch (error) {
		console.error("Error processing message queue:", error);
	}
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
	const [pending, sent, failed] = await Promise.all([
		prisma.messageQueue.count({ where: { status: "pending" } }),
		prisma.messageQueue.count({ where: { status: "sent" } }),
		prisma.messageQueue.count({ where: { status: "failed" } }),
	]);

	return { pending, sent, failed };
}

/**
 * Cleanup old messages (older than 7 days)
 */
export async function cleanupOldMessages(): Promise<number> {
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const result = await prisma.messageQueue.deleteMany({
		where: {
			status: { in: ["sent", "failed"] },
			created_at: { lt: sevenDaysAgo },
		},
	});

	return result.count;
}
