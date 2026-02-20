import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { canUploadReceipts } from "@/lib/rbac";
import { id, nowTs } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const user = requireSessionUser();
  if (!canUploadReceipts(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { attachmentId } = await req.json();
  const card = db.prepare("SELECT * FROM action_cards WHERE id = ?").get(params.cardId) as any;
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  db.prepare("UPDATE attachments SET card_id = ?, room_id = ? WHERE id = ?").run(params.cardId, card.room_id, attachmentId);
  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)")
    .run(id(), params.cardId, user.id, "ATTACHMENT_ADDED", JSON.stringify({ attachmentId }), nowTs());

  return NextResponse.json({ ok: true });
}
