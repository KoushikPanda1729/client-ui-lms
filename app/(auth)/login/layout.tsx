import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | SpeakEasy",
  description: "Log in to your SpeakEasy account and continue your English learning journey.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
