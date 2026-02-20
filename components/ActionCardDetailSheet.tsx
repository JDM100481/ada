"use client";

export default function ActionCardDetailSheet({ card, events, onClose }: { card: any; events: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 bg-black/30">
      <div className="absolute bottom-0 h-[70vh] w-full max-w-[420px] overflow-auto rounded-t-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{card.title}</p>
          <button onClick={onClose}>✕</button>
        </div>
        <pre className="mt-3 rounded bg-slate-50 p-2 text-xs">{JSON.stringify(JSON.parse(card.fields_json || "{}"), null, 2)}</pre>
        <p className="mt-3 text-sm font-medium">Timeline</p>
        <div className="mt-2 space-y-2 text-xs">
          {events.map((e) => (
            <div key={e.id} className="rounded border p-2">{e.event_type}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
