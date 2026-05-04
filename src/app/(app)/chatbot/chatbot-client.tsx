"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Copy, Loader2, MessageSquarePlus, RefreshCcw, Search, Send, Trash2, User } from "lucide-react";
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

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

type PersistedChatState = {
  version: number;
  activeConversationId: string | null;
  conversations: Conversation[];
};

type HistoryGroupName = "Today" | "Yesterday" | "Earlier";

const CHAT_HISTORY_VERSION = 1;
const CHAT_HISTORY_LIMIT = 120;
const DEFAULT_CHAT_TITLE = "New Chat";
const now = () => new Date().toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMessageStatus = (value: unknown): value is MessageStatus =>
  value === "done" || value === "loading" || value === "error";

const asIso = (value: unknown) => {
  if (typeof value === "string" && !Number.isNaN(new Date(value).valueOf())) return value;
  return now();
};

const normalizeTitle = (source: string) => {
  const cleaned = source.replace(/\s+/g, " ").replace(/^#+\s*/, "").trim();
  if (!cleaned) return DEFAULT_CHAT_TITLE;
  return cleaned.length > 70 ? `${cleaned.slice(0, 67)}...` : cleaned;
};

const parseStoredMessage = (input: unknown): Message | null => {
  if (!isRecord(input)) return null;

  const role = input.role === "user" || input.role === "assistant" ? input.role : null;
  if (!role) return null;

  const message: Message = {
    id: typeof input.id === "string" && input.id ? input.id : crypto.randomUUID(),
    role,
    content: typeof input.content === "string" ? input.content : "",
    timestamp: asIso(input.timestamp),
    status: isMessageStatus(input.status) ? input.status : "done",
  };

  if (typeof input.prompt === "string") message.prompt = input.prompt;
  if (typeof input.error === "string") message.error = input.error;
  if (typeof input.confidence === "number") message.confidence = input.confidence;

  if (Array.isArray(input.contexts)) {
    message.contexts = input.contexts.filter((item): item is string => typeof item === "string");
  }

  if (Array.isArray(input.sources)) {
    message.sources = input.sources
      .filter((item): item is RAGSource =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.url === "string",
      )
      .map((item) => ({ id: item.id, title: item.title, url: item.url }));
  }

  return message;
};

const parseStoredConversation = (input: unknown): Conversation | null => {
  if (!isRecord(input)) return null;
  if (typeof input.id !== "string" || !input.id) return null;

  const messages = Array.isArray(input.messages)
    ? input.messages
        .map((message) => parseStoredMessage(message))
        .filter((message): message is Message => Boolean(message))
    : [];

  return {
    id: input.id,
    title: typeof input.title === "string" && input.title.trim() ? input.title : DEFAULT_CHAT_TITLE,
    createdAt: asIso(input.createdAt),
    updatedAt: asIso(input.updatedAt),
    messages,
  };
};

const parseStoredState = (raw: string): PersistedChatState | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const conversations = Array.isArray(parsed.conversations)
      ? parsed.conversations
          .map((conversation) => parseStoredConversation(conversation))
          .filter((conversation): conversation is Conversation => Boolean(conversation))
      : [];

    return {
      version: typeof parsed.version === "number" ? parsed.version : CHAT_HISTORY_VERSION,
      activeConversationId:
        typeof parsed.activeConversationId === "string" ? parsed.activeConversationId : null,
      conversations,
    };
  } catch {
    return null;
  }
};

const dateValue = (iso: string) => {
  const value = new Date(iso).valueOf();
  return Number.isNaN(value) ? 0 : value;
};

const hasMessages = (conversation: Conversation) => conversation.messages.length > 0;

const sortConversations = (items: Conversation[]) =>
  [...items].sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt));

