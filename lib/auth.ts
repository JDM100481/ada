import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { id, nowTs } from "@/lib/utils";

const SESSION_COOKIE = "digicom_session";
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  org_id: string;
};

export const loginWithEmail = (email: string, password: string) => {
  const user = db
    .prepare(
      `SELECT u.*, m.role, m.org_id
       FROM users u JOIN memberships m ON m.user_id = u.id
       WHERE u.email = ? LIMIT 1`
    )
    .get(email) as SessionUser & { password_hash: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return null;
  }

  const sid = id();
  const ts = nowTs();
  db.prepare("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?,?,?,?)").run(
    sid,
    user.id,
    ts,
    ts + SESSION_TTL
  );
  cookies().set(SESSION_COOKIE, sid, { httpOnly: true, sameSite: "lax", path: "/" });

  return { id: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id };
};

export const logout = () => {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (sid) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sid);
    cookies().delete(SESSION_COOKIE);
  }
};

export const getSessionUser = () => {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, m.role, m.org_id, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN memberships m ON m.user_id = u.id
       WHERE s.id = ? LIMIT 1`
    )
    .get(sid) as (SessionUser & { expires_at: number }) | undefined;

  if (!row || row.expires_at < nowTs()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sid);
    cookies().delete(SESSION_COOKIE);
    return null;
  }

  return { id: row.id, name: row.name, email: row.email, role: row.role, org_id: row.org_id };
};

export const requireSessionUser = () => {
  const user = getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
};
