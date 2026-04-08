"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Plus, Shield } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  createPermission,
  deletePermission,
  fetchPermissions,
  updatePermission,
  type Permission,
} from "@/lib/permissions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PermissionsPage() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Permission | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Permission | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchPermissions();
      debugger;
      setData(res.data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.log(err)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async (name: string) => {
    try {
      await createPermission(name.trim());
      toast.success("Permission created");
      setCreateOpen(false);
      await load();
      router.replace("/permissions");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    try {
      await updatePermission(id, name.trim());
      toast.success("Permission updated");
      setEditOpen(null);
      await load();
      router.replace("/permissions");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePermission(id);
      toast.success("Permission deleted");
      setConfirmDelete(null);
      await load();
      router.replace("/permissions");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<ColumnDef<Permission>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "Status",
        accessorKey: "is_active",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.original.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </span>
        ),
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
          <h1 className="text-2xl font-semibold text-slate-900">Permissions</h1>
          <p className="text-sm text-slate-600">Manage granular access claims used across the portal.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Permission
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
        searchPlaceholder="Search permissions"
        emptyMessage={loading ? "Loading..." : "No permissions found"}
      />

      {createOpen ? (
        <PermissionModal
          title="Create permission"
          confirmLabel="Create"
          onClose={() => setCreateOpen(false)}
          onSubmit={(name) => void handleCreate(name)}
        />
      ) : null}

      {editOpen ? (
        <PermissionModal
          title="Edit permission"
          confirmLabel="Save"
          initialName={editOpen.name}
          onClose={() => setEditOpen(null)}
          onSubmit={(name) => void handleUpdate(editOpen.id, name)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete permission"
          description={`Are you sure you want to delete “${confirmDelete.name}”? This will deactivate it for all users.`}
          confirmLabel="Delete"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete.id)}
        />
      ) : null}
    </section>
  );
}

type PermissionModalProps = {
  title: string;
  confirmLabel: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

function PermissionModal({ title, confirmLabel, initialName = "", onClose, onSubmit }: PermissionModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-emerald-50 text-emerald-700 p-2">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">Define a unique permission name (e.g., view_users).</p>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Permission name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="view_users"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
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
