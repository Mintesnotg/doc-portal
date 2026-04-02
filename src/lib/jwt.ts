export type DecodedToken = {
  uid?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
};

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decodeBase64 = () =>
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");

    const payload = decodeBase64();
    return JSON.parse(payload) as DecodedToken;
  } catch {
    return null;
  }
}
