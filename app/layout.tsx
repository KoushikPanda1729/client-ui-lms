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
    "Learn English through interactive courses and live speaking practice with native speakers.",
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
