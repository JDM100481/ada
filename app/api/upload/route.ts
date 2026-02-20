import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireSessionUser } from "@/lib/auth";
import { id, nowTs } from "@/lib/utils";
import db from "@/lib/db";

export async function POST(req: Request) {
  const user = requireSessionUser();
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const roomId = String(form.get("roomId") || "");
  if (!file || !roomId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const name = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const relPath = path.join("uploads", name);
  const full = path.join(process.cwd(), relPath);
  fs.writeFileSync(full, bytes);

  const attachmentId = id();
  db.prepare("INSERT INTO attachments (id,room_id,card_id,message_id,uploaded_by,file_name,mime_type,file_path,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(attachmentId, roomId, null, null, user.id, file.name, file.type || "application/octet-stream", relPath, nowTs());

  return NextResponse.json({ id: attachmentId, file_path: relPath, file_name: file.name, mime_type: file.type });
}
