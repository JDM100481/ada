import BottomTabBar from "@/components/BottomTabBar";
import ChatListClient from "./room-list";

export default function ChatsPage() {
  return (
    <main className="pb-20">
      <header className="border-b px-4 py-3 text-lg font-semibold">Chats</header>
      <ChatListClient />
      <BottomTabBar />
    </main>
  );
}
