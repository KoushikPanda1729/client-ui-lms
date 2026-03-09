import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpeakEasy — Master English with Real Partners",
  description:
    "Learn English through interactive courses and live speaking practice with native speakers. AI tutoring, real conversation partners, and structured lessons for all levels.",
  keywords: [
    "learn English online",
    "English speaking practice",
    "English courses",
    "speak English fluently",
    "AI English tutor",
    "English conversation partner",
    "online English classes",
    "English for beginners",
    "improve English speaking",
    "SpeakEasy",
  ],
  metadataBase: new URL("https://learn.koushikpanda.online"),
  openGraph: {
    title: "SpeakEasy — Master English with Real Partners",
    description:
      "Learn English through interactive courses and live speaking practice with native speakers.",
    url: "https://learn.koushikpanda.online",
    siteName: "SpeakEasy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SpeakEasy — Master English with Real Partners",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeakEasy — Master English with Real Partners",
    description:
      "Learn English through interactive courses and live speaking practice with native speakers.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }} data-theme="light">
      <body className={`${inter.variable} antialiased`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AntdRegistry>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#6366f1",
                  borderRadius: 10,
                  fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
                },
              }}
            >
              <AuthProvider>{children}</AuthProvider>
            </ConfigProvider>
          </AntdRegistry>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
