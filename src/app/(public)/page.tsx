"use client";

import { FormEvent, Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  FolderOpen,
  Landmark,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wrench,
} from "lucide-react";
import type { RAGQueryResponse, RAGSource } from "@/lib/rag";
import { useRouter } from "next/navigation";

type InfoCard = {
  title: string;
  description: string;
  icon: ReactNode;
  category: string;
};

type MessageStatus = "done" | "loading" | "error";

type ChatMessage = {
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

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const CHAT_STORAGE_KEY = "doc_portal_chat_sessions_v1";
const ACTIVE_CHAT_STORAGE_KEY = "doc_portal_active_chat_v1";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const infoCards: InfoCard[] = [
  {
    title: "About Our Company",
    description: "Discover mission, values, and company history from trusted documents.",
    icon: <Building2 className="h-5 w-5" />,
    category: "about",
  },
  {
    title: "Services",
    description: "Explore service catalogs, delivery standards, and customer commitments.",
    icon: <Wrench className="h-5 w-5" />,
    category: "services",
  },
  {
    title: "Policies",
    description: "Find policy updates, governance standards, and compliance requirements.",
    icon: <ShieldCheck className="h-5 w-5" />,
    category: "policy",
  },
  {
    title: "Departments",
    description: "Understand team structures, ownership boundaries, and department contacts.",
    icon: <Users className="h-5 w-5" />,
    category: "departments",
  },
  {
    title: "Support Resources",
    description: "Get onboarding guides, troubleshooting references, and operational playbooks.",
    icon: <FolderOpen className="h-5 w-5" />,
    category: "support",
  },
  {
    title: "Latest Updates",
    description: "Track recently published memos, release notes, and organizational changes.",
    icon: <Sparkles className="h-5 w-5" />,
    category: "updates",
  },
  {
    title: "Frequently Asked Questions",
    description: "Access curated answers for recurring company, HR, and IT questions.",
    icon: <CircleHelp className="h-5 w-5" />,
    category: "faq",
  },
];

const nowIso = () => new Date().toISOString();

const createEmptySession = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: "New conversation",
  createdAt: nowIso(),
  updatedAt: nowIso(),
  messages: [],
});

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));

const summarizeTitle = (text: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New conversation";
  return cleaned.length > 44 ? `${cleaned.slice(0, 44)}...` : cleaned;
};

const extractKeywords = (text: string) => {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "about",
    "what",
    "when",
    "where",
    "which",
    "please",
    "have",
    "into",
  ]);

  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 3 && !stop.has(token)),
    ),
  ).slice(0, 6);
};

const highlightSnippet = (text: string, prompt: string) => {
  const keywords = extractKeywords(prompt);
  if (keywords.length === 0) {
    return text;
  }

  const escaped = keywords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const hit = keywords.some((word) => word.toLowerCase() === part.toLowerCase());
    return hit ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200/80 px-0.5 text-slate-900">
        {part}
      </mark>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    );
  });
};

const renderInlineLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const chunks = text.split(urlRegex);
  return chunks.map((chunk, index) => {
    if (chunk.match(urlRegex)) {
      return (
        <a
          key={`${chunk}-${index}`}
          href={chunk}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-700 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-800"
        >
          {chunk}
        </a>
      );
    }
    return <Fragment key={`${chunk}-${index}`}>{chunk}</Fragment>;
  });
};

