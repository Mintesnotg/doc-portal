"use client";

import { FormEvent, ReactNode, useState } from "react";
import {
  Building2,
  CircleHelp,
  Clock3,
  FolderOpen,
  Landmark,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";

type InfoCard = {
  title: string;
  description: string;
  icon: ReactNode;
};

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const infoCards: InfoCard[] = [
  {
    title: "About Our Company",
    description: "Discover mission, values, and company history from trusted documents.",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Services",
    description: "Explore service catalogs, delivery standards, and customer commitments.",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    title: "Policies",
    description: "Find policy updates, governance standards, and compliance requirements.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Departments",
    description: "Understand team structures, ownership boundaries, and department contacts.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Support Resources",
    description: "Get onboarding guides, troubleshooting references, and operational playbooks.",
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    title: "Latest Updates",
    description: "Track recently published memos, release notes, and organizational changes.",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Frequently Asked Questions",
    description: "Access curated answers for recurring company, HR, and IT questions.",
    icon: <CircleHelp className="h-5 w-5" />,
  },
];

export default function PublicLandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

        <button
          onClick={() => setShowLogin(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          Admin Login
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 pb-16 lg:px-10">
        <section className="relative z-10 grid gap-10 rounded-[2rem] border border-white/80 bg-white/70 p-8 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur lg:grid-cols-[1.08fr,0.92fr] lg:p-12">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise Knowledge Hub
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
              Company Knowledge Portal
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Explore trusted company information, policies, and operational resources from one centralized platform.
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-700"
            >
              Login as Admin
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Platform Overview</p>
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-100 p-4">
                Manage internal documents across departments with role-based access.
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                Keep policies and references organized for HR, IT, and operational teams.
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                Secure access, categorized content, and audit-friendly document workflows.
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company Knowledge Areas</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Find the right context faster</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {infoCards.map((card) => (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl"
              >
                <div className="inline-flex rounded-xl bg-slate-100 p-2 text-cyan-700 transition group-hover:bg-cyan-100">
                  {card.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 md:grid-cols-4 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Smart Doc Portal</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enterprise platform for trusted company knowledge and document workflows.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-slate-900">Company Resources</a></li>
              <li><a href="#" className="hover:text-slate-900">Documentation</a></li>
              <li><a href="#" className="hover:text-slate-900">Support</a></li>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Login</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Sign in to continue</h3>
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
