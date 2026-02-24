"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
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
import type { Voter } from "@/types/voter";
import { EditVoterDialog } from "./edit-voter-dialog";

interface VotersDataTableProps {
  data: Voter[];
  onUpdate?: () => void;
}

export function VotersDataTable({ data, onUpdate }: VotersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
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
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    const result = await bulkVerifyVoters(selectedIds);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedIds.length} voters verified`);
      setRowSelection({});
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to verify voters");
    }
  };

  const handleBulkReject = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    const result = await bulkRejectVoters(selectedIds);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedIds.length} voters rejected`);
      setRowSelection({});
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to reject voters");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} voters?`)
    )
      return;

    setBulkLoading(true);
    const result = await bulkDeleteVoters(selectedIds);
    setBulkLoading(false);
    if (result.success) {
      toast.success(`${selectedIds.length} voters deleted`);
      setRowSelection({});
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to delete voters");
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

  const columns: ColumnDef<Voter>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="h-4 w-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("phone")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "organization",
      header: "Organization",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "created_at",
      header: "Registered",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue("created_at")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const voter = row.original;

        return (
          <div className="flex justify-end gap-2">
            {voter.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleVerify(voter.id)}
                  disabled={loading === voter.id}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(voter.id)}
                  disabled={loading === voter.id}
                >
                  <X className="mr-1 h-4 w-4" />
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
                <DropdownMenuItem onClick={() => setEditingVoter(voter)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {voter.status !== "verified" && (
                  <DropdownMenuItem onClick={() => handleVerify(voter.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Verify
                  </DropdownMenuItem>
                )}
                {voter.status !== "rejected" && (
                  <DropdownMenuItem onClick={() => handleReject(voter.id)}>
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
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
          <span className="text-sm font-medium">{selectedCount} selected</span>
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No voters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 &&
            `${selectedCount} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <EditVoterDialog
        voter={editingVoter}
        open={editingVoter !== null}
        onOpenChange={(open) => !open && setEditingVoter(null)}
        onUpdate={onUpdate}
      />
    </div>
  );
}
