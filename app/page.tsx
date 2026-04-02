"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, loginRequest } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";

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
      const response = await loginRequest({
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", response.access_token);

      // const decoded = decodeJwt(response.access_token);
      // if (decoded) {
      //   localStorage.setItem(
      //     "user",
      //     JSON.stringify({
      //       uid: decoded.uid,
      //       email: decoded.email,
      //       roles: decoded.roles ?? response.roles,
      //       exp: decoded.exp,
      //     }),
      //   );
      // }

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_CREDENTIALS") {
        setErrors({ general: "Incorrect email or password." });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-black from-slate-900 via-slate-900 to-slate-700 flex items-center justify-center px-6 py-12">
      <div className="bg-white/95 text-slate-900 shadow-2xl rounded-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1.05fr,0.95fr] overflow-hidden">
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

            <p className="text-xs text-slate-500">
              By signing in you agree to follow your organization&apos;s security policy.
            </p>
          </form>
        </section>

        <section className="relative hidden md:flex bg-slate-950 text-white items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950" />
          <div className="relative p-10 lg:p-12 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-lg font-semibold">
                DP
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100">
                  Secure Workspace
                </p>
                <p className="text-lg font-semibold">Document Portal</p>
              </div>
            </div>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              Manage documentation, control access, and collaborate with confidence. Your session
              will remain encrypted while active.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["SSO-ready", "Role-based access", "Audit friendly", "Fast uploads"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-emerald-50"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
