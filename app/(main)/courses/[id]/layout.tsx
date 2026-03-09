import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const course = json?.data ?? json;
      const title = `${course.title} | SpeakEasy`;
      const description =
        course.description ??
        "Master English with this structured course on SpeakEasy. Video lessons, quizzes, and speaking practice included.";
      const image = course.thumbnailUrl ?? "/og-image.png";

      return {
        title,
        description,
        keywords: [
          course.title,
          "English course",
          "learn English online",
          "speak English",
          "SpeakEasy",
        ],
        alternates: {
          canonical: `https://learn.koushikpanda.online/courses/${id}`,
        },
        openGraph: {
          title,
          description,
          url: `https://learn.koushikpanda.online/courses/${id}`,
          images: [{ url: image, width: 1200, height: 630 }],
          type: "website",
        },
      };
    }
  } catch {
    // fallback below
  }

  return {
    title: "English Course | SpeakEasy",
    description:
      "Master English with structured video lessons, quizzes, and live speaking practice on SpeakEasy.",
    alternates: {
      canonical: `https://learn.koushikpanda.online/courses/${id}`,
    },
    openGraph: {
      title: "English Course | SpeakEasy",
      description:
        "Master English with structured video lessons, quizzes, and live speaking practice on SpeakEasy.",
      url: `https://learn.koushikpanda.online/courses/${id}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      type: "website",
    },
  };
}

export default function CourseDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
