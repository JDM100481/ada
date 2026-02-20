"use client";

import { formatMoney } from "@/lib/utils";

const statusClass: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700"
};

export default function ActionCardBubble({ card, canApprove, onAction, onOpen }: { card: any; canApprove: boolean; onAction: (type: "approve" | "reject") => void; onOpen: () => void }) {
  const fields = JSON.parse(card.fields_json || "{}");
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">{card.title}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusClass[card.status] || "bg-slate-100"}`}>{card.status}</span>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        {fields.amount ? formatMoney(Number(fields.amount)) : fields.reason || fields.item || "See details"}
      </p>
      <button onClick={onOpen} className="mt-2 text-xs text-digi-blue">Open details</button>
      {canApprove && card.status === "PENDING" ? (
        <div className="mt-2 flex gap-2">
          <button onClick={() => onAction("approve")} className="rounded bg-green-600 px-3 py-1 text-xs text-white">Approve</button>
          <button onClick={() => onAction("reject")} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Reject</button>
        </div>
      ) : null}
    </div>
  );
}
