"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Spin, message, Modal } from "antd";
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
  video: <PlayCircleOutlined className="text-indigo-500" />,
  pdf: <FilePdfOutlined className="text-rose-500" />,
  text: <FileTextOutlined className="text-emerald-500" />,
  quiz: <QuestionCircleOutlined className="text-amber-500" />,
};

const LESSON_ACCENT: Record<string, string> = {
  video: "border-l-indigo-500",
  pdf: "border-l-rose-500",
  text: "border-l-emerald-500",
  quiz: "border-l-amber-500",
};

const LEVEL_GRADIENT: Record<string, string> = {
  beginner: "from-emerald-500 to-teal-600",
  intermediate: "from-blue-500 to-indigo-600",
  advanced: "from-rose-500 to-pink-600",
};

const LEVEL_EMOJI: Record<string, string> = {
  beginner: "📚",
  intermediate: "💼",
  advanced: "🎯",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

/* ── Stat card for "What's included" ──────────────── */
function IncludedCard({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-lg">
        {icon}
      </div>
      <div>
        <p className="text-lg leading-none font-bold text-zinc-900">{count}</p>
        <p className="text-[11px] text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────── */
export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
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

  /* ── Handlers (unchanged logic) ── */
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
    const firstLesson = course.lessons[0];
    if (firstLesson) {
      router.push(`/courses/${course.id}/learn?lesson=${firstLesson.id}`);
    }
  };

  const handleLessonClick = async (lessonId: string) => {
    if (!course) return;
    if (enrolled) {
      router.push(`/courses/${course.id}/learn?lesson=${lessonId}`);
      return;
    }
    if (isPremium) {
      messageApi.info("Purchase this course to access lessons");
      return;
    }
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
        return;
      }
    }
    router.push(`/courses/${course.id}/learn?lesson=${lessonId}`);
    setEnrolling(false);
  };

  /* ── Loading / Error states ── */
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
        <Link href="/courses">
          <Button icon={<ArrowLeftOutlined />}>Back to Courses</Button>
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

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-zinc-50/50">
      {contextHolder}

      {/* ═══════ IMMERSIVE HERO ═══════ */}
      <div className="relative overflow-hidden">
        {/* Background */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`}>
            <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-12 translate-y-12 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8 pb-12">
          {/* Back link */}
          <Link
            href="/courses"
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 no-underline backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
          >
            <ArrowLeftOutlined className="text-xs" /> Back to Courses
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {course.level && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white capitalize backdrop-blur-sm">
                    {course.level}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-sm ${
                    isPremium ? "bg-amber-500/80" : "bg-emerald-500/80"
                  }`}
                >
                  {isPremium ? (
                    <>
                      <LockOutlined className="mr-1 text-[10px]" /> Premium
                    </>
                  ) : (
                    "Free"
                  )}
                </span>
                {enrolled && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <CheckCircleFilled className="text-[10px]" /> Enrolled
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-3 text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-[2.75rem]">
                {course.title}
              </h1>

              {/* Description */}
              <p className="mb-5 max-w-xl text-base leading-relaxed text-white/70">
                {course.description ?? "No description provided."}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
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
                    {LESSON_ICON[type]} {count} {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero emoji for no-thumbnail */}
            {!course.thumbnailUrl && (
              <span className="hidden text-8xl drop-shadow-2xl lg:block">
                {LEVEL_EMOJI[course.level ?? ""] ?? "📖"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* ── Left column ── */}
          <div className="lg:col-span-2">
            {/* Progress (enrolled) */}
            {enrolled && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                <div className="flex flex-col items-center gap-1 px-6 pt-8 pb-6 sm:flex-row sm:gap-8">
                  {/* Custom semi-circle gauge */}
                  <div className="relative flex shrink-0 flex-col items-center">
                    <svg width="120" height="70" viewBox="0 0 120 70">
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                      </defs>
                      {/* Trail */}
                      <path
                        d="M 10 65 A 50 50 0 0 1 110 65"
                        fill="none"
                        stroke="#e0e7ff"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Progress arc */}
                      <path
                        d="M 10 65 A 50 50 0 0 1 110 65"
                        fill="none"
                        stroke="url(#gaugeGrad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 157} 157`}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute bottom-0 text-2xl font-extrabold text-indigo-600">
                      {progress}%
                    </span>
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="mb-1 text-base font-bold text-indigo-800">
                      {progress === 100 ? "🎉 Course Complete!" : "Your Progress"}
                    </h3>
                    <p className="text-sm text-indigo-500">
                      {completedLessons} of {course.totalLessons} lessons completed
                    </p>
                    {progress > 0 && progress < 100 && (
                      <p className="mt-1 text-xs text-indigo-400">
                        {course.totalLessons - completedLessons} more to go — keep it up!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* What's included */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-bold text-zinc-900">What&apos;s Included</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <IncludedCard
                  icon={<BookOutlined className="text-indigo-500" />}
                  count={course.totalLessons}
                  label="Total Lessons"
                />
                {lessonTypeCounts.video && (
                  <IncludedCard
                    icon={<VideoCameraOutlined className="text-indigo-500" />}
                    count={lessonTypeCounts.video}
                    label="Videos"
                  />
                )}
                {lessonTypeCounts.quiz && (
                  <IncludedCard
                    icon={<QuestionCircleOutlined className="text-amber-500" />}
                    count={lessonTypeCounts.quiz}
                    label="Quizzes"
                  />
                )}
                {lessonTypeCounts.pdf && (
                  <IncludedCard
                    icon={<FilePdfOutlined className="text-rose-500" />}
                    count={lessonTypeCounts.pdf}
                    label="PDF Resources"
                  />
                )}
                {lessonTypeCounts.text && (
                  <IncludedCard
                    icon={<FileTextOutlined className="text-emerald-500" />}
                    count={lessonTypeCounts.text}
                    label="Reading Material"
                  />
                )}
              </div>
            </div>

            {/* Curriculum */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">Curriculum</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {course.totalLessons} lesson{course.totalLessons !== 1 ? "s" : ""}
                </span>
              </div>

              {course.lessons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
                  No lessons added yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {course.lessons
                    .sort((a, b) => a.order - b.order)
                    .map((lesson: Lesson, index: number) => {
                      const isLocked = isPremium && !enrolled;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson.id)}
                          className={`group flex cursor-pointer items-center gap-4 rounded-xl border border-l-[3px] bg-white px-4 py-3.5 transition-all duration-200 ${
                            LESSON_ACCENT[lesson.type] ?? "border-l-zinc-300"
                          } ${
                            lesson.completed
                              ? "border-y-emerald-100 border-r-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60"
                              : isLocked
                                ? "cursor-not-allowed border-y-zinc-100 border-r-zinc-100 opacity-50"
                                : "border-y-zinc-100 border-r-zinc-100 hover:-translate-x-0.5 hover:border-y-indigo-100 hover:border-r-indigo-100 hover:bg-indigo-50/30 hover:shadow-sm"
                          }`}
                        >
                          {/* Number / check */}
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              lesson.completed
                                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                                : "bg-zinc-100 text-zinc-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                            }`}
                          >
                            {lesson.completed ? <CheckOutlined /> : index + 1}
                          </span>

                          {/* Type icon */}
                          <span className="text-base">{LESSON_ICON[lesson.type]}</span>

                          {/* Title */}
                          <span
                            className={`flex-1 text-sm font-medium transition-colors ${
                              lesson.completed
                                ? "text-emerald-700"
                                : "text-zinc-800 group-hover:text-indigo-700"
                            }`}
                          >
                            {lesson.title}
                          </span>

                          {/* Duration */}
                          {lesson.durationMinutes && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <ClockCircleOutlined /> {lesson.durationMinutes}m
                            </span>
                          )}

                          {/* Lock / type label */}
                          {isLocked ? (
                            <LockOutlined className="text-xs text-zinc-400" />
                          ) : (
                            <span className="hidden rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-400 capitalize sm:inline">
                              {lesson.type}
                            </span>
                          )}

                          {/* Hover arrow */}
                          {!isLocked && (
                            <ArrowRightOutlined className="text-xs text-zinc-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-500 group-hover:opacity-100" />
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <div>
            <div className="sticky top-20 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lg shadow-black/5">
              {/* Price header */}
              <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 p-6">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-600">
                    {isPremium
                      ? appliedCoupon
                        ? formatPrice(appliedCoupon.finalPrice)
                        : priceLabel
                      : "Free"}
                  </span>
                  {appliedCoupon && (
                    <span className="text-base font-medium text-zinc-400 line-through">
                      {priceLabel}
                    </span>
                  )}
                </div>
                {isPremium && !appliedCoupon && (
                  <p className="text-xs text-zinc-400">One-time purchase · Lifetime access</p>
                )}
                {appliedCoupon && (
                  <p className="text-xs font-semibold text-emerald-600">
                    You save ₹{appliedCoupon.discountAmount} ({appliedCoupon.discountPercent}% off)
                  </p>
                )}
              </div>

              <div className="p-6">
                {/* Coupon section */}
                {isPremium && !enrolled && (
                  <div className="mb-5">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <TagOutlined className="text-sm text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-emerald-700">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-[10px] text-emerald-600">Coupon applied</p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 transition hover:bg-emerald-200"
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleApplyCoupon();
                            }}
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
                        {couponError && (
                          <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
                        )}
                        <button
                          onClick={handleOpenCoupons}
                          className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                        >
                          See available coupons
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                      No coupons available for this course right now.
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
                {enrolled ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    block
                    onClick={handleStartLearning}
                    className="mb-4 h-12 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      border: "none",
                    }}
                  >
                    {progress > 0 ? "Continue Learning" : "Start Learning"}
                  </Button>
                ) : isPremium ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<LockOutlined />}
                    block
                    loading={enrolling}
                    onClick={handleBuyCourse}
                    className="mb-4 h-12 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      border: "none",
                    }}
                  >
                    Buy Course —{" "}
                    {appliedCoupon ? formatPrice(appliedCoupon.finalPrice) : priceLabel}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    block
                    loading={enrolling}
                    onClick={handleEnroll}
                    className="mb-4 h-12 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      border: "none",
                    }}
                  >
                    Enroll for Free
                  </Button>
                )}

                {/* Course stats */}
                <div className="space-y-3 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs">
                        <BookOutlined className="text-indigo-500" />
                      </span>
                      Lessons
                    </span>
                    <span className="font-semibold text-zinc-900">{course.totalLessons}</span>
                  </div>
                  {course.level && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-xs">
                          <TrophyOutlined className="text-amber-500" />
                        </span>
                        Level
                      </span>
                      <span className="font-semibold text-zinc-900 capitalize">{course.level}</span>
                    </div>
                  )}
                  {Object.entries(lessonTypeCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 capitalize">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-50 text-xs">
                          {LESSON_ICON[type]}
                        </span>
                        {type}s
                      </span>
                      <span className="font-semibold text-zinc-900">{count}</span>
                    </div>
                  ))}
                  {enrolled && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs">
                          <CheckCircleFilled className="text-emerald-500" />
                        </span>
                        Completed
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {completedLessons} / {course.totalLessons}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
