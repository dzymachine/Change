"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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

      router.refresh();
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.refresh();
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center px-6">
        {/* Decorative accent */}
        <div 
          className="w-12 h-1 mx-auto mb-8"
          style={{ backgroundColor: "var(--tan)" }}
        />
        
        <h1 
          className="font-display text-3xl mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Check your inbox
        </h1>
        
        <p 
          className="font-body text-base mb-2 leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          We&apos;ve sent a confirmation link to
        </p>
        <p 
          className="font-body text-base mb-8"
          style={{ color: "var(--foreground)", fontWeight: 500 }}
        >
          {email}
        </p>
        
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setMode("login");
          }}
          className="font-body text-sm transition-colors duration-200"
          style={{ color: "var(--green)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--green-light)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--green)"}
        >
          Return to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto px-6">
      {/* Header Section */}
      <header className="text-center mb-12">
        {/* Logo / Brand */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/change-logo.png"
            alt="Change"
            width={140}
            height={38}
            priority
          />
        </div>
        
        {/* Decorative line */}
        <div 
          className="w-16 h-px mx-auto mb-8"
          style={{ backgroundColor: "var(--tan)" }}
        />
        
        {/* Headline */}
        <h1 
          className="font-display text-3xl md:text-4xl mb-4 leading-tight"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          {mode === "login" ? "Welcome back" : "Join us"}
        </h1>
        
        <p 
          className="font-body text-base leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {mode === "login"
            ? "Sign in to continue making an impact."
            : "Start turning spare change into real change."}
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-8 mb-10">
        <button
          type="button"
          onClick={() => setMode("login")}
          className="relative font-body text-sm pb-2 transition-colors duration-200"
          style={{ 
            color: mode === "login" ? "var(--foreground)" : "var(--muted)",
            fontWeight: mode === "login" ? 500 : 400,
          }}
        >
          Sign in
          {mode === "login" && (
            <span 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: "var(--green)" }}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className="relative font-body text-sm pb-2 transition-colors duration-200"
          style={{ 
            color: mode === "signup" ? "var(--foreground)" : "var(--muted)",
            fontWeight: mode === "signup" ? 500 : 400,
          }}
        >
          Create account
          {mode === "signup" && (
            <span 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: "var(--green)" }}
            />
          )}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="email" 
            className="block font-body text-sm mb-2"
            style={{ color: "var(--muted)" }}
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 font-body text-base rounded-none transition-all duration-200"
            style={{
              backgroundColor: "var(--white)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.outline = "none";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block font-body text-sm mb-2"
            style={{ color: "var(--muted)" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 font-body text-base rounded-none transition-all duration-200"
            style={{
              backgroundColor: "var(--white)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.outline = "none";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            required
          />
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-body text-sm mb-2"
              style={{ color: "var(--muted)" }}
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 font-body text-base rounded-none transition-all duration-200"
              style={{
                backgroundColor: "var(--white)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--green)";
                e.currentTarget.style.outline = "none";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              required
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p 
            className="font-body text-sm"
            style={{ color: "var(--red)" }}
          >
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isPending}
          className="w-full py-3.5 font-body text-sm tracking-wide transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--green)",
            color: "var(--white)",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (!loading && !isPending) {
              e.currentTarget.style.backgroundColor = "var(--green-light)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--green)";
          }}
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

      {/* Footer accent */}
      <div className="mt-16 flex justify-center">
        <div 
          className="w-8 h-8 rounded-full opacity-20"
          style={{ backgroundColor: "var(--tan)" }}
        />
      </div>

      {/* Quick Login for Development */}
      {process.env.NODE_ENV === "development" && (
        <div 
          className="mt-12 pt-8"
          style={{ borderTop: "1px dashed var(--border)" }}
        >
          <p 
            className="font-mono text-xs text-center mb-4 uppercase tracking-wider"
            style={{ color: "var(--muted)", opacity: 0.6 }}
          >
            Dev Quick Login
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleQuickLogin("onboarding")}
              disabled={isPending || loading}
              className="flex-1 py-2.5 font-mono text-xs transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--tan)",
                color: "var(--tan-dark)",
              }}
              onMouseEnter={(e) => {
                if (!isPending && !loading) {
                  e.currentTarget.style.backgroundColor = "var(--tan)";
                  e.currentTarget.style.color = "var(--white)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--tan-dark)";
              }}
            >
              {isPending ? "..." : "Onboarding"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("dashboard")}
              disabled={isPending || loading}
              className="flex-1 py-2.5 font-mono text-xs transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--cyan)",
                color: "var(--cyan)",
              }}
              onMouseEnter={(e) => {
                if (!isPending && !loading) {
                  e.currentTarget.style.backgroundColor = "var(--cyan)";
                  e.currentTarget.style.color = "var(--white)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--cyan)";
              }}
            >
              {isPending ? "..." : "Dashboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
