import type { QueueMessage, QueueStats } from "../types/queue";

/**
 * Message Queue Service with Rate Limiting
 * Prevents spam and WhatsApp blocking by queuing and rate-limiting messages
 */
export class MessageQueueService {
	private queue: QueueMessage[] = [];
	private processing = false;
	private stats: QueueStats = {
		queued: 0,
		processing: 0,
		completed: 0,
		failed: 0,
		totalProcessed: 0,
	};

	// Rate limiting settings
	private readonly messagesPerMinute: number;
	private readonly messagesPerHour: number;
	private readonly minDelayBetweenMessages: number; // milliseconds
	private readonly maxDelayBetweenMessages: number; // milliseconds

	// Track sent messages for rate limiting
	private sentTimesMinute: number[] = [];
	private sentTimesHour: number[] = [];
	private lastSentTime = 0;

	constructor(
		messagesPerMinute = 10,
		messagesPerHour = 100,
		minDelay = 3000,
		maxDelay = 8000,
	) {
		this.messagesPerMinute = messagesPerMinute;
		this.messagesPerHour = messagesPerHour;
		this.minDelayBetweenMessages = minDelay;
		this.maxDelayBetweenMessages = maxDelay;

		console.log("📊 Queue Settings:");
		console.log(`   • Max ${messagesPerMinute} messages/minute`);
		console.log(`   • Max ${messagesPerHour} messages/hour`);
		console.log(
			`   • Delay between messages: ${minDelay / 1000}-${maxDelay / 1000}s`,
		);
	}

	/**
	 * Add message to queue
	 */
	enqueue(
		from: string,
		message: string,
		reply: string,
		priority: "high" | "normal" | "low" = "normal",
	): string {
		const queueMessage: QueueMessage = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			from,
			message,
			reply,
			priority,
			timestamp: new Date(),
			retries: 0,
			maxRetries: 3,
		};

		// Insert based on priority
		if (priority === "high") {
			this.queue.unshift(queueMessage);
		} else if (priority === "low") {
			this.queue.push(queueMessage);
		} else {
			// Normal priority - insert after high priority messages
			const highPriorityCount = this.queue.filter(
				(m) => m.priority === "high",
			).length;
			this.queue.splice(highPriorityCount, 0, queueMessage);
		}

		this.stats.queued++;
		console.log(
			`📥 Message queued [${priority}]: ${from} (Queue size: ${this.queue.length})`,
		);

		// Start processing if not already running
		if (!this.processing) {
			this.processQueue();
		}

