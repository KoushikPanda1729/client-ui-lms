import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find English Speaking Partners | SpeakEasy",
  description:
    "Connect with native English speakers and language partners worldwide. Practice real conversations, improve fluency, and build confidence in English.",
  keywords: [
    "find English speaking partner",
    "English conversation partner",
    "practice English with native speakers",
    "language exchange",
    "speak English with partners",
    "English fluency practice",
  ],
  alternates: {
    canonical: "https://learn.koushikpanda.online/partners",
  },
  openGraph: {
    title: "Find English Speaking Partners | SpeakEasy",
    description:
      "Connect with native English speakers worldwide. Practice real conversations and improve your fluency on SpeakEasy.",
    url: "https://learn.koushikpanda.online/partners",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
