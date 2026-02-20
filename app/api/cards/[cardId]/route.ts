import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { cardId: string } }) {
  requireSessionUser();
  const card = db.prepare("SELECT * FROM action_cards WHERE id = ?").get(params.cardId);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const events = db.prepare("SELECT * FROM action_events WHERE card_id = ? ORDER BY created_at ASC").all(params.cardId);
  const attachments = db.prepare("SELECT * FROM attachments WHERE card_id = ? ORDER BY created_at DESC").all(params.cardId);
  return NextResponse.json({ card, events, attachments });
}
