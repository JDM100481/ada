"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("juan@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");

  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return setError("Invalid login");
    router.push("/chats");
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-digi-blue">Digicom+ Family</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in to continue</p>
      <div className="mt-5 space-y-3">
        <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full rounded border p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button onClick={login} className="w-full rounded bg-digi-blue p-2 text-white">Login</button>
      </div>
    </main>
  );
}
