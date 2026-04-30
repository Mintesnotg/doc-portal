"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Copy, Loader2, RefreshCcw, Send, Trash2, User } from "lucide-react";
import type { RAGQueryResponse, RAGSource } from "@/lib/rag";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

type MessageStatus = "done" | "loading" | "error";
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status: MessageStatus;
  prompt?: string;
  sources?: RAGSource[];
  contexts?: string[];
  confidence?: number;
  error?: string;
};

const now = () => new Date().toISOString();

export default function ChatbotClient() {
  const { permissions } = useAuth();
  const canQuery = permissions.includes("query_rag");

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const requestControllerRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const generationRunIdRef = useRef<string | null>(null);
  const stopStreamRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  const stopGeneration = (fallbackText: string) => {
    stopStreamRef.current = true;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsSending(false);

    const assistantId = activeAssistantIdRef.current;
    if (!assistantId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              status: "done",
              timestamp: now(),
              content: m.content.trim() || fallbackText,
            }
          : m,
      ),
    );
    activeAssistantIdRef.current = null;
    generationRunIdRef.current = null;
  };

  const streamAssistantContent = async (runId: string, assistantId: string, fullText: string) => {
    if (!fullText.trim()) return;
    const tokens = fullText.split(/(\s+)/);
    let rolling = "";

    for (const token of tokens) {
      if (stopStreamRef.current || generationRunIdRef.current !== runId) return;
      rolling += token;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: rolling } : m)),
      );
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
  };

  const sendPrompt = async (text: string) => {
    if (!canQuery) {
      toast.error("You do not have permission to query the assistant.");
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setValidationError("Please enter a question to continue.");
      return;
    }

    if (isSending) {
      stopGeneration("Generation interrupted. Ask your next question.");
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: now(),
      status: "done",
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: now(),
      status: "loading",
      prompt: trimmed,
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    setPrompt("");
    setValidationError("");
    setIsSending(true);
    stopStreamRef.current = false;
    activeAssistantIdRef.current = assistantMessage.id;

    const runId = crypto.randomUUID();
    generationRunIdRef.current = runId;
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question: trimmed, top_k: 5 }),
      });

      const payload = (await res.json().catch(() => ({}))) as Partial<RAGQueryResponse> & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || "Could not generate an answer.");
      }

      const answer = typeof payload.answer === "string" ? payload.answer : "";
      await streamAssistantContent(runId, assistantMessage.id, answer);

      if (generationRunIdRef.current !== runId || stopStreamRef.current) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                status: "done",
                content: answer,
                timestamp: typeof payload.timestamp === "string" ? payload.timestamp : now(),
                sources: Array.isArray(payload.sources) ? payload.sources : [],
                contexts: Array.isArray(payload.contexts) ? payload.contexts : [],
                confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
              }
            : m,
        ),
      );
    } catch (err) {
      if (generationRunIdRef.current !== runId) return;
      if (err instanceof DOMException && err.name === "AbortError") return;

      const message = err instanceof Error ? err.message : "Failed to generate answer.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                status: "error",
                content: "The assistant could not complete this response.",
                error: message,
                timestamp: now(),
              }
            : m,
        ),
      );
    } finally {
      if (generationRunIdRef.current === runId) {
        generationRunIdRef.current = null;
        activeAssistantIdRef.current = null;
        requestControllerRef.current = null;
        stopStreamRef.current = false;
        setIsSending(false);
      }
    }
  };

  const copyMessage = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => {
      setCopiedMessageId((current) => (current === messageId ? null : current));
    }, 1500);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendPrompt(prompt);
  };

  const emptyState = useMemo(
    () => (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-lg font-semibold text-slate-800">Ask company questions securely</p>
        <p className="mt-2 text-sm text-slate-600">
          This chatbot is protected by authentication and role permissions.
        </p>
      </div>
    ),
    [],
  );

  return (
    <section className="space-y-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Knowledge Assistant</p>
          <h1 className="text-2xl font-semibold text-slate-900">Chatbot</h1>
          <p className="text-sm text-slate-600">Ask questions from indexed documents with citation-backed answers.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isSending) stopGeneration("Generation stopped.");
            setMessages([]);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Trash2 className="h-4 w-4" />
          Clear History
        </button>
      </header>

      {!canQuery ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are authenticated, but your role does not include `query_rag` permission.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="h-[65vh] space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            emptyState
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <article key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                      isUser
                        ? "border-cyan-200 bg-cyan-600 text-white"
                        : message.status === "error"
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 ${isUser ? "text-white/85" : "text-slate-500"}`}>
                        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        {isUser ? "You" : "Assistant"}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isUser && message.content.trim() ? (
                          <button
                            type="button"
                            onClick={() => void copyMessage(message.id, message.content)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                          >
                            {copiedMessageId === message.id ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                              </>
                            )}
                          </button>
                        ) : null}
                        <span className={isUser ? "text-white/80" : "text-slate-400"}>{formatTime(message.timestamp)}</span>
                      </div>
                    </div>

                    {!isUser && message.status === "loading" && !message.content ? (
                      <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                      </div>
                    ) : (
                      <p className={`whitespace-pre-wrap text-sm leading-6 ${isUser ? "text-white" : "text-slate-700"}`}>
                        {message.content}
                      </p>
                    )}

                    {!isUser && message.status === "done" && message.sources && message.sources.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
                            >
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {!isUser && message.status === "error" && message.prompt ? (
                      <button
                        type="button"
                        onClick={() => void sendPrompt(message.prompt || "")}
                        className="mt-3 inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 p-4">
          {validationError ? (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{validationError}</p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="Ask a question..."
              className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {isSending ? <RefreshCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {isSending ? "Stop & Send" : "Send"}
            </button>
            {isSending ? (
              <button
                type="button"
                onClick={() => stopGeneration("Generation stopped.")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Stop
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

