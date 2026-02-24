"use server";
import { cache } from "react";
import prisma from "../db";

export const getApiUrl = cache(async () => {
	return await prisma.apiUrl.findMany();
});

export const saveWaApiUrl = async (formData: FormData) => {
	const data = Object.fromEntries(formData.entries());
	try {
		await prisma.apiUrl.upsert({
			where: { id: "wa" },
			update: { url: data.url as string },
			create: { id: "wa", url: data.url as string },
		});

		return { success: true };
	} catch (error) {
		console.error("Error saving API URL:", error);
		return { success: false, error: "Failed to save API URL" };
	}
};
