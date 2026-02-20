import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { id, nowTs } from "@/lib/utils";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

  const org = db.prepare("SELECT id FROM orgs LIMIT 1").get() as { id: string };
  const userId = id();
  const ts = nowTs();

  db.prepare("INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)").run(
    userId,
    name,
    email,
    bcrypt.hashSync(password, 10),
    ts
  );
  db.prepare("INSERT INTO memberships (id,org_id,user_id,role,created_at) VALUES (?,?,?,?,?)").run(id(), org.id, userId, "CAREGIVER", ts);

  return NextResponse.json({ ok: true });
}
