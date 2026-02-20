"use client";

import { useState } from "react";

export default function CreateActionCardSheet({ roomId, onClose, onCreated }: { roomId: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("Request Funds");
  const [amount, setAmount] = useState("2500");
  const [reason, setReason] = useState("School Fees");

  const submit = async () => {
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        cardType: "REQUEST_FUNDS",
        title,
        fields: { amount: Number(amount), reason, proof_required: true }
      })
    });
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-20 bg-black/30">
      <div className="absolute bottom-0 w-full max-w-[420px] rounded-t-2xl bg-white p-4">
        <p className="font-semibold">Create Action Card</p>
        <input className="mt-3 w-full rounded border p-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="mt-2 w-full rounded border p-2 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="mt-2 w-full rounded border p-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-3 flex gap-2">
          <button className="rounded border px-3 py-1 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded bg-digi-blue px-3 py-1 text-sm text-white" onClick={submit}>Create</button>
        </div>
      </div>
    </div>
  );
}
