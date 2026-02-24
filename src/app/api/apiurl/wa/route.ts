import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
	try {
		const apiUrl = await prisma.apiUrl.findUnique({
			where: { id: "wa" },
		});
		return NextResponse.json({ success: true, data: apiUrl });
	} catch (error) {
		console.error("Error fetching API URL:", error);
		return NextResponse.json(
			{ success: false, data: "", error: "Failed to fetch API URL" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const data = Object.fromEntries(formData.entries());
	try {
		await prisma.apiUrl.upsert({
			where: { id: "wa" },
			update: { url: data.url as string },
			create: { id: "wa", url: data.url as string },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving API URL:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to save API URL" },
			{ status: 500 },
		);
	}
}