const MarkdownMessage = ({ content }: { content: string }) => {
  const blocks: ReactNode[] = [];
  const regex = /```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(content);

  while (match) {
    if (match.index > lastIndex) {
      blocks.push(
        <TextBlock key={`text-${lastIndex}`} text={content.slice(lastIndex, match.index)} />,
      );
    }

    blocks.push(
      <div key={`code-${match.index}`} className="my-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <div className="border-b border-slate-800 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-400">
          {match[1] || "code"}
        </div>
        <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-emerald-200">
          <code>{match[2]}</code>
        </pre>
      </div>,
    );

    lastIndex = match.index + match[0].length;
    match = regex.exec(content);
  }

  if (lastIndex < content.length) {
    blocks.push(<TextBlock key={`tail-${lastIndex}`} text={content.slice(lastIndex)} />);
  }

  if (blocks.length === 0) {
    blocks.push(<TextBlock key="empty" text={content} />);
  }

  return <div>{blocks}</div>;
};

const TextBlock = ({ text }: { text: string }) => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className="whitespace-pre-wrap leading-7 text-slate-700">
          {renderInlineLinks(paragraph)}
        </p>
      ))}
    </div>
  );
};

export default function PublicLandingPage() {
  const router = useRouter();
  const chatSectionRef = useRef<HTMLElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const generationRunIdRef = useRef<string | null>(null);
  const activeGenerationRef = useRef<{ sessionId: string; assistantId: string } | null>(null);
  const stopStreamRef = useRef(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  useEffect(() => {
    const storedSessions = localStorage.getItem(CHAT_STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);

    if (!storedSessions) {
      const initial = createEmptySession();
      setSessions([initial]);
      setActiveSessionId(initial.id);
      return;
    }

    try {
      const parsed = JSON.parse(storedSessions) as ChatSession[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const fallback = createEmptySession();
        setSessions([fallback]);
        setActiveSessionId(fallback.id);
        return;
      }

      setSessions(parsed);
      const activeExists = parsed.some((session) => session.id === storedActiveId);
      setActiveSessionId(activeExists && storedActiveId ? storedActiveId : parsed[0].id);
    } catch {
      const fallback = createEmptySession();
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    }
  }, []);

  useEffect(() => {
    if (sessions.length === 0) return;
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!activeSessionId) return;
    localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeSession?.messages.length, isSending]);

  const updateSessionMessages = (sessionId: string, updater: (messages: ChatMessage[]) => ChatMessage[]) => {
    setSessions((previous) =>
      previous.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: updater(session.messages),
              updatedAt: nowIso(),
            }
          : session,
      ),
    );
  };

  const stopGeneration = (stoppedMessage: string) => {
    stopStreamRef.current = true;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsSending(false);

    const activeGeneration = activeGenerationRef.current;
    if (!activeGeneration) return;

    updateSessionMessages(activeGeneration.sessionId, (messages) =>
      messages.map((message) =>
        message.id === activeGeneration.assistantId
          ? {
              ...message,
              status: "done",
              timestamp: nowIso(),
              content: message.content.trim() || stoppedMessage,
            }
          : message,
      ),
    );

    generationRunIdRef.current = null;
    activeGenerationRef.current = null;
  };

  const streamAssistantContent = async (
    runId: string,
    sessionId: string,
    assistantId: string,
    fullText: string,
    delay = 12,
  ) => {
    if (!fullText.trim()) {
      updateSessionMessages(sessionId, (messages) =>
        messages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: "I could not find a complete answer for this prompt.",
              }
            : message,
        ),
      );
      return;
    }

    const words = fullText.split(/(\s+)/);
    let rolling = "";

    for (const token of words) {
      if (stopStreamRef.current || generationRunIdRef.current !== runId) {
        return;
      }

      rolling += token;
      updateSessionMessages(sessionId, (messages) =>
        messages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: rolling,
              }
            : message,
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const sendPrompt = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setValidationError("Please enter a question to continue.");
      return;
    }

    if (isSending) {
      stopGeneration("Generation interrupted. Ask your next question.");
    }

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const created = createEmptySession();
      setSessions([created]);
      setActiveSessionId(created.id);
      targetSessionId = created.id;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: nowIso(),
      status: "done",
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: nowIso(),
      status: "loading",
      prompt: trimmed,
    };

    updateSessionMessages(targetSessionId, (messages) => [...messages, userMessage, assistantMessage]);
    setSessions((previous) =>
      previous.map((session) =>
        session.id === targetSessionId && session.messages.length === 0
          ? { ...session, title: summarizeTitle(trimmed) }
          : session,
      ),
    );

    setPrompt("");
    setValidationError("");
    setIsSending(true);
    stopStreamRef.current = false;
    const runId = crypto.randomUUID();
    generationRunIdRef.current = runId;
    activeGenerationRef.current = { sessionId: targetSessionId, assistantId: assistantMessage.id };
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: trimmed,
          category: selectedCategory,
          top_k: 5,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<RAGQueryResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "The assistant is currently unavailable.");
      }

      const answer = typeof payload.answer === "string" ? payload.answer : "";
      await streamAssistantContent(runId, targetSessionId, assistantMessage.id, answer);

      if (generationRunIdRef.current !== runId || stopStreamRef.current) {
        return;
      }

      updateSessionMessages(targetSessionId, (messages) =>
        messages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                status: "done",
                content: answer,
                timestamp: typeof payload.timestamp === "string" ? payload.timestamp : nowIso(),
                sources: Array.isArray(payload.sources) ? payload.sources : [],
                contexts: Array.isArray(payload.contexts) ? payload.contexts : [],
                confidence:
                  typeof payload.confidence === "number" ? payload.confidence : undefined,
              }
            : message,
        ),
      );
    } catch (error) {
      if (generationRunIdRef.current !== runId) {
        return;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message = error instanceof Error ? error.message : "Failed to generate answer.";
      updateSessionMessages(targetSessionId, (messages) =>
        messages.map((item) =>
          item.id === assistantMessage.id
            ? {
                ...item,
                status: "error",
                content:
                  "I ran into a problem while generating this answer. Please retry in a moment.",
                error: message,
                timestamp: nowIso(),
              }
            : item,
        ),
      );
    } finally {
      if (generationRunIdRef.current === runId) {
        generationRunIdRef.current = null;
        activeGenerationRef.current = null;
        requestControllerRef.current = null;
        stopStreamRef.current = false;
        setIsSending(false);
      }
    }
  };

  const handlePromptSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendPrompt(prompt);
  };

  const startChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const createNewChat = () => {
    const session = createEmptySession();
    setSessions((previous) => [session, ...previous]);
    setActiveSessionId(session.id);
  };

  const runLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors: LoginErrors = {};
    if (!emailPattern.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }
    if (password.trim().length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(newErrors).length > 0) {
      setLoginErrors(newErrors);
      return;
    }

    setIsLoggingIn(true);
    setLoginErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setLoginErrors({
          general: payload.error?.trim() || "Sign-in failed. Please verify your credentials.",
        });
        return;
      }

      setShowLogin(false);
      setEmail("");
      setPassword("");
      router.push("/dashboard");
    } catch {
      setLoginErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#f0f7ff_0,#f8fafc_40%,#f7f5f2_100%)] text-slate-900">
      <div className="pointer-events-none absolute left-0 top-0 -z-0 h-[32rem] w-[32rem] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 -z-0 h-[36rem] w-[36rem] rounded-full bg-emerald-300/20 blur-3xl" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-slate-700">
          <Landmark className="h-4 w-4 text-cyan-700" />
          SMART DOC PORTAL
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={startChat}
            className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-white"
          >
            Start Chat
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Login as Admin
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 pb-16 lg:px-10">
        <section className="relative z-10 grid gap-10 rounded-[2rem] border border-white/80 bg-white/70 p-8 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur lg:grid-cols-[1.08fr,0.92fr] lg:p-12">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise Knowledge AI
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
              Ask Anything About Our Company
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Get immediate answers grounded in internal policies, playbooks, handbooks, and support resources.
              The assistant scans trusted company documents and returns traceable citations in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={startChat}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-700"
              >
                Start Chat
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Lock className="h-4 w-4" />
                Login as Admin
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live Assistant Preview</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                What is our reimbursement policy for remote-work equipment?
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-slate-700">
                The policy allows eligible employees to claim approved equipment up to the annual budget limit.
                Requests are submitted through the IT service desk and approved by department managers.
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                Sources: Employee Handbook.pdf, IT Policy Guide.pdf
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company Knowledge Areas</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Find the right context faster</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoCards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                onClick={() => {
                  setSelectedCategory(card.category);
                  startChat();
                }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="inline-flex rounded-xl bg-slate-100 p-2 text-cyan-700 transition group-hover:bg-cyan-100">
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section
          id="chat-section"
          ref={chatSectionRef}
          className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-[0_28px_70px_-35px_rgba(2,8,23,0.35)] backdrop-blur md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Chats</p>
                <button
                  type="button"
                  onClick={createNewChat}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  New Chat
                </button>
              </div>

              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {sessions.map((session) => {
                  const active = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setActiveSessionId(session.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-cyan-300 bg-cyan-50 text-slate-900"
                          : "border-transparent bg-white text-slate-700 hover:border-slate-200"
                      }`}
                    >
                      <p className="line-clamp-1 text-sm font-medium">{session.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(session.updatedAt)}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex min-h-[64vh] flex-col rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:px-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Company Knowledge Assistant</p>
                    <p className="text-xs text-slate-500">Grounded answers with source citations</p>
                  </div>
                </div>

                {selectedCategory ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Category: {selectedCategory}
                  </span>
                ) : null}
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
                {!activeSession || activeSession.messages.length === 0 ? (
                  <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <MessageSquare className="mx-auto h-9 w-9 text-slate-400" />
                    <h3 className="mt-3 text-lg font-semibold text-slate-800">Start a conversation</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Ask a question about company docs and receive an answer with supporting references.
                    </p>
                  </div>
                ) : (
                  activeSession.messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <article key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[90%] rounded-2xl border px-4 py-3 md:max-w-[82%] ${
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
                            <span className={isUser ? "text-white/80" : "text-slate-400"}>
                              {formatTime(message.timestamp)}
                            </span>
                          </div>

                          {!isUser && message.status === "loading" && !message.content ? (
                            <div className="space-y-2">
                              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                              <div className="h-3 w-10/12 animate-pulse rounded bg-slate-200" />
                              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Thinking...
                              </div>
                            </div>
                          ) : isUser ? (
                            <p className="whitespace-pre-wrap leading-7">{message.content}</p>
                          ) : (
                            <MarkdownMessage content={message.content} />
                          )}

                          {!isUser && message.status === "done" ? (
                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                              {typeof message.confidence === "number" ? (
                                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Confidence {(message.confidence * 100).toFixed(0)}%
                                </div>
                              ) : null}

                              {message.sources && message.sources.length > 0 ? (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Referenced documents
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.sources.map((source) => (
                                      <a
                                        key={source.id}
                                        href={source.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        {source.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {message.contexts && message.contexts.length > 0 ? (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Matched sections
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {message.contexts.slice(0, 3).map((context) => (
                                      <p
                                        key={`${context.slice(0, 18)}-${message.id}`}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600"
                                      >
                                        {highlightSnippet(context.slice(0, 240), message.prompt || "")}
                                        {context.length > 240 ? "..." : ""}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {!isUser && message.status === "error" ? (
                            <div className="mt-3 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700">
                              <p>{message.error || "Unable to generate an answer."}</p>
                              {message.prompt ? (
                                <button
                                  type="button"
                                  onClick={() => sendPrompt(message.prompt || "")}
                                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 font-medium text-white transition hover:bg-red-700"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                  Retry
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })
                )}

                <div ref={endOfMessagesRef} />
              </div>

              <form onSubmit={handlePromptSubmit} className="border-t border-slate-200 px-4 py-4 md:px-6">
                {validationError ? (
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    {validationError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={prompt}
                    onChange={(event) => {
                      setPrompt(event.target.value);
                      if (validationError) setValidationError("");
                    }}
                    placeholder="Ask about policies, procedures, departments, or internal knowledge..."
                    className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {isSending ? <RefreshCcw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {isSending ? "Stop & Send" : "Send"}
                  </button>
                  {isSending ? (
                    <button
                      type="button"
                      onClick={() => stopGeneration("Generation stopped.")}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
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
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 md:grid-cols-4 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Smart Doc Portal</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enterprise AI assistant for trusted, citation-backed company knowledge discovery.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="#chat-section" className="hover:text-slate-900">Chat Assistant</a></li>
              <li><a href="#" className="hover:text-slate-900">Company Resources</a></li>
              <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>support@smartdoc.local</li>
              <li>+1 (555) 019-2244</li>
              <li>Mon-Fri, 9:00 AM - 6:00 PM</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-slate-900">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-900">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-900">Social Links</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Copyright {new Date().getFullYear()} Smart Doc Portal. All rights reserved.
        </div>
      </footer>

      {showLogin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Access</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Login to manage documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={runLogin} noValidate>
              {loginErrors.general ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {loginErrors.general}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="text-sm font-medium text-slate-700">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-100 ${
                    loginErrors.email ? "border-red-300" : "border-slate-300 focus:border-cyan-500"
                  }`}
                  autoComplete="email"
                />
                {loginErrors.email ? <p className="text-xs text-red-600">{loginErrors.email}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-100 ${
                    loginErrors.password ? "border-red-300" : "border-slate-300 focus:border-cyan-500"
                  }`}
                  autoComplete="current-password"
                />
                {loginErrors.password ? <p className="text-xs text-red-600">{loginErrors.password}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                {isLoggingIn ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
