import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unauthorizedResponse, validateApiToken } from "@/lib/api-auth";
import prisma from "@/lib/db";

/**
 * POST /api/voters/create
 * Create a new voter
 * Requires API token authentication
 *
 * Request body:
 * {
 *   "phone": "628123456789",
 *   "name": "John Doe",
 *   "organization": "Organization Name",
 *   "status": "pending" (optional, defaults to "pending")
 * }
 */
export async function POST(request: NextRequest) {
	// Validate API token
	if (!validateApiToken(request)) {
		return unauthorizedResponse();
	}

	try {
		const body = await request.json();
		const { phone, name, organization, status } = body;

		// Validate required fields
		if (!phone || !name || !organization) {
			return NextResponse.json(
				{
					success: false,
					error:
						"Missing required fields: phone, name, and organization are required",
				},
				{ status: 400 },
			);
		}

		// Validate phone format (basic validation)
		if (typeof phone !== "string" || phone.trim().length === 0) {
			return NextResponse.json(
				{ success: false, error: "Invalid phone number" },
				{ status: 400 },
			);
		}

		// Check if voter already exists
		const existingVoter = await prisma.voter.findUnique({
			where: { phone },
		});

		if (existingVoter) {
			return NextResponse.json(
				{
					success: false,
					error: "Voter with this phone number already exists",
					data: existingVoter,
				},
				{ status: 409 },
			);
		}

		// Create new voter
		const voter = await prisma.voter.create({
			data: {
				phone,
				name,
				organization,
				status: status || "pending",
			},
		});

		return NextResponse.json(
			{
				success: true,
				data: voter,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error creating voter:", error);

		// Handle Prisma unique constraint errors
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return NextResponse.json(
				{
					success: false,
					error: "Voter with this phone number already exists",
				},
				{ status: 409 },
			);
		}

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}
