"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";
import DataTable from "@/components/data-table";
import { fetchRoles, type Role } from "@/lib/roles";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type UserRecord,
} from "@/lib/users";
import { toast } from "sonner";

const statusTone: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function UsersTable() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<UserRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRecord | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([fetchUsers(), fetchRoles()]);
      setData(usersRes.data);
      setRoles(rolesRes.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (email: string, password: string, roleIds: string[]) => {
    try {
      await createUser(email.trim(), password, roleIds);
      toast.success("User created");
      setCreateOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, email: string, password: string, roleIds: string[]) => {
    try {
      await updateUser(id, email.trim(), password, roleIds);
      toast.success("User updated");
      setEditOpen(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success("User deleted");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<ColumnDef<UserRecord>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        header: "Roles",
        cell: ({ row }) => {
          const names = row.original.roles?.map((r) => r.name).join(", ") || "No roles";
          return <span className="text-sm text-slate-700">{names}</span>;
        },
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.is_active ? "Active" : "Inactive";
          return (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone[status]}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(row.original)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Edit className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setConfirmDelete(row.original)}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        searchColumn="email"
        searchPlaceholder="Search users by email..."
        emptyMessage={loading ? "Loading..." : "No users found"}
        toolbar={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New user
          </button>
        }
      />

      {createOpen ? (
        <UserModal
          title="Create user"
          confirmLabel="Create"
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onSubmit={(email, password, roleIds) => void handleCreate(email, password, roleIds)}
        />
      ) : null}

      {editOpen ? (
        <UserModal
          title="Edit user"
          confirmLabel="Save"
          roles={roles}
          initialEmail={editOpen.email}
          initialSelected={editOpen.role_ids ?? []}
          requirePassword={false}
          onClose={() => setEditOpen(null)}
          onSubmit={(email, password, roleIds) => void handleUpdate(editOpen.id, email, password, roleIds)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete user"
          description={`Deactivate "${confirmDelete.email}" and remove access?`}
          confirmLabel="Delete"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete.id)}
        />
      ) : null}
    </>
  );
}

type UserModalProps = {
  title: string;
  confirmLabel: string;
  roles: Role[];
  initialEmail?: string;
  initialSelected?: string[];
  requirePassword?: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string, roleIds: string[]) => void;
};

function UserModal({
  title,
  confirmLabel,
  roles,
  initialEmail = "",
  initialSelected = [],
  requirePassword = true,
  onClose,
  onSubmit,
}: UserModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [roleQuery, setRoleQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(roleQuery.trim().toLowerCase()),
  );

  const toggleRole = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (requirePassword && password.trim().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!requirePassword && password.trim() !== "" && password.trim().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    onSubmit(email, password, Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">Assign one or more roles to this user.</p>

        <div className="mt-4 space-y-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">
              Password {requirePassword ? "" : "(leave blank to keep current)"}
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <div className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Roles</span>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={roleQuery}
                onChange={(event) => setRoleQuery(event.target.value)}
                placeholder="Search roles"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {filteredRoles.length === 0 ? (
                <p className="text-sm text-slate-500">No matching roles.</p>
              ) : (
                <div className="space-y-2">
                  {filteredRoles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected.has(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmModal({ title, description, confirmLabel, onClose, onConfirm }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsersTable;