const toHistoryGroup = (iso: string): HistoryGroupName => {
  const target = new Date(iso);
  const nowDate = new Date();
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((startOfToday.valueOf() - startOfTarget.valueOf()) / 86_400_000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
};

const inlineMarkdown = (text: string): ReactNode[] => {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return segments.map((segment, index) => {
    const boldMatch = /^\*\*([^*]+)\*\*$/.exec(segment);
    if (!boldMatch) return segment;
    return (
      <strong key={`bold-${index}`} className="font-semibold text-slate-900">
        {boldMatch[1]}
      </strong>
    );
  });
};

type MarkdownBlock =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const parseMarkdownBlocks = (content: string): MarkdownBlock[] => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      blocks.push({
        type: "h",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    const ulMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (ulMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const nextLine = (lines[index] ?? "").trim();
        const nextItemMatch = /^[-*]\s+(.+)$/.exec(nextLine);
        if (!nextItemMatch) break;
        items.push(nextItemMatch[1].trim());
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const olMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (olMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const nextLine = (lines[index] ?? "").trim();
        const nextItemMatch = /^\d+[.)]\s+(.+)$/.exec(nextLine);
        if (!nextItemMatch) break;
        items.push(nextItemMatch[1].trim());
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const nextLineRaw = lines[index] ?? "";
      const nextTrimmed = nextLineRaw.trim();
      if (!nextTrimmed) {
        index += 1;
        break;
      }
      if (/^(#{1,6})\s+/.test(nextTrimmed) || /^[-*]\s+/.test(nextTrimmed) || /^\d+[.)]\s+/.test(nextTrimmed)) {
        break;
      }
      paragraphLines.push(nextTrimmed);
      index += 1;
    }
    blocks.push({ type: "p", text: paragraphLines.join(" ") });
  }

  return blocks;
};

const renderAssistantContent = (content: string) => {
  const blocks = parseMarkdownBlocks(content);
  if (blocks.length === 0) {
    return <p className="text-sm leading-6 text-slate-700">{content}</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === "h") {
          const headingClass =
            block.level === 1
              ? "text-lg font-bold text-slate-900"
              : block.level === 2
                ? "text-base font-bold text-slate-900"
                : "text-sm font-bold text-slate-800";
          const HeadingTag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";

          return (
            <HeadingTag key={`heading-${index}`} className={headingClass}>
              {inlineMarkdown(block.text)}
            </HeadingTag>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`ul-item-${index}-${itemIndex}`}>{inlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`ol-item-${index}-${itemIndex}`}>{inlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
            {inlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
};

const conversationContains = (conversation: Conversation, query: string) => {
  if (!query) return true;
  const keyword = query.toLowerCase();
  if (conversation.title.toLowerCase().includes(keyword)) return true;
  return conversation.messages.some((message) => message.content.toLowerCase().includes(keyword));
};

export default function ChatbotClient() {
  const { permissions, user } = useAuth();
  const canQuery = permissions.includes("query_rag");

  const storageKey = useMemo(() => {
    const scope = user?.uid || user?.email || "anonymous";
    return `doc-portal:chat-history:v${CHAT_HISTORY_VERSION}:${scope}`;
  }, [user?.email, user?.uid]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const requestControllerRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const generationRunIdRef = useRef<string | null>(null);
  const stopStreamRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () =>
      activeConversationId
        ? conversations.find((conversation) => conversation.id === activeConversationId) || null
        : null,
    [activeConversationId, conversations],
  );
  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

  const filteredConversations = useMemo(
    () =>
      sortConversations(conversations).filter((conversation) =>
        conversationContains(conversation, historySearch.trim()),
      ),
    [conversations, historySearch],
  );

  const groupedConversations = useMemo(() => {
    const groups: Record<HistoryGroupName, Conversation[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const conversation of filteredConversations) {
      groups[toHistoryGroup(conversation.updatedAt)].push(conversation);
    }
    return groups;
  }, [filteredConversations]);

  useEffect(() => {
    setHistoryLoaded(false);
    let nextConversations: Conversation[] = [];
    let nextActiveId: string | null = null;

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? parseStoredState(stored) : null;
      if (
        parsed &&
        parsed.version === CHAT_HISTORY_VERSION &&
        parsed.conversations.length > 0
      ) {
        nextConversations = sortConversations(parsed.conversations.filter(hasMessages)).slice(
          0,
          CHAT_HISTORY_LIMIT,
        );
        nextActiveId =
          parsed.activeConversationId &&
          nextConversations.some((conversation) => conversation.id === parsed.activeConversationId)
            ? parsed.activeConversationId
            : nextConversations[0]?.id || null;
      }
    }

    setConversations(nextConversations);
    setActiveConversationId(nextActiveId);
    setHistoryLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!historyLoaded || typeof window === "undefined") return;
    const persistedConversations = conversations.filter(hasMessages).slice(0, CHAT_HISTORY_LIMIT);
    if (persistedConversations.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    const payload: PersistedChatState = {
      version: CHAT_HISTORY_VERSION,
      activeConversationId:
        activeConversationId &&
        persistedConversations.some((conversation) => conversation.id === activeConversationId)
          ? activeConversationId
          : null,
      conversations: persistedConversations,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [activeConversationId, conversations, historyLoaded, storageKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));

  const patchAssistantMessage = (
    conversationId: string,
    assistantId: string,
    callback: (message: Message) => Message,
    touchUpdatedAt = false,
  ) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        return {
          ...conversation,
          updatedAt: touchUpdatedAt ? now() : conversation.updatedAt,
          messages: conversation.messages.map((message) =>
            message.id === assistantId ? callback(message) : message,
          ),
        };
      }),
    );
  };

  const applyToConversation = (
    conversationId: string,
    callback: (conversation: Conversation) => Conversation,
  ) => {
    setConversations((previous) =>
      previous
        .map((conversation) =>
          conversation.id === conversationId ? callback(conversation) : conversation,
        )
        .slice(0, CHAT_HISTORY_LIMIT),
    );
  };

  const createNewChat = () => {
    if (isSending) {
      stopGeneration("Generation stopped.");
    }
    setActiveConversationId(null);
    setPrompt("");
    setValidationError("");
    toast.success("Ready for a new chat.");
  };

  const deleteConversation = (conversationId: string) => {
    const confirmed = window.confirm("Delete this chat from history?");
    if (!confirmed) return;

    if (isSending && activeConversationIdRef.current === conversationId) {
      stopGeneration("Generation stopped.");
    }

    const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
    setConversations(remaining);

    if (activeConversationId === conversationId) {
      setActiveConversationId(sortConversations(remaining)[0]?.id || null);
    } else if (
      activeConversationId &&
      !remaining.some((conversation) => conversation.id === activeConversationId)
    ) {
      setActiveConversationId(sortConversations(remaining)[0]?.id || null);
    }

    toast.success("Chat deleted.");
  };

  const clearAllHistory = () => {
    if (conversations.length === 0) {
      toast.info("No chat history to clear.");
      return;
    }

    const confirmed = window.confirm("Clear all saved chat history?");
    if (!confirmed) return;

    if (isSending) {
      stopGeneration("Generation stopped.");
    }

    setConversations([]);
    setActiveConversationId(null);
    setHistorySearch("");
    toast.success("All chat history cleared.");
  };

  const activateConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) return;
    if (isSending) {
      stopGeneration("Generation stopped.");
    }
    setActiveConversationId(conversationId);
    setValidationError("");
  };

  const stopGeneration = (fallbackText: string) => {
    stopStreamRef.current = true;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsSending(false);

    const assistantId = activeAssistantIdRef.current;
    const conversationId = activeConversationIdRef.current;
    if (!assistantId || !conversationId) return;

    patchAssistantMessage(
      conversationId,
      assistantId,
      (message) => ({
        ...message,
        status: "done",
        timestamp: now(),
        content: message.content.trim() || fallbackText,
      }),
      true,
    );
    activeAssistantIdRef.current = null;
    activeConversationIdRef.current = null;
    generationRunIdRef.current = null;
  };

  const streamAssistantContent = async (
    runId: string,
    conversationId: string,
    assistantId: string,
    fullText: string,
  ) => {
    if (!fullText.trim()) return;
    const tokens = fullText.split(/(\s+)/);
    let rolling = "";

    for (const token of tokens) {
      if (stopStreamRef.current || generationRunIdRef.current !== runId) return;
      rolling += token;
      patchAssistantMessage(
        conversationId,
        assistantId,
        (message) => ({ ...message, content: rolling }),
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

    const existingConversation = activeConversationId
      ? conversations.find((conversation) => conversation.id === activeConversationId)
      : null;
    let conversationId = existingConversation?.id || null;

    if (conversationId) {
      applyToConversation(conversationId, (conversation) => {
        const hasUserMessages = conversation.messages.some((message) => message.role === "user");
        return {
          ...conversation,
          title: hasUserMessages ? conversation.title : normalizeTitle(trimmed),
          updatedAt: now(),
          messages: [...conversation.messages, userMessage, assistantMessage],
        };
      });
    } else {
      const createdAt = now();
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: normalizeTitle(trimmed),
        createdAt,
        updatedAt: createdAt,
        messages: [userMessage, assistantMessage],
      };
      conversationId = newConversation.id;
      setConversations((previous) => [newConversation, ...previous].slice(0, CHAT_HISTORY_LIMIT));
      setActiveConversationId(newConversation.id);
    }

    if (!conversationId) {
      toast.error("Could not create a chat session.");
      return;
    }

    setPrompt("");
    setValidationError("");
    setIsSending(true);
    stopStreamRef.current = false;
    activeAssistantIdRef.current = assistantMessage.id;
    activeConversationIdRef.current = conversationId;

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
      await streamAssistantContent(runId, conversationId, assistantMessage.id, answer);

      if (generationRunIdRef.current !== runId || stopStreamRef.current) return;

      patchAssistantMessage(
        conversationId,
        assistantMessage.id,
        (message) => ({
          ...message,
          status: "done",
          content: answer,
          timestamp: typeof payload.timestamp === "string" ? payload.timestamp : now(),
          sources: Array.isArray(payload.sources) ? payload.sources : [],
          contexts: Array.isArray(payload.contexts) ? payload.contexts : [],
          confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
        }),
        true,
      );
    } catch (err) {
      if (generationRunIdRef.current !== runId) return;
      if (err instanceof DOMException && err.name === "AbortError") return;

      const message = err instanceof Error ? err.message : "Failed to generate answer.";
      patchAssistantMessage(
        conversationId,
        assistantMessage.id,
        (assistant) => ({
          ...assistant,
          status: "error",
          content: "The assistant could not complete this response.",
          error: message,
          timestamp: now(),
        }),
        true,
      );
    } finally {
      if (generationRunIdRef.current === runId) {
        generationRunIdRef.current = null;
        activeAssistantIdRef.current = null;
        activeConversationIdRef.current = null;
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
    <section className="space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Knowledge Assistant</p>
        <h1 className="text-2xl font-semibold text-slate-900">Chatbot</h1>
        <p className="text-sm text-slate-600">Ask questions from indexed documents with citation-backed answers.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Chat History</p>
            <button
              type="button"
              onClick={createNewChat}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New Chat
            </button>
          </div>
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search chats..."
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <button
              type="button"
              onClick={clearAllHistory}
              disabled={conversations.length === 0}
              className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All History
            </button>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {!historyLoaded ? (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-600">
                {historySearch.trim()
                  ? "No chats match your search."
                  : "No chat history yet. Submit your first prompt to create one."}
              </div>
            ) : (
              (Object.keys(groupedConversations) as HistoryGroupName[]).map((groupName) =>
                groupedConversations[groupName].length > 0 ? (
                  <div key={groupName} className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{groupName}</p>
                    {groupedConversations[groupName].map((conversation) => {
                      const isActive = activeConversationId === conversation.id;
                      const preview =
                        conversation.messages.find((message) => message.role === "user")?.content || DEFAULT_CHAT_TITLE;
                      return (
                        <div
                          key={conversation.id}
                          className={`relative rounded-xl border ${
                            isActive
                              ? "border-cyan-400 bg-cyan-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => activateConversation(conversation.id)}
                            className="w-full px-3 py-2 pr-9 text-left"
                          >
                            <p className={`line-clamp-1 text-sm font-semibold ${isActive ? "text-cyan-900" : "text-slate-800"}`}>
                              {conversation.title}
                            </p>
                            <p className="line-clamp-1 text-xs text-slate-500">{preview}</p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatDate(conversation.updatedAt)} at {formatTime(conversation.updatedAt)}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(conversation.id)}
                            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-100 hover:text-red-700"
                            aria-label={`Delete chat ${conversation.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null,
              )
            )}
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white">
          {!canQuery ? (
            <div className="m-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You are authenticated, but your role does not include `query_rag` permission.
            </div>
          ) : null}

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
                      ) : isUser ? (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-white">{message.content}</p>
                      ) : (
                        renderAssistantContent(message.content)
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
      </div>
    </section>
  );
}
