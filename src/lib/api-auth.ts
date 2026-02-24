import { type NextRequest, NextResponse } from "next/server";

/**
 * Validates API token from request headers
 * @param request NextRequest object
 * @returns true if token is valid, false otherwise
 */
export function validateApiToken(request: NextRequest): boolean {
	const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
	console.log(apiToken);

	if (!apiToken) {
		console.error("API_TOKEN is not configured");
		return false;
	}

	const authHeader = request.headers.get("authorization");
	// const token = request.headers.get("x-api-token");

	// Support both Authorization: Bearer <token> and X-API-Token: <token>
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.substring(7) === apiToken;
	}

	// if (token) {
	// 	return token === apiToken;
	// }

	return false;
}

/**
 * Returns unauthorized response
 */
export function unauthorizedResponse() {
	return NextResponse.json(
		{ success: false, error: "Unauthorized: Invalid or missing API token" },
		{ status: 401 },
	);
}
