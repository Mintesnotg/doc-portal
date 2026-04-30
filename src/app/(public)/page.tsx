"use client";

import { FormEvent, ReactNode, useState } from "react";
import {
  BookOpenText,
  Building2,
  Clock3,
  FileCheck2,
  FolderKanban,
  Landmark,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Highlight = {
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

const highlights: Highlight[] = [
  {
    title: "Centralized Knowledge",
    description: "Access approved organizational documents from one secure portal.",
    icon: <BookOpenText className="h-5 w-5" />,
  },
  {
    title: "Structured Documentation",
    description: "Browse clear policies, procedures, and standards by topic and owner.",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    title: "Operational Clarity",
    description: "Keep teams aligned with versioned records and consistent references.",
    icon: <FileCheck2 className="h-5 w-5" />,
  },
  {
    title: "Department Coverage",
    description: "Find information for HR, Finance, Operations, IT, and Compliance.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Governance Ready",
    description: "Support audit and governance requirements with documented controls.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Company Context",
    description: "Understand business units, responsibilities, and service boundaries.",
    icon: <Building2 className="h-5 w-5" />,
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
    <div className="relative overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eff6ff_0,#f8fafc_35%,#f4f7f5_100%)] text-slate-900">
      <div className="pointer-events-none absolute left-0 top-0 -z-0 h-[32rem] w-[32rem] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 -z-0 h-[36rem] w-[36rem] rounded-full bg-emerald-300/20 blur-3xl" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-slate-700">
          <Landmark className="h-4 w-4 text-cyan-700" />
          SMART DOC PORTAL
        </div>

        <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#overview" className="hover:text-slate-900">
            Overview
          </a>
          <a href="#resources" className="hover:text-slate-900">
            Resources
          </a>
          <a href="#updates" className="hover:text-slate-900">
            Updates
          </a>
          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Login
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-16 lg:px-10">
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-[0_28px_70px_-35px_rgba(2,8,23,0.35)] backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Knowledge Portal</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Trusted documentation for daily operations and strategic decisions
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Smart Doc Portal is a centralized landing page for organizational knowledge. Teams can locate approved
            resources, follow current standards, and stay aligned across departments.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#resources"
              className="rounded-full bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              View Resources
            </a>
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign In
            </button>
          </div>
        </section>

        <section id="overview" className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scope</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Company policies, SOPs, governance guidance, and internal manuals in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Audience</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Built for admins and team members who need reliable operational information.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Availability</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Updated regularly to reflect active processes, ownership changes, and compliance requirements.
            </p>
          </div>
        </section>

        <section id="resources" className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resource Highlights</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Browse core knowledge areas</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl"
              >
                <div className="inline-flex rounded-xl bg-slate-100 p-2 text-cyan-700">{card.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="updates" className="rounded-3xl border border-slate-200 bg-white/90 p-6 md:p-8">
          <div className="flex items-center gap-2 text-cyan-700">
            <Clock3 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Recent Notes</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">What to expect on this portal</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-6 text-slate-600">
            <li>Consistent document categories and naming conventions for fast retrieval.</li>
            <li>Reviewed and approved content maintained by designated owners.</li>
            <li>Simple access flow for both administrative and standard user accounts.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 md:grid-cols-4 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Smart Doc Portal</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A single source of truth for internal knowledge, policy clarity, and operational documentation.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Quick Links</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#overview" className="hover:text-slate-900">
                  Overview
                </a>
              </li>
              <li>
                <a href="#resources" className="hover:text-slate-900">
                  Resource Areas
                </a>
              </li>
              <li>
                <a href="#updates" className="hover:text-slate-900">
                  Recent Notes
                </a>
              </li>
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
              <li>
                <a href="#" className="hover:text-slate-900">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900">
                  Compliance
                </a>
              </li>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Portal Access</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Sign in to access documents</h3>
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
                <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="login-email"
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
                <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="login-password"
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
