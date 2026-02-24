export interface QueueMessage {
	id: string;
	from: string;
	message: string;
	reply: string;
	priority: "high" | "normal" | "low";
	timestamp: Date;
	retries: number;
	maxRetries: number;
}

export interface QueueStats {
	queued: number;
	processing: number;
	completed: number;
	failed: number;
	totalProcessed: number;
}
