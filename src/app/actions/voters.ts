"use server";

import { revalidatePath } from "next/cache";
import {
  deleteManyVoters,
  deleteVoter as deleteVoterDAL,
  getAll,
  updateStatus,
  updateVoter as updateVoterDAL,
} from "@/lib/dal/voters";

export async function getAllVoters() {
  try {
    const voters = await getAll();
    return { success: true, data: voters };
  } catch {
    return { success: false, error: "Failed to fetch voters", data: [] };
  }
}

export async function verifyVoter(id: number) {
  try {
    await updateStatus(id, "verified");
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to verify voter" };
  }
}

export async function rejectVoter(id: number) {
  try {
    await updateStatus(id, "rejected");
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to reject voter" };
  }
}

export async function deleteVoter(id: number) {
  try {
    await deleteVoterDAL(id);
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete voter" };
  }
}

export async function updateVoter(
  id: number,
  data: { name?: string; organization?: string; phone?: string },
) {
  try {
    await updateVoterDAL(id, data);
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update voter" };
  }
}

export async function bulkDeleteVoters(ids: number[]) {
  try {
    await deleteManyVoters(ids);
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete voters" };
  }
}

export async function bulkVerifyVoters(ids: number[]) {
  try {
    await Promise.all(ids.map((id) => updateStatus(id, "verified")));
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to verify voters" };
  }
}

export async function bulkRejectVoters(ids: number[]) {
  try {
    await Promise.all(ids.map((id) => updateStatus(id, "rejected")));
    revalidatePath("/dashboard/voters");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to reject voters" };
  }
}
