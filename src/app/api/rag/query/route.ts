import { NextRequest, NextResponse } from "next/server";
import type { RAGQueryRequest, RAGQueryResponse } from "@/lib/rag";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

type BackendRagResponse = {
  answer?: string;
  sources?: string[];
  contexts?: string[];
  error?: string;
};

const getBaseApiUrl = () =>
  process.env.API_BASE_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "";

export async function POST(request: NextRequest) {
  const baseUrl = getBaseApiUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "API base URL is not configured." },
      { status: 500 },
    );
  }

  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    request.cookies.get("__Host-token")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("access_token")?.value ||
    "";

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RAGQueryRequest;
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const topK = typeof body.top_k === "number" ? body.top_k : 5;

  if (question.length < 3) {
    return NextResponse.json(
      { error: "Please enter a question to continue." },
      { status: 400 },
    );
  }

  try {
    const ragRes = await fetch(`${baseUrl}/api/rag/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Permission: "query_rag",
        "X-Permission": "query_rag",
      },
      cache: "no-store",
      body: JSON.stringify({
        question,
        category,
        top_k: topK,
      }),
    });

    const payload = (await ragRes.json().catch(() => ({}))) as BackendRagResponse;

    if (!ragRes.ok) {
      const status = ragRes.status >= 500 ? 502 : ragRes.status;
      return NextResponse.json(
        {
          error:
            payload.error ||
            "The assistant could not generate a response right now.",
        },
        { status },
      );
    }

    const answer = typeof payload.answer === "string" ? payload.answer : "";
    const contexts = Array.isArray(payload.contexts)
      ? payload.contexts.filter((item): item is string => typeof item === "string")
      : [];

    const sourceIds = Array.isArray(payload.sources)
      ? payload.sources.filter((item): item is string => typeof item === "string")
      : [];

    const uniqueSourceIds = Array.from(new Set(sourceIds));

    const response: RAGQueryResponse = {
      answer,
      contexts,
      timestamp: new Date().toISOString(),
      confidence: Math.min(0.98, 0.45 + contexts.length * 0.08),
      sources: uniqueSourceIds.map((id) => ({
        id,
        title: `Document ${id.slice(0, 8)}`,
        url: `/api/rag/source/${encodeURIComponent(id)}`,
      })),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Network error while querying the assistant." },
      { status: 502 },
    );
  }
}
