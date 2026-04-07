"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHint = useMemo(
    () => (password.length && password.length < 8 ? "Min. 8 characters" : ""),
    [password.length],
  );

  const validate = () => {
    const newErrors: FieldErrors = {};

    if (!emailPattern.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (password.trim().length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (loginRes.ok) {
        router.push("/dashboard");
        return;
      }

      const data = (await loginRes.json().catch(() => ({}))) as {
        error?: string;
      };

      if (loginRes.status === 401) {
        setErrors({ general: "Incorrect email or password." });
      } else {
        setErrors({
          general:
            data.error?.trim() ||
            "Something went wrong. Please try again.",
        });
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-700 flex items-center justify-center px-6 py-12">
      <div className="bg-white/95 text-slate-900 shadow-2xl rounded-2xl  max-w-4xl grid grid-cols-1 md:grid-cols-[1.05fr,0.95fr] overflow-hidden">
        <section className="p-10 lg:p-12 flex flex-col justify-center gap-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.2em]">
              Doc Portal
            </p>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
              Welcome back.
            </h1>
            <p className="text-slate-600">
              Sign in to access your dashboard and continue where you left off.
            </p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {errors.general ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm"
                role="alert"
                aria-live="assertive"
              >
                {errors.general}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${
                  errors.email ? "border-red-400" : "border-slate-200"
                }`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-red-600">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                {passwordHint ? (
                  <span className="text-xs text-slate-500">{passwordHint}</span>
                ) : null}
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 ${
                  errors.password ? "border-red-400" : "border-slate-200"
                }`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password ? (
                <p id="password-error" className="text-sm text-red-600">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white/60 border-t-white animate-spin" aria-hidden />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>

       
          </form>
        </section>


      </div>
    </main>
  );
}
