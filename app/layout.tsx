import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Team Tracker",
  description:
    "Sổ tay riêng của manager: ghi quan sát & theo dõi nhận định về nhân viên theo thời gian.",
  applicationName: "Team Tracker",
  // iOS standalone PWA support (no beforeinstallprompt on Safari — install is manual).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Team Tracker",
  },
  // Favicon + apple-touch-icon are auto-injected from app/icon.png and
  // app/apple-icon.png (Next.js file conventions) — no manual `icons` needed.
};

// themeColor + viewport-fit live in the viewport export (Next.js convention).
export const viewport: Viewport = {
  themeColor: "#3f8f6b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
