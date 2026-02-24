import "server-only";
import { cache } from "react";
import prisma from "../db";

export const findByUsername = cache(async (username: string) => {
  return prisma.admin.findUnique({ where: { username } });
});

export async function createAdmin(username: string, password_hash: string) {
  return prisma.admin.create({ data: { username, password_hash } });
}

export const saveSession = async (
  adminId: number,
  sessionToken: string,
  expiresAt: Date,
) => {
  const existing = await prisma.session.findUnique({
    where: { token: sessionToken },
  });

  if (existing) {
    return await prisma.session.update({
      where: { token: sessionToken },
      data: { expires_at: expiresAt },
    });
  }

  return await prisma.session.create({
    data: {
      admin_id: adminId,
      token: sessionToken,
      expires_at: expiresAt,
    },
  });
};

export const deleteSessionByToken = async (token: string) => {
  await prisma.session.deleteMany({ where: { token } });
};

export const findSessionByToken = async (token: string) => {
  return prisma.session.findUnique({ where: { token } });
};
