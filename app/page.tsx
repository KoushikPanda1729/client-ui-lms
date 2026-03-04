"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, message, Skeleton } from "antd";
import {
  PlayCircleOutlined,
  BookOutlined,
  StarFilled,
  ArrowRightOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  LockOutlined,
  MobileFilled,
} from "@ant-design/icons";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/services/auth";
import { courseService, Course } from "@/lib/services/course";

/* ═══════════════════════════════════════════════
   HERO — Clean centered, compact
   ═══════════════════════════════════════════════ */
function Hero() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const loggedUser = await authService.googleSignIn(idToken);
      setUser(loggedUser);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Google sign-in failed";
      messageApi.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    const btn = googleBtnRef.current?.querySelector<HTMLElement>('[role="button"]');
    if (btn) btn.click();
    else messageApi.error("Google Sign-In not ready, please try again");
  };

  return (
    <section
      className="relative overflow-hidden pt-16"
      style={{ background: "linear-gradient(160deg, #0d0d1f 0%, #10082e 60%, #0a1128 100%)" }}
    >
      {contextHolder}

      {/* Hidden GoogleLogin */}
      <div
        ref={googleBtnRef}
        style={{ position: "absolute", opacity: 0, height: 0, overflow: "hidden" }}
      >
        <GoogleLogin
          onSuccess={(cr) => {
            if (cr.credential) handleGoogleSuccess(cr.credential);
          }}
          onError={() => messageApi.error("Google sign-in failed")}
        />
      </div>

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        {/* Badge */}
        <Link
          href="/courses"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 no-underline backdrop-blur-sm transition-all hover:bg-indigo-500/20"
        >
          🎉 10,000+ learners improved their IELTS score
          <span className="text-indigo-400">→</span>
        </Link>

        {/* Headline */}
        <h1 className="mb-5 text-5xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Speak English
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #a5b4fc 0%, #c4b5fd 60%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            with Confidence
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-white/50">
          Live practice with native speakers, expert courses, and progress tracking — all free to
          start.
        </p>

        {/* CTAs */}
        {user ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-bold text-indigo-700 shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Continue Learning <ArrowRightOutlined />
            </button>
            <button
              onClick={() => router.push("/courses")}
              className="flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 text-[15px] font-medium text-white transition-all hover:bg-white/10"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => router.push("/register")}
              className="flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-bold text-indigo-700 shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Start Learning Free <ArrowRightOutlined />
            </button>
            <button
              onClick={() => {
                {
                }
              }}
              className="flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-[15px] font-bold text-indigo-700 shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Get App <MobileFilled />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {[
            { value: "10K+", label: "Learners" },
            { value: "50+", label: "Countries" },
            { value: "4.9★", label: "Rating" },
            { value: "200+", label: "Courses" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-8">
              {i > 0 && <div className="h-5 w-px bg-white/10" />}
              <div>
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/35">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: "🎧", text: "Live speaking sessions" },
            { icon: "📚", text: "200+ expert courses" },
            { icon: "📈", text: "Progress tracking" },
            { icon: "🏆", text: "Earn certificates" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-white/60"
            >
              <span>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ═══════════════════════════════════════════════
   SOCIAL PROOF BANNER — Light blue bg with stats
   ═══════════════════════════════════════════════ */
function SocialProofBanner() {
  return (
    <section className="bg-indigo-50/60 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
          {/* Illustration side */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="flex -space-x-3">
              {["👩‍🏫", "👨‍💼", "👩‍🎓", "🧑‍💻", "👨‍🔬"].map((e, i) => (
                <div
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-indigo-50 bg-white text-2xl shadow-sm"
                >
                  {e}
                </div>
              ))}
            </div>
          </div>
          {/* Text side */}
          <div>
            <h2 className="mb-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
              Trusted by 10,000+ learners across 50+ countries
            </h2>
            <p className="max-w-lg text-base text-zinc-500">
              SpeakEasy is the top-rated platform for English learners — the only app combining live
              native speaker practice with structured courses and AI-powered progress tracking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FEATURE SECTIONS — Alternating left-right layouts
   ═══════════════════════════════════════════════ */
function FeatureSections() {
  const sections = [
    {
      tag: "CONNECT AND PRACTICE",
      tagColor: "text-violet-600",
      title: "Where learners and native speakers come together",
      subtitle: "One-tap audio calls with real English speakers",
      desc: "Press a button and instantly match with a native English speaker for a live conversation. No scheduling, no pressure — just real practice that builds fluency naturally.",
      link: "/partners",
      linkText: "Try a live call →",
      emoji: "🎧",
      cards: [
        { icon: "🌍", text: "Speakers from 50+ countries" },
        { icon: "🔒", text: "Audio-only for comfort" },
        { icon: "⚡", text: "Instant matching" },
      ],
      bg: "from-violet-50/80 to-white",
    },
    {
      tag: "LEARN AND GROW",
      tagColor: "text-blue-600",
      title: "Expert-crafted courses for every level",
      subtitle: "From beginner basics to advanced business English",
      desc: "200+ structured courses with video lessons, interactive quizzes, and real-world exercises. Earn certificates and track your progress visually as you improve.",
      link: "/courses",
      linkText: "Browse courses →",
      emoji: "📚",
      cards: [
        { icon: "🎥", text: "HD video lessons" },
        { icon: "📝", text: "Interactive quizzes" },
        { icon: "🏆", text: "Earn certificates" },
      ],
      bg: "from-amber-50/50 to-white",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-24">
          {sections.map((s, idx) => (
            <div
              key={s.title}
              className={`flex flex-col items-center gap-12 ${idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"}`}
            >
              {/* Illustration / card side */}
              <div className="w-full lg:w-1/2">
                <div className={`rounded-3xl bg-gradient-to-br p-8 sm:p-10 ${s.bg}`}>
                  <div className="mb-6 text-center text-7xl">{s.emoji}</div>
                  <div className="grid grid-cols-3 gap-3">
                    {s.cards.map((c) => (
                      <div key={c.text} className="rounded-xl bg-white p-3.5 text-center shadow-sm">
                        <div className="mb-1.5 text-2xl">{c.icon}</div>
                        <p className="text-[11px] leading-tight font-medium text-zinc-600">
                          {c.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Text side */}
              <div className="w-full lg:w-1/2">
                <span
                  className={`mb-3 inline-block text-xs font-bold tracking-wider uppercase ${s.tagColor}`}
                >
                  {s.tag}
                </span>
                <h2 className="mb-3 text-2xl leading-tight font-bold text-zinc-900 sm:text-3xl">
                  {s.title}
                </h2>
                <p className="mb-2 text-base font-medium text-zinc-700">{s.subtitle}</p>
                <p className="mb-6 text-base leading-relaxed text-zinc-500">{s.desc}</p>
                <Link
                  href={s.link}
                  className="text-sm font-semibold text-indigo-600 no-underline hover:text-indigo-500"
                >
                  {s.linkText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   COLLECTION CTA — Blue banner (like Atlassian Teamwork Collection)
   ═══════════════════════════════════════════════ */
function CollectionCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-3xl bg-indigo-50">
          <div className="flex flex-col items-center gap-10 px-8 py-14 md:flex-row md:px-14 md:py-16">
            {/* Left text */}
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white">
                <ThunderboltOutlined /> Complete Learning
              </div>
              <h2 className="mb-3 text-2xl font-bold text-zinc-900 sm:text-3xl">
                All your English learning, one platform
              </h2>
              <p className="mb-6 max-w-md text-base leading-relaxed text-zinc-500">
                Get courses, speaking practice, progress tracking, and AI-powered feedback — all in
                one place. Everything you need to speak fluently.
              </p>
              <Link href="/register">
                <Button
                  type="primary"
                  size="large"
                  className="h-12 rounded-xl px-8 text-[15px] font-bold shadow-lg shadow-indigo-500/25"
                >
                  Get Started Free <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
            {/* Right — floating icons */}
            <div className="relative flex h-52 w-52 flex-shrink-0 items-center justify-center md:h-64 md:w-64">
              <div className="absolute flex h-16 w-16 -translate-x-10 -translate-y-12 rotate-[-12deg] items-center justify-center rounded-2xl bg-indigo-500 text-2xl text-white shadow-xl">
                📚
              </div>
              <div className="absolute flex h-16 w-16 translate-x-10 -translate-y-8 rotate-[8deg] items-center justify-center rounded-2xl bg-violet-500 text-2xl text-white shadow-xl">
                🎧
              </div>
              <div className="absolute flex h-16 w-16 -translate-x-4 translate-y-8 rotate-[-6deg] items-center justify-center rounded-2xl bg-blue-500 text-2xl text-white shadow-xl">
                📈
              </div>
              <div className="absolute flex h-14 w-14 translate-x-14 translate-y-6 rotate-[15deg] items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white shadow-xl">
                🏆
              </div>
              {/* Curved arrows */}
              <svg className="absolute h-full w-full" viewBox="0 0 200 200" fill="none">
                <path
                  d="M60 40 Q100 20 140 50"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  fill="none"
                />
                <path
                  d="M140 70 Q160 120 120 150"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  fill="none"
                />
                <path
                  d="M90 150 Q50 130 65 80"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════ */
function Testimonials() {
  const reviews = [
    {
      name: "Maria Gonzalez",
      country: "🇧🇷 Brazil",
      avatar: "👩‍🎓",
      text: "SpeakEasy helped me go from barely speaking to acing my IELTS in 4 months. The live sessions are incredible!",
      score: "IELTS 8.5",
    },
    {
      name: "Yuki Tanaka",
      country: "🇯🇵 Japan",
      avatar: "👨‍💻",
      text: "The business English course transformed how I communicate at work. My presentations are 10x more confident now.",
      score: "Promoted to Lead",
    },
    {
      name: "Ahmed Hassan",
      country: "🇪🇬 Egypt",
      avatar: "🧑‍🏫",
      text: "Practicing with native speakers daily made all the difference. I can now hold any conversation naturally.",
      score: "Fluent in 6mo",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Real results from real learners
          </h2>
          <p className="mx-auto max-w-lg text-base text-zinc-500">
            Thousands of students have transformed their English with SpeakEasy
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-zinc-100 bg-white p-6 transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-4 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarFilled key={i} className="text-sm text-amber-400" />
                ))}
              </div>
              <p className="mb-5 text-sm leading-relaxed text-zinc-600">&ldquo;{r.text}&rdquo;</p>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xl">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{r.name}</p>
                    <p className="text-[11px] text-zinc-400">{r.country}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  {r.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-16 text-center shadow-2xl shadow-indigo-500/20 sm:px-16 lg:px-24 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Ready to speak English
              <br />
              fluently?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-indigo-100">
              Join thousands of learners who transformed their English with SpeakEasy.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button
                  size="large"
                  className="h-13 rounded-2xl border-0 bg-white px-8 text-[15px] font-bold text-indigo-600 shadow-xl hover:bg-indigo-50"
                >
                  Get Started Free <ArrowRightOutlined />
                </Button>
              </Link>
              <Link href="/partners">
                <Button
                  size="large"
                  className="h-13 rounded-2xl border-2 border-white/30 bg-transparent px-8 text-[15px] font-bold text-white shadow-lg hover:bg-white/10"
                >
                  <PhoneOutlined /> Try Live Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   COURSES SECTION — Real courses from the API
   ═══════════════════════════════════════════════ */
const LEVEL_CFG = {
  beginner: { gradient: "from-emerald-400 to-teal-500", emoji: "📚" },
  intermediate: { gradient: "from-blue-400 to-indigo-500", emoji: "💼" },
  advanced: { gradient: "from-rose-400 to-pink-500", emoji: "🎯" },
} as const;

const DEFAULT_CFG = { gradient: "from-indigo-400 to-violet-500", emoji: "📖" };

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="h-44 w-full bg-zinc-100" />
      <div className="p-5">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    </div>
  );
}

function CourseCard({ c }: { c: Course }) {
  const cfg = c.level ? LEVEL_CFG[c.level] : DEFAULT_CFG;
  const priceLabel = c.isPremium ? formatPrice(c.price) : "Free";

  return (
    <Link href={`/courses/${c.id}`} className="no-underline">
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-200/60">
        {/* Coloured header */}
        <div
          className={`relative flex h-44 flex-col justify-between bg-gradient-to-br p-5 ${cfg.gradient}`}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-lg bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white capitalize backdrop-blur-sm">
              {c.level ?? "General"}
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {c.isPremium && priceLabel !== "Free" && <LockOutlined className="text-[10px]" />}
              {priceLabel}
            </span>
          </div>

          <div className="flex items-end justify-between">
            {c.thumbnailUrl ? (
              <Image
                src={c.thumbnailUrl}
                alt={c.title}
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-cover shadow-md"
              />
            ) : (
              <span className="text-5xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                {cfg.emoji}
              </span>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
              <PlayCircleOutlined className="text-lg" />
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/10" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-1.5 text-[15px] leading-snug font-bold text-zinc-900">{c.title}</h3>
          <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
            {c.description ?? "No description available."}
          </p>
          <div className="mt-auto flex items-center gap-4 text-[12px] text-zinc-400">
            <span className="flex items-center gap-1">
              <BookOutlined /> {c.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1 capitalize">
              <ClockCircleOutlined /> {c.level ?? "All levels"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService
      .list({ limit: 6 })
      .then((res) => setCourses(res.courses))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && courses.length === 0) return null;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-block text-xs font-bold tracking-wider text-indigo-600 uppercase">
              Featured Courses
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Start learning today
            </h2>
            <p className="mt-2 max-w-lg text-base text-zinc-500">
              Expert-crafted courses covering grammar, fluency, business English, and more.
            </p>
          </div>
          <Link
            href="/courses"
            className="shrink-0 text-sm font-semibold text-indigo-600 no-underline hover:text-indigo-500"
          >
            View all courses <ArrowRightOutlined />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : courses.map((c) => <CourseCard key={c.id} c={c} />)}
        </div>

        {/* CTA */}
        {!loading && courses.length >= 6 && (
          <div className="mt-10 text-center">
            <Link href="/courses">
              <Button
                size="large"
                type="primary"
                className="h-12 rounded-xl px-8 text-[15px] font-bold shadow-lg shadow-indigo-500/25"
              >
                Browse All Courses <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <Hero />
        <SocialProofBanner />
        <CoursesSection />
        <FeatureSections />
        <CollectionCTA />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
