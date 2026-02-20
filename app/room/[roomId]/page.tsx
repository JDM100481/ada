import BottomTabBar from "@/components/BottomTabBar";
import RoomClient from "./room-client";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main className="pb-24">
      <RoomClient roomId={params.roomId} />
      <BottomTabBar />
    </main>
  );
}
