import "server-only";
import bcrypt from "bcryptjs";
import prisma from "./db";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function seedAdmin() {
  const count = await prisma.admin.count();
  if (count === 0) {
    const password_hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    await prisma.admin.create({
      data: {
        username: ADMIN_USERNAME,
        password_hash,
      },
    });
  }
}
