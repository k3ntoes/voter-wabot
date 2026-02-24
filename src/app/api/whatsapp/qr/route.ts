import { NextResponse } from "next/server";

const WHATSAPP_SERVICE_URL =
  process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/qr`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching QR code:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage, qr: null },
      { status: 500 },
    );
  }
}
