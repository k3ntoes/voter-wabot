import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unauthorizedResponse, validateApiToken } from "@/lib/api-auth";
import prisma from "@/lib/db";
import type { Voter } from "@/lib/prisma/client";

/**
 * GET /api/voters/find
 * Find a unique voter by phone or id
 * Requires API token authentication
 *
 * Query parameters:
 * - phone: string (optional) - Phone number of the voter
 * - id: number (optional) - ID of the voter
 *
 * Example:
 * GET /api/voters/find?phone=6285925092603
 * GET /api/voters/find?id=123
 */
export async function GET(request: NextRequest) {
	// Validate API token
	if (!validateApiToken(request)) {
		return unauthorizedResponse();
	}

	try {
		const { searchParams } = new URL(request.url);
		const phone = searchParams.get("phone");
		const idParam = searchParams.get("id");

		// Validate that at least one parameter is provided
		if (!phone && !idParam) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required parameter: provide either 'phone' or 'id'",
				},
				{ status: 400 },
			);
		}

		// Build query
		let voter: Voter | null = null;
		if (idParam) {
			const id = Number.parseInt(idParam, 10);
			if (Number.isNaN(id)) {
				return NextResponse.json(
					{ success: false, error: "Invalid id: must be a number" },
					{ status: 400 },
				);
			}
			voter = await prisma.voter.findUnique({
				where: { id },
			});
		} else if (phone) {
			voter = await prisma.voter.findUnique({
				where: { phone },
			});
		}

		if (!voter) {
			return NextResponse.json(
				{ success: false, error: "Voter not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			data: voter,
		});
	} catch (error) {
		console.error("Error finding voter:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}
