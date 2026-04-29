"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Download, Edit, FileText, Plus, Trash2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { useAuth } from "@/context/auth-context";
import {
  createDocument,
  deleteDocument,
  fetchDocumentDownloadUrl,
  fetchDocuments,
  updateDocument,
  type DocumentItem,
} from "@/lib/documents";

type DocumentManagerProps = {
  category: string;
  title: string;
  subtitle: string;
};

export default function DocumentManager({ category, title, subtitle }: DocumentManagerProps) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<DocumentItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DocumentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await fetchDocuments(category, token);
      setData(rows);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [category, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshRoute = async () => {
    await load();
    router.replace(pathname);
    router.refresh();
  };

  const handleCreate = async (docName: string, docDescription: string, file: File | null) => {
    try {
      setSubmitting(true);
      await createDocument(
        {
          docName,
          docDescription,
          category,
          file,
        },
        token,
      );
      toast.success("Document created");
      setCreateOpen(false);
      await refreshRoute();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, docName: string, docDescription: string, file: File | null) => {
    try {
      setSubmitting(true);
      await updateDocument(
        id,
        {
          docName,
          docDescription,
          category,
          file,
        },
        token,
      );
      toast.success("Document updated");
      setEditOpen(null);
      await refreshRoute();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      await deleteDocument(id, token);
      toast.success("Document deleted");
      setConfirmDelete(null);
      await refreshRoute();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = useCallback(async (id: string) => {
    try {
      const url = await fetchDocumentDownloadUrl(id, token);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [token]);

  const columns = useMemo<ColumnDef<DocumentItem>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "doc_name",
      },
      {
        header: "Description",
        accessorKey: "doc_description",
        cell: ({ row }) => (
          <span className="max-w-[28rem] break-words">{row.original.doc_description || "-"}</span>
        ),
      },
      {
        header: "File Name",
        accessorKey: "file_name",
      },
      {
        header: "Processing Status",
        accessorKey: "processing_status",
        cell: ({ row }) => <ProcessingStatusBadge value={row.original.processing_status} />,
      },
      {
        header: "Created Date",
        accessorKey: "created_at",
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleDownload(row.original.id)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download
            </button>
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
    [handleDownload],
  );

  return (
    <section className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">{category} Documents</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New Document
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
        searchColumn="doc_name"
        searchPlaceholder="Search documents"
        emptyMessage={loading ? "Loading..." : "No documents found"}
      />

      {createOpen ? (
        <DocumentModal
          title="Create document"
          confirmLabel="Create"
          category={category}
          loading={submitting}
          onClose={() => setCreateOpen(false)}
          onSubmit={(docName, docDescription, file) => void handleCreate(docName, docDescription, file)}
        />
      ) : null}

      {editOpen ? (
        <DocumentModal
          title="Edit document"
          confirmLabel="Save"
          category={category}
          loading={submitting}
          initial={editOpen}
          onClose={() => setEditOpen(null)}
          onSubmit={(docName, docDescription, file) =>
            void handleUpdate(editOpen.id, docName, docDescription, file)
          }
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete document"
          description={`Delete "${confirmDelete.doc_name}"? This will set the document status to inactive.`}
          confirmLabel="Delete"
          loading={submitting}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete.id)}
        />
      ) : null}
    </section>
  );
}

type DocumentModalProps = {
  title: string;
  confirmLabel: string;
  category: string;
  loading: boolean;
  initial?: DocumentItem;
  onClose: () => void;
  onSubmit: (docName: string, docDescription: string, file: File | null) => void;
};

function DocumentModal({
  title,
  confirmLabel,
  category,
  loading,
  initial,
  onClose,
  onSubmit,
}: DocumentModalProps) {
  const [docName, setDocName] = useState(initial?.doc_name ?? "");
  const [docDescription, setDocDescription] = useState(initial?.doc_description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requireFile = !initial;

  const submit = () => {
    if (!docName.trim()) {
      setError("Title is required");
      return;
    }

    if (requireFile && !file) {
      setError("File is required");
      return;
    }

    onSubmit(docName.trim(), docDescription.trim(), file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-2 pr-8">
          <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">Category is automatically selected from this page.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={docName}
              onChange={(event) => {
                setDocName(event.target.value);
                setError(null);
              }}
              placeholder="Network Access Policy"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={docDescription}
              onChange={(event) => {
                setDocDescription(event.target.value);
                setError(null);
              }}
              placeholder="Optional short description"
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <div className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <input
              value={category}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
            />
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">
              {requireFile ? "Upload File" : "Replace File (optional)"}
            </span>
            <input
              type="file"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {initial?.file_name ? (
              <p className="text-xs text-slate-500">Current file: {initial.file_name}</p>
            ) : null}
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Saving..." : confirmLabel}
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
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmModal({ title, description, confirmLabel, loading, onClose, onConfirm }: ConfirmModalProps) {
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
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function ProcessingStatusBadge({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase();

  const stylesByStatus: Record<string, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    running: "border-sky-200 bg-sky-50 text-sky-700",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    failed: "border-red-200 bg-red-50 text-red-700",
  };

  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Unknown";
  const style = stylesByStatus[normalized] ?? "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex min-w-[6.5rem] justify-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
