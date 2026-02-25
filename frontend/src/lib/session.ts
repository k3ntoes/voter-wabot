import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  deleteSessionByToken,
  findSessionByToken,
  saveSession,
} from "./dal/admins";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default-secret-key-change-in-production",
);

export type SessionPayload = {
  userId: number;
  username: string;
  expiresAt: Date;
};

const COOKIE_NAME = "session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(secret);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    // Invalid or expired token - this is expected behavior
    return null;
  }
}

export async function createSession(userId: number, username: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({ userId, username, expiresAt });

  await saveSession(userId, session, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  const dbSession = await findSessionByToken(cookie);
  if (!dbSession) return null;

  const session = await decrypt(cookie);
  if (!session) return null;

  if (new Date() > session.expiresAt) {
    return null;
  }

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  await deleteSessionByToken(cookieStore.get(COOKIE_NAME)?.value || "");
  cookieStore.delete(COOKIE_NAME);
}
