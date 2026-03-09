import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free | SpeakEasy",
  description:
    "Create your free SpeakEasy account and start learning English with courses, AI tutoring, and live speaking partners today.",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
