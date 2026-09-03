import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sổ tay bộ môn Địa lý",
  description:
    "Bàn làm việc số dành cho giáo viên bộ môn: quản lý lớp học, thời khóa biểu, tiết học, học sinh và sổ điểm.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
