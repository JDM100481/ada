"use client";

import { useEffect, useState } from "react";
import BottomTabBar from "@/components/BottomTabBar";

export default function ContactsPage() {
  const [data, setData] = useState<any>({ rooms: [], contacts: [] });
  useEffect(() => { fetch("/api/rooms").then((r) => r.json()).then((d) => setData(d)); }, []);

  return (
    <main className="pb-20">
      <header className="border-b px-4 py-3 text-lg font-semibold">Contacts</header>
      <section className="border-b p-4">
        <h2 className="text-sm font-semibold">My Groups</h2>
        {data.rooms.map((r: any) => <div key={r.id} className="mt-2 text-sm">{r.name}</div>)}
      </section>
      <section className="p-4">
        <h2 className="text-sm font-semibold">All Contacts</h2>
        {data.contacts.map((c: any) => <div key={c.id} className="mt-2 text-sm">{c.name} · {c.role}</div>)}
      </section>
      <BottomTabBar />
    </main>
  );
}
