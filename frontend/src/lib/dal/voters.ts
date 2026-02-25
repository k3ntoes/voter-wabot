import "server-only";
import { cache } from "react";
import prisma from "../db";

export const findByPhone = cache(async (phone: string) => {
  return prisma.voter.findUnique({ where: { phone } });
});

export async function create({
  phone,
  name,
  organization,
}: {
  phone: string;
  name: string;
  organization: string;
}) {
  return prisma.voter.create({ data: { phone, name, organization } });
}

export const getAll = cache(async (status?: string) => {
  if (status) {
    return prisma.voter.findMany({
      where: { status },
      orderBy: { created_at: "desc" },
    });
  }
  return prisma.voter.findMany({ orderBy: { created_at: "desc" } });
});

export async function updateStatus(id: number, status: string) {
  return prisma.voter.update({ where: { id }, data: { status } });
}

export const getStats = cache(async () => {
  return prisma.voter.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
});

export async function deleteVoter(id: number) {
  return prisma.voter.delete({ where: { id } });
}

export async function updateVoter(
  id: number,
  data: { name?: string; organization?: string; phone?: string },
) {
  return prisma.voter.update({ where: { id }, data });
}

export async function deleteManyVoters(ids: number[]) {
  return prisma.voter.deleteMany({ where: { id: { in: ids } } });
}
