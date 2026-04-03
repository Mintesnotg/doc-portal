"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type AuthUser = {
  uid?: string;
  email?: string;
};

type AuthContextValue = {
  token?: string;
  permissions: string[];
  roleIds: string[];
  user?: AuthUser;
  setPermissions: (permissions: string[]) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialPermissions = [],
  initialRoleIds = [],
  initialUser,
  token,
}: PropsWithChildren<{
  initialPermissions?: string[];
  initialRoleIds?: string[];
  initialUser?: AuthUser;
  token?: string;
}>) {
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);

  const value = useMemo(
    () => ({
      token,
      permissions,
      roleIds: initialRoleIds,
      user: initialUser,
      setPermissions,
    }),
    [permissions, initialRoleIds, initialUser, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
