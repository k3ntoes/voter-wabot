import type { WASocket } from "@whiskeysockets/baileys";

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random delay between min and max milliseconds
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get greeting based on current time
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return "Selamat pagi";
  } else if (hour >= 11 && hour < 15) {
    return "Selamat siang";
  } else if (hour >= 15 && hour < 19) {
    return "Selamat sore";
  } else {
    return "Selamat malam";
  }
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
    await delay(duration);
    await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    console.log("⚠️ Error simulasi typing:", error);
  }
}
