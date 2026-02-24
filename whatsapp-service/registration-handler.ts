import type { WASocket } from "@whiskeysockets/baileys";
import prisma from "./db";
import { queueMessage } from "./message-queue";

/**
 * Parse registration data from message
 * Expected format:
 * Nama: John Doe
 * Bidang: ABC Corp
 *
 * OR single line:
 * John Doe - ABC Corp
 */
export function parseRegistrationData(text: string): {
  name: string;
  organization: string;
} | null {
  console.log(text);
  // Try multi-line format first
  const nameMatch = text.match(/nama\s*:\s*(.+)/i);
  const orgMatch = text.match(/bidang\s*:\s*(.+)/i);

  if (nameMatch && orgMatch) {
    return {
      name: nameMatch[1].trim(),
      organization: orgMatch[1].trim(),
    };
  }

  // Try single line format with separator (-, |, /)
  const singleLineMatch = text.match(/^(.+?)\s*[-|/]\s*(.+)$/);
  if (singleLineMatch) {
    const name = singleLineMatch[1].trim();
    const organization = singleLineMatch[2].trim();

    // Validate minimum length
    if (name.length >= 3 && organization.length >= 2) {
      return { name, organization };
    }
  }

  return null;
}

/**
 * Extract phone number from WhatsApp JID
 */
export function extractPhoneNumber(jid: string): string {
  // Format: 6281234567890@s.whatsapp.net -> 6281234567890
  return jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
}

export function replacePhoneWith0(phone: string): string {
  if (phone.startsWith("62")) {
    return `0${phone.slice(2)}`;
  }
  return phone;
}

/**
 * Check if voter already registered
 */
async function isVoterRegistered(phone: string): Promise<boolean> {
  const voter = await prisma.voter.findUnique({
    where: { phone },
  });
  return !!voter;
}

/**
 * Save new voter to database
 */
async function saveVoter(
  phone: string,
  name: string,
  organization: string,
): Promise<boolean> {
  try {
    await prisma.voter.create({
      data: {
        phone,
        name,
        organization,
        status: "pending", // Default status, akan diverifikasi admin
      },
    });
    return true;
  } catch (error) {
    console.error("Error saving voter:", error);
    return false;
  }
}

/**
 * Handle voter registration
 */
export async function handleRegistration(
  _sock: WASocket,
  jid: string,
  text: string,
): Promise<void> {
  const phone = extractPhoneNumber(jid);

  console.log(`📋 Processing registration for: ${phone}`);

  // Parse registration data
  const data = parseRegistrationData(text);

  if (!data) {
    // Invalid format
    const helpMessage = `❌ Format pendaftaran tidak valid.\n\n✅ Format yang benar:\nNama: [Nama Lengkap]\nBidang: [Nama Bidang]\n\nAtau:\n[Nama] - [Bidang]\n\nContoh:\nNama: John Doe\nBidang: SDM TI\n\nAtau:\nJohn Doe - SDM TI`;

    // Add to queue instead of sending directly
    await queueMessage(phone, helpMessage);

    console.log("⚠️ Invalid registration format");
    return;
  }

  // Check if already registered
  const alreadyRegistered = await isVoterRegistered(replacePhoneWith0(phone));

  if (alreadyRegistered) {
    const rejectionMessage = `⚠️ Nomor ${replacePhoneWith0(phone)} sudah terdaftar sebelumnya.\n\nJika ada perubahan data, silakan hubungi admin.`;

    // Add to queue
    await queueMessage(phone, rejectionMessage);

    console.log(`⚠️ Phone ${replacePhoneWith0(phone)} already registered`);
    return;
  }

  // Save to database
  const saved = await saveVoter(
    replacePhoneWith0(phone),
    data.name,
    data.organization,
  );

  if (saved) {
    const successMessage = `✅ Pendaftaran berhasil!\n\nNama: ${data.name}\nBidang: ${data.organization}\n\nData Anda akan diverifikasi oleh admin. Terima kasih! 🙏`;

    // Add to queue
    await queueMessage(phone, successMessage);

    console.log(`✅ Registration successful for ${phone}`);
  } else {
    const errorMessage = `❌ Maaf, terjadi kesalahan saat menyimpan data.\n\nSilakan coba lagi beberapa saat.`;

    // Add to queue
    await queueMessage(phone, errorMessage);

    console.log(`❌ Failed to save registration for ${phone}`);
  }
}

/**
 * Check if message looks like a registration attempt
 */
export function isRegistrationMessage(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Check for registration keywords
  if (lowerText.includes("daftar") || lowerText.includes("registrasi")) {
    return true;
  }

  // Check for registration format patterns
  if (lowerText.includes("nama:") && lowerText.includes("bidang:")) {
    return true;
  }

  // Check for single line format with separator
  if (/^.+\s*[-|/]\s*.+$/.test(text) && text.length > 5) {
    // Might be registration format
    const parts = text.split(/[-|/]/);
    if (
      parts.length === 2 &&
      parts[0].trim().length >= 3 &&
      parts[1].trim().length >= 2
    ) {
      return true;
    }
  }

  return false;
}
