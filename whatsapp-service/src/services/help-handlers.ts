import type { WASocket } from "@whiskeysockets/baileys";
import { helpRegistrationMessage } from "../config";
import { extractPhoneNumber } from "../utils";
import { queueMessage } from "./message-queue";

export async function handleHelpMessage(
	_sock: WASocket,
	jid: string,
	text: string,
): Promise<void> {
	let pesan = "";
	if (text.includes("register") || text.includes("daftar")) {
		pesan = helpRegistrationMessage;
	} else {
		pesan = `Halo!, silahkan gunakan kata help / bantuan [option] untuk mendapatkan panduan.\nContoh:\nhelp register\n\nAtau:\n bantuan pendaftaran`;
	}
	const phone = extractPhoneNumber(jid);

	await queueMessage(phone, pesan);
}
