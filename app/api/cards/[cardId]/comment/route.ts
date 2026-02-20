import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { id, nowTs } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const user = requireSessionUser();
  const { comment } = await req.json();
  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(), params.cardId, user.id, "COMMENTED", JSON.stringify({ comment }), nowTs()
  );
  return NextResponse.json({ ok: true });
}
