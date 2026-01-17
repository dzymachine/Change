"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { quickLogin } from "@/actions/user";

export function AuthLanding() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleQuickLogin = (loginMode: "onboarding" | "dashboard") => {
    setError(null);
    startTransition(async () => {
      const result = await quickLogin(loginMode);
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Refresh to trigger server-side middleware which checks onboarding status
      // and redirects appropriately (to /dashboard or /onboarding/charities)
      router.refresh();
      // Small delay to ensure cookies are set before navigation
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After email confirmation, user will be redirected here
        // Middleware will then redirect to onboarding since onboarding_completed is false
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="text-3xl font-bold text-emerald-600">Change</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-500">
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setMode("login");
          }}
          className="text-emerald-600 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-emerald-600">Change</div>
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-gray-500">
          {mode === "login"
            ? "Sign in to keep making change."
            : "Start making change with every purchase."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "login"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            mode === "signup"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || isPending}
          className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? mode === "login"
              ? "Signing in..."
              : "Creating account..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {/* Quick Login for Development */}
      {process.env.NODE_ENV === "development" && (
        <div className="pt-6 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-400 text-center mb-3">
            Development Quick Login
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("onboarding")}
              disabled={isPending || loading}
              className="flex-1 py-2 px-3 text-sm bg-amber-100 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors"
            >
              {isPending ? "..." : "Test: Onboarding"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("dashboard")}
              disabled={isPending || loading}
              className="flex-1 py-2 px-3 text-sm bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              {isPending ? "..." : "Test: Dashboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
