import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { canApproveCards } from "@/lib/rbac";
import { id, nowTs } from "@/lib/utils";

export async function POST(_: Request, { params }: { params: { cardId: string } }) {
  const user = requireSessionUser();
  if (!canApproveCards(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const card = db.prepare("SELECT * FROM action_cards WHERE id = ?").get(params.cardId) as any;
  const ts = nowTs();
  db.prepare("UPDATE action_cards SET status='REJECTED', updated_at=? WHERE id=?").run(ts, params.cardId);
  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)").run(id(), params.cardId, user.id, "REJECTED", "{}", ts);
  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(id(), card.room_id, user.id, "system", JSON.stringify({ text: `Rejected by ${user.name}` }), ts);
  return NextResponse.json({ ok: true });
}
