import "server-only";
import prisma from "./db";

export interface QueueMessage {
  phone: string;
  message: string;
}

/**
 * Message Queue Manager
 * Handles persistent message queue in database
 */
export const MessageQueueManager = {
  MAX_ATTEMPTS: 3,

  /**
   * Add message to queue
   */
  async enqueue(phone: string, message: string): Promise<void> {
    await prisma.messageQueue.create({
      data: {
        phone,
        message,
        status: "pending",
      },
    });
  },

  /**
   * Get pending messages from queue
   */
  async getPending(limit = 10): Promise<
    Array<{
      id: number;
      phone: string;
      message: string;
      attempts: number;
    }>
  > {
    return prisma.messageQueue.findMany({
      where: {
        status: "pending",
        attempts: { lt: MessageQueueManager.MAX_ATTEMPTS },
      },
      orderBy: { created_at: "asc" },
      take: limit,
    });
  },

  /**
   * Mark message as sent
   */
  async markSent(id: number): Promise<void> {
    await prisma.messageQueue.update({
      where: { id },
      data: {
        status: "sent",
        sent_at: new Date(),
      },
    });
  },

  /**
   * Mark message as failed
   */
  async markFailed(id: number, error: string): Promise<void> {
    const message = await prisma.messageQueue.findUnique({
      where: { id },
    });

    if (!message) return;

    const newAttempts = message.attempts + 1;

    await prisma.messageQueue.update({
      where: { id },
      data: {
        attempts: newAttempts,
        error,
        status:
          newAttempts >= MessageQueueManager.MAX_ATTEMPTS
            ? "failed"
            : "pending",
      },
    });
  },

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
  }> {
    const [pending, sent, failed] = await Promise.all([
      prisma.messageQueue.count({ where: { status: "pending" } }),
      prisma.messageQueue.count({ where: { status: "sent" } }),
      prisma.messageQueue.count({ where: { status: "failed" } }),
    ]);

    return { pending, sent, failed };
  },

  /**
   * Clean up old messages (older than 7 days)
   */
  async cleanup(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.messageQueue.deleteMany({
      where: {
        status: { in: ["sent", "failed"] },
        created_at: { lt: sevenDaysAgo },
      },
    });

    return result.count;
  },
};
