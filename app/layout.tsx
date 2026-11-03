import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Малки стъпки — Големи открития за 1. клас",
  description:
    "Букви, числа и светът около нас. Спокойни образователни игри за първокласници — без регистрация, с насърчение и в собствено темпо.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
