import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Courses Online | SpeakEasy",
  description:
    "Browse our structured English courses designed for all levels. Learn grammar, vocabulary, pronunciation, and real-world speaking skills at your own pace.",
  keywords: [
    "English courses online",
    "learn English",
    "English lessons",
    "speak English fluently",
    "English for beginners",
    "English grammar course",
    "online English classes",
  ],
  alternates: {
    canonical: "https://learn.koushikpanda.online/courses",
  },
  openGraph: {
    title: "English Courses Online | SpeakEasy",
    description:
      "Browse our structured English courses designed for all levels. Learn grammar, vocabulary, and real-world speaking skills.",
    url: "https://learn.koushikpanda.online/courses",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
