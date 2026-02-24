import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../prisma-client/client";

// Path to database (parent directory's data folder)
const adapter = new PrismaLibSql({
	url: process.env.DATABASE_URL || "file:./data/wa.db",
});

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
