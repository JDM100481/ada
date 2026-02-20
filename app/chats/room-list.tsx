"use client";

import { useEffect, useState } from "react";
import ChatListItem from "@/components/ChatListItem";

export default function ChatListClient() {
  const [rooms, setRooms] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/rooms").then((r) => r.json()).then((d) => setRooms(d.rooms || []));
  }, []);
  return <div>{rooms.map((room) => <ChatListItem key={room.id} room={room} />)}</div>;
}
