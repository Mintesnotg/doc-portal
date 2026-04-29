"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, Search, Trash2, X } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { fetchPermissions, type Permission } from "@/lib/permissions";
import {
  createRole,
  deleteRole,
  fetchRoles,
  updateRole,
  type Role,
} from "@/lib/roles";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RolesPage() {
  const [data, setData] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Role | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setLoading(true);
      const [roleRes, permRes] = await Promise.all([fetchRoles(), fetchPermissions()]);
      setData(roleRes.data);
      setPermissions(permRes.data ?? []);
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

  const handleCreate = async (name: string, permissionIds: string[]) => {
    try {
      await createRole(name.trim(), permissionIds);
      toast.success("Role created");
      setCreateOpen(false);
      await load();
      router.replace("/roles");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, name: string, permissionIds: string[]) => {
    try {
      await updateRole(id, name.trim(), permissionIds);
      toast.success("Role updated");
      setEditOpen(null);
      await load();
      router.replace("/roles");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      toast.success("Role deleted");
      setConfirmDelete(null);
      await load();
      router.replace("/roles");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "Permissions",
        accessorKey: "permission_count",
        cell: ({ row }) => <span>{row.original.permission_count}</span>,
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
    <section className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Security</p>
          <h1 className="text-2xl font-semibold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-600">Manage roles and their permissions.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Role
        </button>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Search roles"
        emptyMessage={loading ? "Loading..." : "No roles found"}
      />

      {createOpen ? (
        <RoleModal
          title="Create role"
          confirmLabel="Create"
          permissions={permissions}
          onClose={() => setCreateOpen(false)}
          onSubmit={(name, permIds) => void handleCreate(name, permIds)}
        />
      ) : null}

      {editOpen ? (
        <RoleModal
          title="Edit role"
          confirmLabel="Save"
          permissions={permissions}
          initialName={editOpen.name}
          initialSelected={editOpen.permissions ? editOpen.permissions.map((p) => p.id) : []}
          onClose={() => setEditOpen(null)}
          onSubmit={(name, permIds) => void handleUpdate(editOpen.id, name, permIds)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete role"
          description={`Delete "${confirmDelete.name}"? This will deactivate it and remove access for assigned users.`}
          confirmLabel="Delete"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete.id)}
        />
      ) : null}
    </section>
  );
}

type RoleModalProps = {
  title: string;
  confirmLabel: string;
  permissions: Permission[];
  initialName?: string;
  initialSelected?: string[];
  onClose: () => void;
  onSubmit: (name: string, permissionIds: string[]) => void;
};

function RoleModal({ title, confirmLabel, permissions, initialName = "", initialSelected = [], onClose, onSubmit }: RoleModalProps) {
  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [permissionQuery, setPermissionQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const filteredPermissions = permissions.filter((perm) =>
    perm.name.toLowerCase().includes(permissionQuery.trim().toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit(name, Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 pr-8">
          <div className="rounded-md bg-emerald-50 text-emerald-700 p-2">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">Select permissions to attach to this role.</p>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Role name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="admin"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="mt-5 space-y-2">
          <p className="text-sm font-medium text-slate-700">Permissions</p>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={permissionQuery}
              onChange={(e) => setPermissionQuery(e.target.value)}
              placeholder="Search permissions"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
        </div>

        <div className="max-h-60 overflow-auto rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
          {permissions.length === 0 ? (
            <p className="text-sm text-slate-500">No permissions available.</p>
          ) : filteredPermissions.length === 0 ? (
            <p className="text-sm text-slate-500">No matching permissions.</p>
          ) : (
            filteredPermissions.map((perm) => (
              <label key={perm.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.has(perm.id)}
                  onChange={() => toggle(perm.id)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{perm.name}</span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
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
  tone?: "danger" | "info";
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmModal({ title, description, confirmLabel, tone = "danger", onClose, onConfirm }: ConfirmModalProps) {
  const danger = tone === "danger";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow ${danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

