import "./globals.css";
import type { ReactNode } from "react";
import "@/lib/seed";

export const metadata = {
  title: "Digicom+ Family",
  description: "Chat + Action Cards MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
