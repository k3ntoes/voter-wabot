import { NextResponse } from "next/server";

const WHATSAPP_SERVER_URL =
  process.env.WHATSAPP_SERVER_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/queue/stats`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting queue stats:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to WhatsApp server",
      },
      { status: 500 },
    );
  }
}
