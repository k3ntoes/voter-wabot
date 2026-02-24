import "server-only";
import { cache } from "react";
import prisma from "../db";

export const findByUsername = cache(async (username: string) => {
  return prisma.admin.findUnique({ where: { username } });
});

export async function createAdmin(username: string, password_hash: string) {
  return prisma.admin.create({ data: { username, password_hash } });
}
