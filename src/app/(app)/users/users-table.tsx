"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import DataTable from "@/components/data-table";

type UserRow = {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

const users: UserRow[] = [
  {
    name: "Amanuel Tesfaye",
    email: "amanuel@smartdoc.local",
    role: "Admin",
    status: "Active",
    lastActive: "2 minutes ago",
  },
  {
    name: "Hanna Bekele",
    email: "hanna@smartdoc.local",
    role: "HR Manager",
    status: "Active",
    lastActive: "18 minutes ago",
  },
  {
    name: "Meron Gebru",
    email: "meron@smartdoc.local",
    role: "Finance Reviewer",
    status: "Invited",
    lastActive: "Pending first login",
  },
  {
    name: "Yohannes Alemu",
    email: "yohannes@smartdoc.local",
    role: "IT Auditor",
    status: "Suspended",
    lastActive: "3 days ago",
  },
  {
    name: "Rahel Desta",
    email: "rahel@smartdoc.local",
    role: "Operations Lead",
    status: "Active",
    lastActive: "Yesterday",
  },
  {
    name: "Samuel Fekadu",
    email: "samuel@smartdoc.local",
    role: "Viewer",
    status: "Invited",
    lastActive: "Pending first login",
  },
];

const statusTone: Record<UserRow["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Invited: "bg-amber-50 text-amber-700 ring-amber-200",
  Suspended: "bg-rose-50 text-rose-700 ring-rose-200",
};

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium text-slate-900">{row.original.name}</p>
        <p className="text-xs text-slate-500">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => row.original.role,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "lastActive",
    header: "Last Active",
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.lastActive}</span>
    ),
  },
];

export function UsersTable() {
  return (
    <DataTable
      columns={columns}
      data={users}
      searchColumn="name"
      searchPlaceholder="Search users by name..."
      emptyMessage="No users matched your search."
      toolbar={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Invite user
        </button>
      }
    />
  );
}

export default UsersTable;
