import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteVoters,
  bulkRejectVoters,
  bulkVerifyVoters,
  deleteVoter,
  getAllVoters,
  rejectVoter,
  updateVoter,
  verifyVoter,
} from "@/app/actions/voters";
import type { Voter } from "@/types/voter";

export function useVoters(initialData?: Voter[]) {
  return useQuery({
    queryKey: ["voters"],
    queryFn: async () => {
      const result = await getAllVoters();
      return result.success ? result.data : [];
    },
    initialData,
  });
}

export function useVerifyVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => verifyVoter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useRejectVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rejectVoter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useDeleteVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteVoter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useUpdateVoter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; organization?: string; phone?: string };
    }) => updateVoter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useBulkVerifyVoters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => bulkVerifyVoters(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useBulkRejectVoters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => bulkRejectVoters(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}

export function useBulkDeleteVoters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => bulkDeleteVoters(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    },
  });
}
