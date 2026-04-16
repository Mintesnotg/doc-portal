import { buildApiUrl } from "./request";

export type DocumentItem = {
  id: string;
  doc_name: string;
  doc_description: string;
  category_id: string;
  category_name: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
};

type DocumentListResponse = {
  data: DocumentItem[];
};

type DocumentMutationInput = {
  docName: string;
  docDescription?: string;
  category: string;
  file?: File | null;
};

const DOCUMENT_PERMISSION = "document.manage";

function buildAuthHeaders(permission: string, token?: string, asJSON?: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Permission: permission,
    "X-Permission": permission,
  };

  if (asJSON) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseError(res: Response, fallback: string) {
  const payload = (await res.json().catch(() => null)) as { error?: string } | null;
  return payload?.error || fallback;
}

export async function fetchDocuments(category: string, token?: string): Promise<DocumentItem[]> {
  const endpoint = buildApiUrl("/api/documents");
  const url = `${endpoint}?category=${encodeURIComponent(category)}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: buildAuthHeaders(DOCUMENT_PERMISSION, token),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to load documents"));
  }

  const data = (await res.json()) as DocumentListResponse;
  return data.data ?? [];
}

export async function createDocument(input: DocumentMutationInput, token?: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.set("doc_name", input.docName);
  formData.set("doc_description", input.docDescription ?? "");
  formData.set("category", input.category);
  if (input.file) {
    formData.set("file", input.file);
  }

  const res = await fetch(buildApiUrl("/api/documents"), {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(DOCUMENT_PERMISSION, token),
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to create document"));
  }

  return res.json();
}

export async function updateDocument(
  id: string,
  input: DocumentMutationInput,
  token?: string,
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.set("doc_name", input.docName);
  formData.set("doc_description", input.docDescription ?? "");
  formData.set("category", input.category);
  if (input.file) {
    formData.set("file", input.file);
  }

  const res = await fetch(buildApiUrl(`/api/documents/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: buildAuthHeaders(DOCUMENT_PERMISSION, token),
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to update document"));
  }

  return res.json();
}

export async function deleteDocument(id: string, token?: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/documents/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: buildAuthHeaders(DOCUMENT_PERMISSION, token),
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to delete document"));
  }
}

export async function fetchDocumentDownloadUrl(id: string, token?: string): Promise<string> {
  const res = await fetch(buildApiUrl(`/api/documents/${id}/download`), {
    method: "GET",
    credentials: "include",
    headers: buildAuthHeaders(DOCUMENT_PERMISSION, token),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await parseError(res, "Failed to get download URL"));
  }

  const payload = (await res.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Missing download URL");
  }
  return payload.url;
}
