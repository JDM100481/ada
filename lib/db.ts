import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { id, nowTs } from "@/lib/utils";

const dataDir = path.join(process.cwd(), ".data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "digicom.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_pinned_default INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  body_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS action_cards (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to TEXT NULL,
  due_date INTEGER NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS action_events (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  card_id TEXT NULL,
  message_id TEXT NULL,
  uploaded_by TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
`;

db.exec(schemaSql);

const seedIfNeeded = () => {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c > 0) return;

  const ts = nowTs();
  const orgId = id();
  db.prepare("INSERT INTO orgs (id,name,type,created_at) VALUES (?,?,?,?)").run(
    orgId,
    "Delacruz Family (KSA)",
    "family",
    ts
  );

  const demoUsers = [
    { name: "Juan OFW", email: "juan@demo.com", role: "OFW_SPONSOR" },
    { name: "Nanay Tess", email: "tess@demo.com", role: "FINANCE_LEAD" },
    { name: "Kuya Mark", email: "mark@demo.com", role: "CAREGIVER" },
    { name: "Audit Ana", email: "audit@demo.com", role: "AUDITOR" }
  ];

  const userIds: Record<string, string> = {};
  const pass = bcrypt.hashSync("demo1234", 10);

  demoUsers.forEach((u) => {
    const uid = id();
    userIds[u.name] = uid;
    db.prepare("INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)").run(
      uid,
      u.name,
      u.email,
      pass,
      ts
    );
    db.prepare("INSERT INTO memberships (id,org_id,user_id,role,created_at) VALUES (?,?,?,?,?)").run(
      id(),
      orgId,
      uid,
      u.role,
      ts
    );
  });

  const rooms = [
    { name: "Family HQ", type: "hq", pin: 1 },
    { name: "Approvals", type: "approvals", pin: 1 },
    { name: "Box+Padala Planning", type: "box_padala", pin: 0 },
    { name: "Receipts & Proof", type: "receipts", pin: 0 },
    { name: "Goals", type: "goals", pin: 0 }
  ];

  const roomIds: Record<string, string> = {};
  rooms.forEach((r) => {
    const rid = id();
    roomIds[r.type] = rid;
    db.prepare("INSERT INTO rooms (id,org_id,name,type,is_pinned_default,created_at) VALUES (?,?,?,?,?,?)").run(
      rid,
      orgId,
      r.name,
      r.type,
      r.pin,
      ts
    );
  });

  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    roomIds.hq,
    userIds["Juan OFW"],
    "text",
    JSON.stringify({ text: "Team, pa-check school fees for this month." }),
    ts
  );

  const cardId = id();
  const fields = {
    amount: 2500,
    reason: "School Fees",
    deadline: null,
    proof_required: true
  };

  db.prepare(
    "INSERT INTO action_cards (id,room_id,created_by,card_type,title,fields_json,status,assigned_to,due_date,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).run(
    cardId,
    roomIds.hq,
    userIds["Kuya Mark"],
    "REQUEST_FUNDS",
    "₱2,500 School Fees",
    JSON.stringify(fields),
    "PENDING",
    null,
    null,
    ts,
    ts
  );

  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    roomIds.hq,
    userIds["Kuya Mark"],
    "action_card",
    JSON.stringify({ card_id: cardId, title: "₱2,500 School Fees" }),
    ts
  );

  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    roomIds.approvals,
    userIds["Kuya Mark"],
    "system",
    JSON.stringify({ text: "New approval requested: ₱2,500 School Fees" }),
    ts
  );

  db.prepare("INSERT INTO messages (id,room_id,user_id,kind,body_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    roomIds.approvals,
    userIds["Kuya Mark"],
    "action_card",
    JSON.stringify({ card_id: cardId, title: "₱2,500 School Fees", mirrored: true }),
    ts
  );

  db.prepare("INSERT INTO action_events (id,card_id,actor_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?,?)").run(
    id(),
    cardId,
    userIds["Kuya Mark"],
    "CREATED",
    JSON.stringify({ message: "Card created" }),
    ts
  );
};

seedIfNeeded();

export default db;
