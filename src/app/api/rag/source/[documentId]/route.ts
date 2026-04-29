import { NextResponse } from "next/server";

const getBaseApiUrl = () =>
  process.env.API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "";

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const params = await context.params;
  const documentId = typeof params.documentId === "string" ? params.documentId.trim() : "";

  if (!documentId) {
    return NextResponse.json({ error: "Document id is required." }, { status: 400 });
  }

  const baseUrl = getBaseApiUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "API base URL is not configured." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${baseUrl}/api/documents/${documentId}/download`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!res.ok || !payload.url) {
      return NextResponse.json(
        {
          error:
            payload.error ||
            "Could not resolve this source document. Ask an admin to verify document access.",
        },
        { status: res.status >= 500 ? 502 : res.status || 502 },
      );
    }

    return NextResponse.redirect(payload.url, { status: 302 });
  } catch {
    return NextResponse.json(
      { error: "Network error while resolving source link." },
      { status: 502 },
    );
  }
}
