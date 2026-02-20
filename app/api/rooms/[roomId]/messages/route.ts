import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { canApproveCards } from "@/lib/rbac";
import { id, nowTs } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { roomId: string } }) {
  const user = requireSessionUser();
  const room = db.prepare("SELECT * FROM rooms WHERE id = ? AND org_id = ?").get(params.roomId, user.org_id);
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = db
    .prepare(
      `SELECT m.*, u.name as user_name
       FROM messages m JOIN users u ON u.id = m.user_id
       WHERE m.room_id = ? ORDER BY m.created_at ASC`
    )
    .all(params.roomId) as any[];

  const messages = rows.map((m) => {
    const body = JSON.parse(m.body_json || "{}");
    if (m.kind === "action_card" && body.card_id) {
      const card = db.prepare("SELECT * FROM action_cards WHERE id = ?").get(body.card_id);
      return { ...m, card, currentUserCanApprove: canApproveCards(user.role), isMine: user.id === m.user_id, text: body.text || body.title };
    }
    return { ...m, isMine: user.id === m.user_id, text: body.text || "" };
  });

  return NextResponse.json({ room, messages });
}

export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  const user = requireSessionUser();
  const { kind = "text", text } = await req.json();
  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    params.roomId,
    user.id,
    kind,
    JSON.stringify({ text }),
    nowTs()
  );
  return NextResponse.json({ ok: true });
}
