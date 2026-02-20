"use client";

import { useEffect, useState } from "react";
import MessageBubble from "@/components/MessageBubble";
import ActionCardBubble from "@/components/ActionCardBubble";
import CreateActionCardSheet from "@/components/CreateActionCardSheet";
import ActionCardDetailSheet from "@/components/ActionCardDetailSheet";

export default function RoomClient({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [room, setRoom] = useState<any>(null);
  const [text, setText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const load = () => fetch(`/api/rooms/${roomId}/messages`).then((r) => r.json()).then((d) => { setMessages(d.messages || []); setRoom(d.room); });
  useEffect(() => { load(); }, [roomId]);

  const send = async () => {
    if (!text.trim()) return;
    await fetch(`/api/rooms/${roomId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "text", text }) });
    setText("");
    load();
  };

  const openCard = async (cardId: string) => {
    const d = await fetch(`/api/cards/${cardId}`).then((r) => r.json());
    setDetail(d.card);
    setEvents(d.events || []);
  };

  const cardAction = async (cardId: string, type: "approve" | "reject") => {
    await fetch(`/api/cards/${cardId}/${type}`, { method: "POST" });
    load();
  };

  return (
    <div>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <p className="font-semibold">{room?.name || "Room"}</p>
        <span>⋯</span>
      </header>
      <div className="space-y-3 px-3 py-3">
        {messages.map((m) =>
          m.kind === "action_card" && m.card ? (
            <ActionCardBubble key={m.id} card={m.card} canApprove={m.currentUserCanApprove} onAction={(type) => cardAction(m.card.id, type)} onOpen={() => openCard(m.card.id)} />
          ) : (
            <MessageBubble key={m.id} mine={m.isMine} name={m.user_name} text={m.text} />
          )
        )}
      </div>
      <div className="fixed bottom-14 left-1/2 flex w-full max-w-[420px] -translate-x-1/2 gap-1 border-t bg-white p-2">
        <button className="rounded border px-2">🎤</button>
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border px-2" placeholder="Message" />
        <button className="rounded border px-2">📎</button>
        <button className="rounded border px-2" onClick={() => setShowCreate(true)}>+</button>
        <button className="rounded bg-digi-blue px-2 text-white" onClick={send}>Send</button>
      </div>
      {showCreate ? <CreateActionCardSheet roomId={roomId} onClose={() => setShowCreate(false)} onCreated={load} /> : null}
      {detail ? <ActionCardDetailSheet card={detail} events={events} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
