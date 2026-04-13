import { buildApiUrl } from "./request";

export type Role = {
  id: string;
  name: string;
  is_active: boolean;
  permissions: { id: string; name: string; is_active: boolean }[];
  permission_count: number;
};

export type RoleListResponse = {
  data: Role[];
  total: number;
  page: number;
  page_size: number;
  search?: string;
};

const withPermissionHeader = (permission: string) => ({
  "Content-Type": "application/json",
  "X-Permission": permission,
});

export async function fetchRoles(): Promise<RoleListResponse> {
  const res = await fetch(buildApiUrl("/api/roles"), {
    method: "GET",
    credentials: "include",
    headers: withPermissionHeader("view_roles"),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load roles");
  return res.json();
}

export async function createRole(name: string, permissionIds: string[]): Promise<Role> {
  const res = await fetch(buildApiUrl("/api/roles"), {
    method: "POST",
    credentials: "include",
    headers: withPermissionHeader("create_roles"),
    body: JSON.stringify({ name, permission_ids: permissionIds }),
  });
  if (res.status === 409) throw new Error("Role name already exists");
  if (!res.ok) throw new Error("Failed to create role");
  return res.json();
}

export async function updateRole(id: string, name: string, permissionIds: string[]): Promise<Role> {
  const res = await fetch(buildApiUrl(`/api/roles/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: withPermissionHeader("update_roles"),
    body: JSON.stringify({ name, permission_ids: permissionIds }),
  });
  if (res.status === 404) throw new Error("Role not found");
  if (res.status === 409) throw new Error("Role name already exists");
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/roles/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: withPermissionHeader("delete_roles"),
  });
  if (res.status === 404) throw new Error("Role not found");
  if (!res.ok) throw new Error("Failed to delete role");
}
