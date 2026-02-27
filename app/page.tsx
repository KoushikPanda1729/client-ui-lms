"use client";

import Link from "next/link";
import { Button, Input } from "antd";
import {
  PlayCircleOutlined,
  BookOutlined,
  StarFilled,
  SoundOutlined,
  TrophyOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  PhoneOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  MailOutlined,
} from "@ant-design/icons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ═══════════════════════════════════════════════
   HERO — Split layout: big headline left, signup right
   ═══════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/80 via-white to-white pt-24 pb-0 lg:pt-32">
      {/* Top announcement bar */}
      <div className="absolute inset-x-0 top-16 z-10 border-b border-indigo-100 bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white">
        🎉 Over 10,000 learners improved their IELTS band score by 2+ points.{" "}
        <Link href="/courses" className="font-bold text-white underline">
          Learn More →
        </Link>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* LEFT — Headline */}
          <div className="max-w-xl">
            <h1 className="mb-6 text-[46px] leading-[1.08] font-extrabold tracking-tight text-zinc-900 sm:text-[56px] lg:text-[62px]">
              Master English <span className="gradient-text">Speaking</span>
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-zinc-500">
              Practice with native speakers through live audio calls and expert-crafted courses.
              Start free, improve fast.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircleFilled className="text-emerald-500" /> Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircleFilled className="text-emerald-500" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircleFilled className="text-emerald-500" /> 10K+ learners
              </span>
            </div>
          </div>

          {/* RIGHT — Sign Up Card */}
          <div className="mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/50">
              <h3 className="mb-1 text-lg font-bold text-zinc-900">Start learning today</h3>
              <p className="mb-5 text-sm text-zinc-400">Create your free account in seconds</p>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
                  <Input
                    size="large"
                    prefix={<MailOutlined className="text-zinc-400" />}
                    placeholder="you@example.com"
                    className="rounded-xl"
                  />
                </div>
                <Link href="/register" className="block">
                  <Button
                    type="primary"
                    size="large"
                    block
                    className="h-12 rounded-xl text-[15px] font-bold shadow-lg shadow-indigo-500/25"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-100" />
                <span className="text-xs text-zinc-400">Or continue with</span>
                <div className="h-px flex-1 bg-zinc-100" />
              </div>

              <button
                type="button"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   FEATURE CARDS — 4 cards in a row (like Atlassian use-case cards)
   ═══════════════════════════════════════════════ */
function FeatureCards() {
  const cards = [
    {
      tag: "LIVE PRACTICE",
      tagColor: "text-indigo-600 bg-indigo-50",
      title: "Speaking Sessions",
      emoji: "🎧",
      bg: "from-indigo-50 to-violet-50",
      items: ["Random audio matching", "Native speakers worldwide", "No scheduling needed"],
    },
    {
      tag: "STRUCTURED LEARNING",
      tagColor: "text-blue-600 bg-blue-50",
      title: "Expert Courses",
      emoji: "📚",
      bg: "from-blue-50 to-cyan-50",
      items: ["200+ video lessons", "Quizzes & exercises", "Certificates on completion"],
    },
    {
      tag: "EXAM PREPARATION",
      tagColor: "text-rose-600 bg-rose-50",
      title: "IELTS & TOEFL",
      emoji: "🎯",
      bg: "from-rose-50 to-pink-50",
      items: ["Full mock tests", "Band score predictor", "Expert tips & strategies"],
    },
    {
      tag: "DAILY IMPROVEMENT",
      tagColor: "text-amber-600 bg-amber-50",
      title: "Progress Tracking",
      emoji: "📈",
      bg: "from-amber-50 to-orange-50",
      items: ["Streak tracking", "Fluency score", "Weekly reports"],
    },
  ];

  return (
    <section className="bg-zinc-50/50 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Card header */}
              <div className={`flex h-36 items-end bg-gradient-to-br p-5 ${c.bg}`}>
                <span className="text-5xl transition-transform duration-500 group-hover:scale-110">
                  {c.emoji}
                </span>
              </div>
              {/* Card body */}
              <div className="p-5">
                <span
                  className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${c.tagColor}`}
                >
                  {c.tag}
                </span>
                <h3 className="mb-3 text-base font-bold text-zinc-900">{c.title}</h3>
                <ul className="space-y-1.5">
                  {c.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-zinc-500">
                      <CheckCircleFilled className="text-[11px] text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
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
   HOW IT WORKS — Numbered steps (1, 2, 3) like Atlassian
   ═══════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    {
      num: "1",
      color: "text-indigo-600",
      title: "Create your account",
      desc: "Sign up in 30 seconds with Google or email. Completely free.",
      bg: "from-indigo-50 to-violet-50",
      emoji: "🚀",
    },
    {
      num: "2",
      color: "text-violet-600",
      title: "Choose your path",
      desc: "Pick courses, start live speaking practice, or do both.",
      bg: "from-violet-50 to-pink-50",
      emoji: "🎯",
    },
    {
      num: "3",
      color: "text-rose-500",
      title: "Become fluent",
      desc: "Practice daily, track your progress, and earn certificates.",
      bg: "from-rose-50 to-amber-50",
      emoji: "🏆",
    },
  ];

  return (
    <section className="bg-violet-50/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold text-zinc-900 sm:text-4xl">
            Start speaking English in 3 simple steps
          </h2>
          <p className="mx-auto max-w-lg text-base text-zinc-500">
            No complicated setup. Go from zero to your first conversation in minutes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              {/* Card */}
              <div className={`mb-6 rounded-2xl bg-gradient-to-br p-6 ${s.bg}`}>
                <span className="text-5xl">{s.emoji}</span>
              </div>
              {/* Number */}
              <div className={`mb-3 text-4xl font-black ${s.color}`}>{s.num}</div>
              <h3 className="mb-2 text-lg font-bold text-zinc-900">{s.title}</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-zinc-500">{s.desc}</p>
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
   PAGE
   ═══════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <Hero />
        <FeatureCards />
        <SocialProofBanner />
        <FeatureSections />
        <HowItWorks />
        <CollectionCTA />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
