"use client";

import { useEffect, useState } from "react";
import BottomTabBar from "@/components/BottomTabBar";
import { useRouter } from "next/navigation";

export default function MePage() {
  const [me, setMe] = useState<any>(null);
  const router = useRouter();
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)); }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <main className="pb-20">
      <header className="border-b px-4 py-3 text-lg font-semibold">Me</header>
      <section className="m-4 rounded-xl border p-4">
        <p className="font-semibold">{me?.name}</p>
        <p className="text-sm text-slate-600">{me?.email}</p>
        <p className="mt-1 text-xs text-slate-500">{me?.role}</p>
      </section>
      <section className="space-y-2 px-4 text-sm text-slate-700">
        <div className="rounded border p-3">Organizations</div>
        <div className="rounded border p-3">Notifications (stub)</div>
        <div className="rounded border p-3">Security (sessions)</div>
        <div className="rounded border p-3">Settings (stub)</div>
      </section>
      <div className="px-4 pt-4"><button onClick={logout} className="w-full rounded bg-slate-800 p-2 text-white">Logout</button></div>
      <BottomTabBar />
    </main>
  );
}
