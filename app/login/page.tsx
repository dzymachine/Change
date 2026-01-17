"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function signUp() {
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    setMsg("Signed up! Check your email if confirmations are enabled.");
  }

  async function signIn() {
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.push("/protected");
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />

      <label style={{ display: "block", marginTop: 12 }}>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%" }}
      />

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={signIn}>Sign in</button>
        <button onClick={signUp}>Sign up</button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
