"use client";

import { Check, Edit, MoreVertical, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  bulkDeleteVoters,
  bulkRejectVoters,
  bulkVerifyVoters,
  deleteVoter,
  rejectVoter,
  verifyVoter,
} from "@/app/actions/voters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditVoterDialog } from "./edit-voter-dialog";

type Voter = {
  id: number;
  phone: string;
  name: string;
  organization: string;
  status: string;
  created_at: Date;
};

export function VotersTable({
  voters,
  onUpdate,
}: {
  voters: Voter[];
  onUpdate?: () => void;
}) {
  const [loading, setLoading] = useState<number | null>(null);
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleVerify = async (id: number) => {
    setLoading(id);
    const result = await verifyVoter(id);
    setLoading(null);
    if (result.success) {
      toast.success("Voter verified successfully");
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to verify voter");
    }
  };

  const handleReject = async (id: number) => {
    setLoading(id);
    const result = await rejectVoter(id);
    setLoading(null);
    if (result.success) {
      toast.success("Voter rejected successfully");
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to reject voter");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this voter?")) return;

    setLoading(id);
    const result = await deleteVoter(id);
    setLoading(null);
    if (result.success) {
      toast.success("Voter deleted successfully");
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to delete voter");
    }
  };

  const handleBulkVerify = async () => {
    if (selectedVoters.length === 0) return;
    setBulkLoading(true);
    const result = await bulkVerifyVoters(selectedVoters);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedVoters.length} voters verified`);
      setSelectedVoters([]);
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to verify voters");
    }
  };

  const handleBulkReject = async () => {
    if (selectedVoters.length === 0) return;
    setBulkLoading(true);
    const result = await bulkRejectVoters(selectedVoters);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedVoters.length} voters rejected`);
      setSelectedVoters([]);
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to reject voters");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVoters.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedVoters.length} voters?`,
      )
    )
      return;

    setBulkLoading(true);
    const result = await bulkDeleteVoters(selectedVoters);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedVoters.length} voters deleted`);
      setSelectedVoters([]);
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to delete voters");
    }
  };

  const toggleSelectVoter = (id: number) => {
    setSelectedVoters((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedVoters.length === voters.length) {
      setSelectedVoters([]);
    } else {
      setSelectedVoters(voters.map((v) => v.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      {selectedVoters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted p-3">
          <span className="text-sm font-medium">
            {selectedVoters.length} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleBulkVerify}
              disabled={bulkLoading}
            >
              <Check className="mr-1 h-4 w-4" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkReject}
              disabled={bulkLoading}
            >
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkLoading}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    voters.length > 0 && selectedVoters.length === voters.length
                  }
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No voters registered yet
                </TableCell>
              </TableRow>
            ) : (
              voters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedVoters.includes(voter.id)}
                      onChange={() => toggleSelectVoter(voter.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {voter.phone}
                  </TableCell>
                  <TableCell>{voter.name}</TableCell>
                  <TableCell>{voter.organization}</TableCell>
                  <TableCell>{getStatusBadge(voter.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(voter.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {voter.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleVerify(voter.id)}
                            disabled={loading === voter.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(voter.id)}
                            disabled={loading === voter.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={loading === voter.id}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingVoter(voter)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {voter.status !== "verified" && (
                            <DropdownMenuItem
                              onClick={() => handleVerify(voter.id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Verify
                            </DropdownMenuItem>
                          )}
                          {voter.status !== "rejected" && (
                            <DropdownMenuItem
                              onClick={() => handleReject(voter.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(voter.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditVoterDialog
        voter={editingVoter}
        open={editingVoter !== null}
        onOpenChange={(open) => !open && setEditingVoter(null)}
        onUpdate={onUpdate}
      />
    </>
  );
}
