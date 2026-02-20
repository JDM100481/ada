import Link from "next/link";

export default function ChatListItem({ room }: { room: any }) {
  return (
    <Link href={`/room/${room.id}`} className="block border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{room.name}</p>
        {room.is_pinned_default ? <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] text-digi-blue">Pinned</span> : null}
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{room.preview || "No messages yet"}</p>
    </Link>
  );
}
