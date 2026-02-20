# Digicom+ Family MVP (OFW KSA Diaspora)

Lean mobile-first Next.js app for chat + Action Cards approvals and proof receipts.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- SQLite (`better-sqlite3`)
- Cookie session auth

## Features
- Mobile-only centered shell (~420px)
- Chats-first UX + bottom tabs: Chats / Contacts / Actions / Me
- Rooms and text messaging
- Action Cards created in a room and mirrored to Approvals room
- Approve / Reject / Complete with audit timeline events
- Upload attachments to local `/uploads`
- RBAC for OFW sponsor, finance lead, caregiver, auditor
- Seed data auto-created on first startup

## Setup
```bash
npm install
npm run dev
```

Open: `http://localhost:3000/login`

## Demo Credentials
- `juan@demo.com` / `demo1234` (OFW_SPONSOR)
- `tess@demo.com` / `demo1234` (FINANCE_LEAD)
- `mark@demo.com` / `demo1234` (CAREGIVER)
- `audit@demo.com` / `demo1234` (AUDITOR)

## API Overview
- Auth: `/api/auth/signup|login|logout|me`
- Rooms: `/api/rooms`, `/api/rooms/[roomId]/messages`
- Cards: `/api/cards`, `/api/cards/[cardId]`, approve/reject/complete/comment/attach
- Uploads: `/api/upload`

## Notes
- DigiCom+ does not custody funds; it coordinates actions and stores proofs.
- Uploaded files are saved to `uploads/` and ignored by git.
