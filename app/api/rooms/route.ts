import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";

export async function GET() {
  const user = requireSessionUser();
  const rooms = db
    .prepare(
      `SELECT r.*, (
        SELECT json_extract(m.body_json, '$.text')
        FROM messages m
        WHERE m.room_id = r.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as preview
      FROM rooms r WHERE r.org_id = ?
      ORDER BY r.is_pinned_default DESC, r.created_at ASC`
    )
    .all(user.org_id);

  const contacts = db
    .prepare(
      `SELECT u.id, u.name, m.role FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.org_id = ?`
    )
    .all(user.org_id);

  return NextResponse.json({ rooms, contacts });
}
