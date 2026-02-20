import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { canApproveCards, canCreateCards } from "@/lib/rbac";
import { id, nowTs } from "@/lib/utils";

export async function GET(req: Request) {
  const user = requireSessionUser();
  const filter = new URL(req.url).searchParams.get("filter") || "updated";

  let sql = "SELECT * FROM action_cards WHERE 1=1";
  const params: any[] = [];

  if (filter === "pending") {
    sql += " AND status = 'PENDING'";
    if (!canApproveCards(user.role)) sql += " AND (assigned_to = ? OR created_by = ?)", params.push(user.id, user.id);
  } else if (filter === "completed") {
    sql += " AND status = 'COMPLETED'";
  }

  sql += " ORDER BY updated_at DESC LIMIT 30";
  const cards = db.prepare(sql).all(...params);
  return NextResponse.json({ cards });
}

export async function POST(req: Request) {
  const user = requireSessionUser();
  if (!canCreateCards(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { roomId, cardType, title, fields, assignedTo, dueDate } = await req.json();
  const ts = nowTs();
  const cardId = id();

  db.prepare(
    "INSERT INTO action_cards (id,room_id,created_by,card_type,title,fields_json,status,assigned_to,due_date,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).run(cardId, roomId, user.id, cardType, title, JSON.stringify(fields || {}), "PENDING", assignedTo || null, dueDate || null, ts, ts);

  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    cardId,
    user.id,
    "CREATED",
    JSON.stringify({ title }),
    ts
  );

  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    roomId,
    user.id,
    "action_card",
    JSON.stringify({ card_id: cardId, title }),
    ts
  );

  const approvals = db.prepare("SELECT id FROM rooms WHERE org_id = ? AND type = 'approvals' LIMIT 1").get(user.org_id) as { id: string };
  if (approvals) {
    db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
      id(), approvals.id, user.id, "system", JSON.stringify({ text: `New approval requested: ${title}` }), ts
    );
    db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
      id(), approvals.id, user.id, "action_card", JSON.stringify({ card_id: cardId, title, mirrored: true }), ts
    );
  }

  return NextResponse.json({ id: cardId });
}
