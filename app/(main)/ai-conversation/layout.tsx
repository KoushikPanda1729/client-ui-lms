import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI English Tutor — Practice Anytime | SpeakEasy",
  description:
    "Practice English conversations with our AI tutor anytime, anywhere. Get instant feedback on grammar, pronunciation, and vocabulary. No schedule needed.",
  keywords: [
    "AI English tutor",
    "practice English with AI",
    "English conversation AI",
    "AI language tutor",
    "English speaking practice online",
    "improve English speaking",
    "English chatbot tutor",
  ],
  alternates: {
    canonical: "https://learn.koushikpanda.online/ai-conversation",
  },
  openGraph: {
    title: "AI English Tutor — Practice Anytime | SpeakEasy",
    description:
      "Practice English conversations with our AI tutor anytime. Get instant grammar and pronunciation feedback.",
    url: "https://learn.koushikpanda.online/ai-conversation",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function AiConversationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
