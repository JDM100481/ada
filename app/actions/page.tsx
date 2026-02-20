"use client";

import { useEffect, useState } from "react";
import BottomTabBar from "@/components/BottomTabBar";

export default function ActionsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [updated, setUpdated] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/cards?filter=pending").then((r) => r.json()),
      fetch("/api/cards?filter=updated").then((r) => r.json()),
      fetch("/api/cards?filter=completed").then((r) => r.json())
    ]).then(([a, b, c]) => {
      setPending(a.cards || []);
      setUpdated(b.cards || []);
      setCompleted(c.cards || []);
    });
  }, []);

  const Section = ({ title, items }: any) => (
    <section className="border-b p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {items.length ? items.map((i: any) => <div key={i.id} className="mb-2 rounded border p-2 text-sm">{i.title} · {i.status}</div>) : <p className="text-xs text-slate-500">No items</p>}
    </section>
  );

  return (
    <main className="pb-20">
      <header className="border-b px-4 py-3 text-lg font-semibold">Actions</header>
      <Section title="Pending for You" items={pending} />
      <Section title="Recently Updated" items={updated} />
      <Section title="Completed" items={completed} />
      <BottomTabBar />
    </main>
  );
}
