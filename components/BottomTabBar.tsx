"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/chats", label: "Chats" },
  { href: "/contacts", label: "Contacts" },
  { href: "/actions", label: "Actions" },
  { href: "/me", label: "Me" }
];

export default function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 border-t bg-white px-3 py-2">
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link key={tab.href} href={tab.href} className={`rounded-xl py-2 ${active ? "bg-blue-50 text-digi-blue" : "text-slate-500"}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
