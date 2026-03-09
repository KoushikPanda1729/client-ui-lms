import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Sessions | SpeakEasy",
  description: "View and manage your English speaking sessions on SpeakEasy.",
  robots: { index: false, follow: false },
};

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
