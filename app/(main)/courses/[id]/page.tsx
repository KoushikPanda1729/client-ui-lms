"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spin, message, Modal } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  TrophyOutlined,
  CheckOutlined,
  TagOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { courseService, CourseDetail, Lesson } from "@/lib/services/course";

/* ── Constants ────────────────────────────────────── */
const LESSON_ICON: Record<string, React.ReactNode> = {
  video: <PlayCircleOutlined />,
  pdf: <FilePdfOutlined />,
  text: <FileTextOutlined />,
  quiz: <QuestionCircleOutlined />,
};

const LESSON_COLOR: Record<string, string> = {
  video: "text-indigo-500 bg-indigo-50",
  pdf: "text-rose-500 bg-rose-50",
  text: "text-emerald-500 bg-emerald-50",
  quiz: "text-amber-500 bg-amber-50",
};

const LESSON_BORDER: Record<string, string> = {
  video: "border-l-indigo-400",
  pdf: "border-l-rose-400",
  text: "border-l-emerald-400",
  quiz: "border-l-amber-400",
};

const LEVEL_GRADIENT: Record<string, string> = {
  beginner: "from-emerald-500 to-teal-600",
  intermediate: "from-blue-500 to-indigo-600",
  advanced: "from-rose-500 to-pink-600",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

/* ── Circular progress SVG ── */
function CircleProgress({ percent, size = 64 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e7ff" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#pg)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Main Page ────────────────────────────────────── */
export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [navigatingLessonId, setNavigatingLessonId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponsModalOpen, setCouponsModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<
    { code: string; discountPercent: number; expiresAt: string | null }[]
  >([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalPrice: number;
    priceToken: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCourse = useCallback(async () => {
    try {
      const data = await courseService.getCourse(id);
      setCourse(data);
    } catch {
      messageApi.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id, messageApi]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleApplyCoupon = async () => {
    if (!course || !couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const quote = await courseService.getPriceQuote(course.id, couponCode.trim());
      if (!quote.discountPercent) {
        setCouponError("This coupon doesn't apply to this course");
        return;
      }
      setAppliedCoupon({
        code: couponCode.trim().toUpperCase(),
        discountPercent: quote.discountPercent,
        discountAmount: quote.discountAmount,
        finalPrice: quote.price,
        priceToken: quote.priceToken,
      });
      setCouponCode("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid or expired coupon code";
      setCouponError(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleOpenCoupons = async () => {
    if (!course) return;
    setCouponsModalOpen(true);
    if (availableCoupons.length > 0) return;
    setLoadingCoupons(true);
    try {
      const data = await courseService.getAvailableCoupons(course.id);
      setAvailableCoupons(data);
    } catch {
      /* silently ignore */
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleUseCoupon = (code: string) => {
    setCouponCode(code);
    setCouponError(null);
    setCouponsModalOpen(false);
  };

  const handleBuyCourse = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      let priceToken: string;
      if (appliedCoupon) {
        priceToken = appliedCoupon.priceToken;
      } else {
        const quote = await courseService.getPriceQuote(course.id);
        priceToken = quote.priceToken;
      }
      const { checkoutUrl } = await courseService.createCheckout(course.id, priceToken);
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to start checkout";
      messageApi.error(msg);
      setEnrolling(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      await courseService.enroll(course.id);
      messageApi.success("Enrolled successfully!");
      const updated = await courseService.getCourse(id);
      setCourse(updated);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to enroll";
      messageApi.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!course) return;
    const sorted = [...course.lessons].sort((a, b) => a.order - b.order);
    // find first incomplete lesson, else first lesson
    const next = sorted.find((l) => !l.completed) ?? sorted[0];
    if (next) router.push(`/courses/${course.id}/learn?lesson=${next.id}`);
  };

  const handleLessonClick = async (lessonId: string) => {
    if (!course) return;
    if (navigatingLessonId) return; // prevent double-tap
    if (enrolled) {
      setNavigatingLessonId(lessonId);
      router.push(`/courses/${course.id}/learn?lesson=${lessonId}`);
      return;
    }
    if (isPremium) {
      messageApi.info("Purchase this course to access lessons");
      return;
    }
    setNavigatingLessonId(lessonId);
    setEnrolling(true);
    try {
      await courseService.enroll(course.id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 409) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to enroll";
        messageApi.error(msg);
        setEnrolling(false);
        setNavigatingLessonId(null);
        return;
      }
    }
    router.push(`/courses/${course.id}/learn?lesson=${lessonId}`);
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Course not found.</p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <ArrowLeftOutlined /> Back to Courses
        </Link>
      </div>
    );
  }

  /* ── Derived state ── */
  const enrolled = !!course.enrollment;
  const progress = course.enrollment?.progressPercent ?? 0;
  const completedLessons = course.enrollment?.completedLessons ?? 0;
  const priceLabel = formatPrice(course.price);
  const isPremium = course.isPremium && course.price > 0;
  const heroGradient = course.level
    ? (LEVEL_GRADIENT[course.level] ?? "from-indigo-500 to-violet-600")
    : "from-indigo-500 to-violet-600";

  const lessonTypeCounts = course.lessons.reduce(
    (acc, l) => {
      acc[l.type] = (acc[l.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

  /* ── Coupon section (shared between mobile & desktop) ── */
  const couponSection = isPremium && !enrolled && (
    <div className="mb-5">
      {appliedCoupon ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <TagOutlined className="text-sm text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</p>
              <p className="text-[10px] text-emerald-600">
                {appliedCoupon.discountPercent}% off applied
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 transition hover:bg-emerald-200"
          >
            <CloseOutlined style={{ fontSize: 9 }} />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              placeholder="Coupon code"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || applyingCoupon}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {applyingCoupon ? "..." : "Apply"}
            </button>
          </div>
          {couponError && <p className="mt-1.5 text-xs text-red-500">{couponError}</p>}
          <button
            onClick={handleOpenCoupons}
            className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
          >
            See available coupons
          </button>
        </div>
      )}
    </div>
  );

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-zinc-50">
      {contextHolder}

      {/* ═══════ HERO ═══════ */}
      <div className="relative overflow-hidden">
        {course.thumbnailUrl ? (
          <>
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`}>
            <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 translate-x-20 -translate-y-20 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 -translate-x-16 translate-y-16 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-6 sm:pt-8 sm:pb-14">
          {/* Back */}
          <Link
            href="/courses"
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 no-underline backdrop-blur-sm transition hover:bg-white/20 hover:text-white sm:mb-7"
          >
            <ArrowLeftOutlined className="text-xs" /> Back to Courses
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {course.level && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white capitalize backdrop-blur-sm">
                    {course.level}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm ${
                    isPremium ? "bg-amber-500/90" : "bg-emerald-500/90"
                  }`}
                >
                  {isPremium ? (
                    <span className="flex items-center gap-1">
                      <LockOutlined className="text-[10px]" /> Premium
                    </span>
                  ) : (
                    "Free"
                  )}
                </span>
                {enrolled && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <CheckCircleFilled className="text-[10px]" /> Enrolled
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-3 text-[1.6rem] leading-tight font-bold text-white sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>

              {/* Description */}
              <p className="mb-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:line-clamp-none sm:text-base">
                {course.description ?? "No description provided."}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/60 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <BookOutlined /> {course.totalLessons} lessons
                </span>
                {course.level && (
                  <span className="flex items-center gap-1.5 capitalize">
                    <TrophyOutlined /> {course.level}
                  </span>
                )}
                {Object.entries(lessonTypeCounts).map(([type, count]) => (
                  <span key={type} className="flex items-center gap-1.5 capitalize">
                    <span className="text-xs">{LESSON_ICON[type]}</span>
                    {count} {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ MOBILE STICKY CTA ═══════ */}
      <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-zinc-100 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          {!enrolled && isPremium && (
            <div className="shrink-0">
              <p className="text-lg leading-none font-extrabold text-indigo-600">
                {appliedCoupon ? formatPrice(appliedCoupon.finalPrice) : priceLabel}
              </p>
              {appliedCoupon && (
                <p className="text-[10px] font-semibold text-emerald-600">
                  {appliedCoupon.discountPercent}% off
                </p>
              )}
            </div>
          )}
          {enrolled ? (
            <button
              onClick={handleStartLearning}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30 active:scale-[.98]"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              <PlayCircleOutlined />
              {progress > 0 && progress < 100
                ? "Continue Learning"
                : progress === 100
                  ? "Review Course"
                  : "Start Learning"}
            </button>
          ) : isPremium ? (
            <button
              disabled={enrolling}
              onClick={handleBuyCourse}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30 active:scale-[.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              <LockOutlined />
              {enrolling
                ? "Loading…"
                : `Buy — ${appliedCoupon ? formatPrice(appliedCoupon.finalPrice) : priceLabel}`}
            </button>
          ) : (
            <button
              disabled={enrolling}
              onClick={handleEnroll}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/30 active:scale-[.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              <PlayCircleOutlined />
              {enrolling ? "Enrolling…" : "Enroll for Free"}
            </button>
          )}
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-10 lg:py-10 lg:pb-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* ── Left column ── */}
          <div className="min-w-0">
            {/* ── Progress card (enrolled, mobile only — desktop shows it in sidebar) ── */}
            {enrolled && (
              <div className="mb-7 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm lg:hidden">
                <div className="flex items-center gap-5 px-5 py-4 sm:gap-6 sm:px-6 sm:py-5">
                  {/* Circle progress */}
                  <div className="relative shrink-0">
                    <CircleProgress percent={progress} size={68} />
                    <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-indigo-700">
                      {progress}%
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-base font-bold text-indigo-900">
                      {progress === 100 ? "🎉 Course Complete!" : "Your Progress"}
                    </p>
                    <p className="text-sm text-indigo-500">
                      {completedLessons} of {course.totalLessons} lessons completed
                    </p>
                    {progress > 0 && progress < 100 && (
                      <p className="mt-1 text-xs text-indigo-400">
                        {course.totalLessons - completedLessons} lesson
                        {course.totalLessons - completedLessons !== 1 ? "s" : ""} left — keep going!
                      </p>
                    )}
                  </div>

                  {/* Desktop: mini CTA inside card */}
                  <button
                    onClick={handleStartLearning}
                    className="hidden shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition active:scale-95 sm:flex"
                    style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
                  >
                    <PlayCircleOutlined />
                    {progress === 0 ? "Start" : progress === 100 ? "Review" : "Continue"}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-indigo-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* ── What's Included ── */}
            <div className="mb-8">
              <h2 className="mb-3 text-base font-bold text-zinc-900 sm:text-lg">
                What&apos;s Included
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  {
                    icon: <BookOutlined />,
                    color: "bg-indigo-50 text-indigo-500",
                    count: course.totalLessons,
                    label: "Lessons",
                  },
                  lessonTypeCounts.video && {
                    icon: <VideoCameraOutlined />,
                    color: "bg-indigo-50 text-indigo-500",
                    count: lessonTypeCounts.video,
                    label: "Videos",
                  },
                  lessonTypeCounts.quiz && {
                    icon: <QuestionCircleOutlined />,
                    color: "bg-amber-50 text-amber-500",
                    count: lessonTypeCounts.quiz,
                    label: "Quizzes",
                  },
                  lessonTypeCounts.pdf && {
                    icon: <FilePdfOutlined />,
                    color: "bg-rose-50 text-rose-500",
                    count: lessonTypeCounts.pdf,
                    label: "PDFs",
                  },
                  lessonTypeCounts.text && {
                    icon: <FileTextOutlined />,
                    color: "bg-emerald-50 text-emerald-500",
                    count: lessonTypeCounts.text,
                    label: "Reading",
                  },
                ]
                  .filter(Boolean)
                  .map((item, i) => {
                    if (!item) return null;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${item.color}`}
                        >
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-xl leading-none font-extrabold text-zinc-900">
                            {item.count}
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-400">{item.label}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* ── Mobile coupon (non-enrolled premium) ── */}
            {isPremium && !enrolled && (
              <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm lg:hidden">
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Have a coupon?</h3>
                {couponSection}
              </div>
            )}

            {/* ── Curriculum ── */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-zinc-900 sm:text-lg">Curriculum</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {course.totalLessons} lesson{course.totalLessons !== 1 ? "s" : ""}
                </span>
              </div>

              {sortedLessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
                  No lessons added yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                  {sortedLessons.map((lesson: Lesson, index: number) => {
                    const isLocked = isPremium && !enrolled;
                    const isCompleted = lesson.completed;
                    const isNavigating = navigatingLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson.id)}
                        className={`group flex cursor-pointer items-center gap-3.5 border-b border-l-[3px] border-zinc-50 px-4 py-3.5 transition-all duration-150 last:border-b-0 sm:gap-4 ${
                          LESSON_BORDER[lesson.type] ?? "border-l-zinc-200"
                        } ${
                          isNavigating
                            ? "bg-indigo-50/70"
                            : isCompleted
                              ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                              : isLocked
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-indigo-50/50"
                        }`}
                      >
                        {/* Step number / check / spinner */}
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            isNavigating
                              ? "bg-indigo-100 text-indigo-500"
                              : isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-100 text-zinc-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                          }`}
                        >
                          {isNavigating ? (
                            <Spin
                              size="small"
                              indicator={
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                              }
                            />
                          ) : isCompleted ? (
                            <CheckOutlined />
                          ) : (
                            index + 1
                          )}
                        </span>

                        {/* Type icon */}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                            LESSON_COLOR[lesson.type] ?? "bg-zinc-50 text-zinc-400"
                          }`}
                        >
                          {LESSON_ICON[lesson.type]}
                        </span>

                        {/* Title + meta */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-medium ${
                              isNavigating
                                ? "text-indigo-700"
                                : isCompleted
                                  ? "text-emerald-700"
                                  : "text-zinc-800 group-hover:text-indigo-700"
                            }`}
                          >
                            {lesson.title}
                          </p>
                          {lesson.durationMinutes && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                              <ClockCircleOutlined style={{ fontSize: 10 }} />
                              {lesson.durationMinutes} min
                            </p>
                          )}
                        </div>

                        {/* Right side */}
                        {isNavigating ? (
                          <span className="shrink-0 text-xs text-indigo-400">Opening…</span>
                        ) : isLocked ? (
                          <LockOutlined className="shrink-0 text-xs text-zinc-400" />
                        ) : isCompleted ? (
                          <CheckCircleFilled className="shrink-0 text-sm text-emerald-500" />
                        ) : (
                          <ArrowRightOutlined className="shrink-0 text-xs text-zinc-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500 group-hover:opacity-100" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar (desktop only) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-black/5">
              {/* Enrolled header */}
              {enrolled && (
                <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <CircleProgress percent={progress} size={52} />
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-indigo-700">
                        {progress}%
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-800">
                        {progress === 100 ? "🎉 Completed!" : "In Progress"}
                      </p>
                      <p className="text-xs text-indigo-500">
                        {completedLessons}/{course.totalLessons} lessons
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Price header (not enrolled) */}
              {!enrolled && (
                <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-indigo-600">
                      {isPremium
                        ? appliedCoupon
                          ? formatPrice(appliedCoupon.finalPrice)
                          : priceLabel
                        : "Free"}
                    </span>
                    {appliedCoupon && (
                      <span className="text-sm font-medium text-zinc-400 line-through">
                        {priceLabel}
                      </span>
                    )}
                  </div>
                  {isPremium && !appliedCoupon && (
                    <p className="mt-0.5 text-xs text-zinc-400">One-time · Lifetime access</p>
                  )}
                  {appliedCoupon && (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                      You save ₹{appliedCoupon.discountAmount} ({appliedCoupon.discountPercent}%
                      off)
                    </p>
                  )}
                </div>
              )}

              <div className="p-5">
                {/* Coupon (desktop, not enrolled) */}
                {couponSection}

                {/* Coupons modal */}
                <Modal
                  title={
                    <span className="flex items-center gap-2 font-semibold text-zinc-900">
                      <TagOutlined className="text-indigo-500" /> Available Coupons
                    </span>
                  }
                  open={couponsModalOpen}
                  onCancel={() => setCouponsModalOpen(false)}
                  footer={null}
                  width={420}
                >
                  {loadingCoupons ? (
                    <div className="flex justify-center py-8">
                      <Spin />
                    </div>
                  ) : availableCoupons.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-400">
                      No coupons available right now.
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      {availableCoupons.map((c) => (
                        <div
                          key={c.code}
                          className="flex items-center justify-between rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold tracking-widest text-indigo-700">
                                {c.code}
                              </span>
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                                {c.discountPercent}% OFF
                              </span>
                            </div>
                            {c.expiresAt && (
                              <p className="mt-0.5 text-[10px] text-zinc-400">
                                Expires{" "}
                                {new Date(c.expiresAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUseCoupon(c.code)}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Modal>

                {/* Action button */}
                <button
                  disabled={enrolling}
                  onClick={
                    enrolled ? handleStartLearning : isPremium ? handleBuyCourse : handleEnroll
                  }
                  className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition active:scale-[.98] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
                >
                  {enrolled ? (
                    <>
                      <PlayCircleOutlined />
                      {progress === 0
                        ? "Start Learning"
                        : progress === 100
                          ? "Review Course"
                          : "Continue Learning"}
                    </>
                  ) : isPremium ? (
                    <>
                      <LockOutlined />
                      {enrolling
                        ? "Loading…"
                        : `Buy — ${appliedCoupon ? formatPrice(appliedCoupon.finalPrice) : priceLabel}`}
                    </>
                  ) : (
                    <>
                      <PlayCircleOutlined />
                      {enrolling ? "Enrolling…" : "Enroll for Free"}
                    </>
                  )}
                </button>

                {/* Course stats */}
                <div className="space-y-2.5 border-t border-zinc-100 pt-4">
                  {[
                    {
                      icon: <BookOutlined className="text-indigo-500" />,
                      bg: "bg-indigo-50",
                      label: "Lessons",
                      value: course.totalLessons,
                    },
                    course.level && {
                      icon: <TrophyOutlined className="text-amber-500" />,
                      bg: "bg-amber-50",
                      label: "Level",
                      value: course.level,
                      capitalize: true,
                    },
                    ...Object.entries(lessonTypeCounts).map(([type, count]) => ({
                      icon: (
                        <span
                          className={`text-xs ${LESSON_COLOR[type]?.split(" ")[1] ?? "text-zinc-400"}`}
                        >
                          {LESSON_ICON[type]}
                        </span>
                      ),
                      bg: LESSON_COLOR[type]?.split(" ")[0] ?? "bg-zinc-50",
                      label: type.charAt(0).toUpperCase() + type.slice(1) + "s",
                      value: count,
                    })),
                    enrolled && {
                      icon: <CheckCircleFilled className="text-emerald-500" />,
                      bg: "bg-emerald-50",
                      label: "Completed",
                      value: `${completedLessons}/${course.totalLessons}`,
                    },
                  ]
                    .filter(Boolean)
                    .map((item, i) => {
                      if (!item) return null;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-zinc-600">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${item.bg}`}
                            >
                              {item.icon}
                            </span>
                            {item.label}
                          </span>
                          <span
                            className={`font-semibold text-zinc-900 ${"capitalize" in item && item.capitalize ? "capitalize" : ""}`}
                          >
                            {item.value}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
