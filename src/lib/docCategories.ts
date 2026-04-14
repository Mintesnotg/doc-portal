import { buildApiUrl } from "./request";

export type DocCategory = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const withPermissionHeader = (permission: string) => ({
  "Content-Type": "application/json",
  "X-Permission": permission,
});

export async function fetchDocCategories(): Promise<DocCategory[]> {
  debugger;
  const res = await fetch(buildApiUrl("/api/doc-categories"), {
   
    method: "GET",
    credentials: "include",
    headers: withPermissionHeader("view_docs_categories"),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load document categories");
  return res.json();
}

export async function createDocCategory(payload: { name: string; description?: string }): Promise<DocCategory> {
  const res = await fetch(buildApiUrl("/api/doc-categories"), {
    method: "POST",
    credentials: "include",
    headers: withPermissionHeader("create_doc_category"),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create document category");
  return res.json();
}

export async function updateDocCategory(id: string, payload: { name: string; description?: string }): Promise<DocCategory> {
  const res = await fetch(buildApiUrl(`/api/doc-categories/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: withPermissionHeader("update_doc_category"),
    body: JSON.stringify(payload),
  });
  if (res.status === 404) throw new Error("Document category not found");
  if (!res.ok) throw new Error("Failed to update document category");
  return res.json();
}

export async function deleteDocCategory(id: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/doc-categories/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: withPermissionHeader("delete_doc_category"),
  });
  if (res.status === 404) throw new Error("Document category not found");
  if (!res.ok) throw new Error("Failed to delete document category");
}
