import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | SpeakEasy",
  description: "Manage your SpeakEasy account settings.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
