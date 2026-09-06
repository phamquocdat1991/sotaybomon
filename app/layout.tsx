import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SỔ TAY BỘ MÔN",
  description:
    "Bàn làm việc số dành cho giáo viên bộ môn: quản lý lớp học, thời khóa biểu, tiết học, học sinh và sổ điểm.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  applicationName: "Sổ tay bộ môn",
  formatDetection: {
    telephone: false,
  },
  other: {
    "codex-preview": "development",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12372d",
  colorScheme: "light",
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
