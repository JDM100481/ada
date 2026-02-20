import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { id, nowTs } from "@/lib/utils";

export async function POST(_: Request, { params }: { params: { cardId: string } }) {
  const user = requireSessionUser();
  const ts = nowTs();
  db.prepare("UPDATE action_cards SET status='COMPLETED', updated_at=? WHERE id=?").run(ts, params.cardId);
  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)").run(id(), params.cardId, user.id, "COMPLETED", "{}", ts);
  return NextResponse.json({ ok: true });
}
