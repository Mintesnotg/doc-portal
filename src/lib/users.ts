import { buildApiUrl } from "./request";

export type UserRole = {
  id: string;
  name: string;
};

export type UserRecord = {
  id: string;
  email: string;
  is_active: boolean;
  role_ids: string[];
  roles: UserRole[];
  created_at: string;
  updated_at: string;
};

export type UserListResponse = {
  data: UserRecord[];
  total: number;
  page: number;
  page_size: number;
  search?: string;
};

const headers = (permission: string) => ({
  "Content-Type": "application/json",
  "X-Permission": permission,
});

export async function fetchUsers(search = ""): Promise<UserListResponse> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const res = await fetch(buildApiUrl(`/api/users${query}`), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: headers("view_users"),
  });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export async function createUser(email: string, password: string, roleIds: string[]): Promise<UserRecord> {
  const res = await fetch(buildApiUrl("/api/users"), {
    method: "POST",
    credentials: "include",
    headers: headers("create_users"),
    body: JSON.stringify({ email, password, role_ids: roleIds }),
  });
  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function updateUser(id: string, email: string, password: string, roleIds: string[]): Promise<UserRecord> {
  const res = await fetch(buildApiUrl(`/api/users/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: headers("update_users"),
    body: JSON.stringify({ email, password, role_ids: roleIds }),
  });
  if (res.status === 404) throw new Error("User not found");
  if (res.status === 409) throw new Error("Email already registered");
  if (!res.ok) throw new Error("Failed to update user");
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(buildApiUrl(`/api/users/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: headers("delete_users"),
  });
  if (res.status === 404) throw new Error("User not found");
  if (!res.ok) throw new Error("Failed to delete user");
}

export async function assignRolesToUser(id: string, roleIds: string[]): Promise<UserRole[]> {
  const res = await fetch(buildApiUrl(`/api/users/${id}/roles`), {
    method: "POST",
    credentials: "include",
    headers: headers("manage_user_roles"),
    body: JSON.stringify({ role_ids: roleIds }),
  });
  if (res.status === 404) throw new Error("User not found");
  if (!res.ok) throw new Error("Failed to assign roles");
  const payload = (await res.json()) as { data: UserRole[] };
  return payload.data ?? [];
}

export async function removeRoleFromUser(id: string, roleId: string): Promise<UserRole[]> {
  const res = await fetch(buildApiUrl(`/api/users/${id}/roles/${roleId}`), {
    method: "DELETE",
    credentials: "include",
    headers: headers("manage_user_roles"),
  });
  if (res.status === 404) throw new Error("User or role not found");
  if (!res.ok) throw new Error("Failed to remove role");
  const payload = (await res.json()) as { data: UserRole[] };
  return payload.data ?? [];
}

