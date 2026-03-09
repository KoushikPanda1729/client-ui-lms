import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SpeakEasy",
  description: "Your SpeakEasy dashboard — track progress, courses, and sessions.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
