export default function MessageBubble({ mine, name, text }: { mine: boolean; name: string; text: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-digi-blue text-white" : "bg-slate-100"}`}>
        {!mine ? <p className="mb-1 text-[10px] text-slate-500">{name}</p> : null}
        <p>{text}</p>
      </div>
    </div>
  );
}