		return queueMessage.id;
	}

	/**
	 * Process queue with rate limiting
	 */
	private async processQueue() {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;
		console.log("⚙️  Queue processor started");

		while (this.queue.length > 0) {
			// Check rate limits
			if (!this.canSendMessage()) {
				const waitTime = this.getWaitTime();
				console.log(
					`⏸️  Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`,
				);
				await this.sleep(waitTime);
				continue;
			}

			// Get next message
			const message = this.queue.shift();
			if (!message) continue;

			this.stats.queued--;
			this.stats.processing++;

			try {
				// Calculate delay
				const delay = this.calculateDelay();
				console.log(
					`⏳ Processing message from ${message.from} (delay: ${delay / 1000}s)`,
				);

				// Wait for delay
				await this.sleep(delay);

				// Send message (this will be called by callback)
				const sent = await this.sendMessageCallback(message);

				if (sent) {
					this.recordSentMessage();
					this.stats.processing--;
					this.stats.completed++;
					this.stats.totalProcessed++;
					console.log(
						`✅ Message sent to ${message.from} (${this.stats.completed}/${this.stats.totalProcessed} total)`,
					);
				} else {
					throw new Error("Send failed");
				}
			} catch (error) {
				console.error(`❌ Error sending message to ${message.from}:`, error);

				// Retry logic
				if (message.retries < message.maxRetries) {
					message.retries++;
					console.log(
						`🔄 Retrying message to ${message.from} (${message.retries}/${message.maxRetries})`,
					);
					// Re-queue with lower priority
					this.queue.push(message);
					this.stats.queued++;
				} else {
					console.error(
						`❌ Message to ${message.from} failed after ${message.maxRetries} retries`,
					);
					this.stats.failed++;
				}

				this.stats.processing--;
			}
		}

		this.processing = false;
		console.log("⏹️  Queue processor stopped (queue empty)");
	}

	/**
	 * Check if we can send a message based on rate limits
	 */
	private canSendMessage(): boolean {
		const now = Date.now();

		// Clean up old timestamps
		this.sentTimesMinute = this.sentTimesMinute.filter(
			(time) => now - time < 60000,
		);
		this.sentTimesHour = this.sentTimesHour.filter(
			(time) => now - time < 3600000,
		);

		// Check rate limits
		if (this.sentTimesMinute.length >= this.messagesPerMinute) {
			return false;
		}

		if (this.sentTimesHour.length >= this.messagesPerHour) {
			return false;
		}

		// Check minimum delay between messages
		if (this.lastSentTime > 0) {
			const timeSinceLastMessage = now - this.lastSentTime;
			if (timeSinceLastMessage < this.minDelayBetweenMessages) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Calculate how long to wait before next message
	 */
	private getWaitTime(): number {
		const now = Date.now();

		// If we hit minute limit, wait until oldest message in minute window expires
		if (this.sentTimesMinute.length >= this.messagesPerMinute) {
			const oldestInMinute = Math.min(...this.sentTimesMinute);
			return 60000 - (now - oldestInMinute) + 1000; // +1s buffer
		}

		// If we hit hour limit, wait until oldest message in hour window expires
		if (this.sentTimesHour.length >= this.messagesPerHour) {
			const oldestInHour = Math.min(...this.sentTimesHour);
			return 3600000 - (now - oldestInHour) + 1000; // +1s buffer
		}

		// If we need to respect minimum delay
		if (this.lastSentTime > 0) {
			const timeSinceLastMessage = now - this.lastSentTime;
			if (timeSinceLastMessage < this.minDelayBetweenMessages) {
				return this.minDelayBetweenMessages - timeSinceLastMessage;
			}
		}

		return 0;
	}

	/**
	 * Calculate random delay between messages
	 */
	private calculateDelay(): number {
		return (
			Math.floor(
				Math.random() *
					(this.maxDelayBetweenMessages - this.minDelayBetweenMessages),
			) + this.minDelayBetweenMessages
		);
	}

	/**
	 * Record that a message was sent
	 */
	private recordSentMessage() {
		const now = Date.now();
		this.sentTimesMinute.push(now);
		this.sentTimesHour.push(now);
		this.lastSentTime = now;
	}

	/**
	 * Sleep utility
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Callback for actually sending the message
	 * This will be set by WhatsAppService
	 */
	private sendMessageCallback: (message: QueueMessage) => Promise<boolean> =
		async () => {
			console.warn("⚠️  Send message callback not set");
			return false;
		};

	/**
	 * Set the callback function for sending messages
	 */
	setSendCallback(callback: (message: QueueMessage) => Promise<boolean>) {
		this.sendMessageCallback = callback;
	}

	/**
	 * Get queue statistics
	 */
	getStats(): QueueStats {
		return { ...this.stats };
	}

	/**
	 * Get queue size
	 */
	getQueueSize(): number {
		return this.queue.length;
	}

	/**
	 * Clear the queue
	 */
	clearQueue(): number {
		const size = this.queue.length;
		this.queue = [];
		this.stats.queued = 0;
		console.log(`🗑️  Queue cleared (${size} messages removed)`);
		return size;
	}

	/**
	 * Get remaining capacity for this minute
	 */
	getRemainingCapacity(): { perMinute: number; perHour: number } {
		const now = Date.now();
		this.sentTimesMinute = this.sentTimesMinute.filter(
			(time) => now - time < 60000,
		);
		this.sentTimesHour = this.sentTimesHour.filter(
			(time) => now - time < 3600000,
		);

		return {
			perMinute: this.messagesPerMinute - this.sentTimesMinute.length,
			perHour: this.messagesPerHour - this.sentTimesHour.length,
		};
	}
}
