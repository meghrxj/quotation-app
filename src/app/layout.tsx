import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Same family used inside the generated PDFs — keeps UI and output consistent.
const notoSans = localFont({
  src: [
    { path: "../../public/fonts/NotoSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/NotoSans-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../public/fonts/NotoSans-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/NotoSans-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quotation Generator — Shantanu Enterprises",
  description:
    "Generate client quotations for Shantanu Enterprises as instant, client-side PDFs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${notoSans.className} antialiased`}>{children}</body>
    </html>
  );
}
