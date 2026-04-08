import { buildApiUrl } from "./request";

export type Permission = {
  id: string;
  name: string;
  is_active: boolean;
};

export type PermissionListResponse = {
  data: Permission[];
  total: number;
  page: number;
  page_size: number;
  search?: string;
};

const withPermissionHeader = (permission: string) => ({
  "Content-Type": "application/json",
  "X-Permission": permission,
});

export async function fetchPermissions(): Promise<PermissionListResponse> {
  debugger;
  const res = await fetch(buildApiUrl("/api/permissions"), {
   
    method: "GET",
    credentials: "include",
    headers: withPermissionHeader("view_permissions"),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load permissions");
  return res.json();
}

export async function createPermission(name: string): Promise<Permission> {
 
  const res = await fetch(buildApiUrl("/api/permissions"), {
    method: "POST",
    credentials: "include",
    headers: withPermissionHeader("create_permission"),
    body: JSON.stringify({ name }),
  });
  if (res.status === 409) throw new Error("Permission name already exists");
  if (!res.ok) throw new Error("Failed to create permission");
  return res.json();
}

export async function updatePermission(id: string, name: string): Promise<Permission> {
  const res = await fetch(buildApiUrl(`/api/permissions/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: withPermissionHeader("update_permission"),
    body: JSON.stringify({ name }),
  });
  if (res.status === 409) throw new Error("Permission name already exists");
  if (res.status === 404) throw new Error("Permission not found");
  if (!res.ok) throw new Error("Failed to update permission");
  return res.json();
}

export async function deletePermission(id: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/permissions/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: withPermissionHeader("delete_permission"),
  });
  if (res.status === 404) throw new Error("Permission not found");
  if (!res.ok) throw new Error("Failed to delete permission");
}
