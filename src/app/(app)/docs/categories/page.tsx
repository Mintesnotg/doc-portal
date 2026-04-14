"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  createDocCategory,
  deleteDocCategory,
  fetchDocCategories,
  updateDocCategory,
  type DocCategory,
} from "@/lib/docCategories";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DocCategoriesPage() {
  const [data, setData] = useState<DocCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<DocCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocCategory | null>(null);
  const router = useRouter();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchDocCategories();
      debugger;
      setData(res);
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

  const handleCreate = async (name: string, description: string) => {
    try {
      await createDocCategory({ name: name.trim(), description: description.trim() });
      toast.success("Document category created");
      setCreateOpen(false);
      await load();
      router.replace("/docs/categories");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdate = async (id: string, name: string, description: string) => {
    try {
      await updateDocCategory(id, { name: name.trim(), description: description.trim() });
      toast.success("Document category updated");
      setEditOpen(null);
      await load();
      router.replace("/docs/categories");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocCategory(id);
      toast.success("Document category deleted");
      setConfirmDelete(null);
      await load();
      router.replace("/docs/categories");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const columns = useMemo<ColumnDef<DocCategory>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Description", accessorKey: "description" },
      { header: "Status", accessorKey: "status" },
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
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Documents</p>
          <h1 className="text-2xl font-semibold text-slate-900">Document Categories</h1>
          <p className="text-sm text-slate-600">Organize documents by category.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Category
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
        searchPlaceholder="Search categories"
        emptyMessage={loading ? "Loading..." : "No categories found"}
      />

      {createOpen ? (
        <DocCategoryModal
          title="Create category"
          confirmLabel="Create"
          onClose={() => setCreateOpen(false)}
          onSubmit={(name, desc) => void handleCreate(name, desc)}
        />
      ) : null}

      {editOpen ? (
        <DocCategoryModal
          title="Edit category"
          confirmLabel="Save"
          initialName={editOpen.name}
          initialDescription={editOpen.description}
          onClose={() => setEditOpen(null)}
          onSubmit={(name, desc) => void handleUpdate(editOpen.id, name, desc)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete category"
          description={`Delete “${confirmDelete.name}”? This will mark it inactive.`}
          confirmLabel="Delete"
          tone="danger"
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete.id)}
        />
      ) : null}
    </section>
  );
}

type DocCategoryModalProps = {
  title: string;
  confirmLabel: string;
  initialName?: string;
  initialDescription?: string;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
};

function DocCategoryModal({ title, confirmLabel, initialName = "", initialDescription = "", onClose, onSubmit }: DocCategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit(name, description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-emerald-50 text-emerald-700 p-2">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">Add a clear name and optional description.</p>
          </div>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Policies"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Docs for HR policies"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            rows={3}
          />
        </label>

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
