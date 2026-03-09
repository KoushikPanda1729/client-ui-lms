import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | SpeakEasy",
  description:
    "Complete your SpeakEasy profile to get personalized English learning recommendations.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
