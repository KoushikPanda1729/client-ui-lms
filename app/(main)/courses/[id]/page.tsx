"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Tag, Divider, Progress, Spin, message, Modal } from "antd";
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
} from "@ant-design/icons";
import { courseService, CourseDetail, Lesson } from "@/lib/services/course";

const LESSON_ICON: Record<string, React.ReactNode> = {
  video: <PlayCircleOutlined className="text-indigo-500" />,
  pdf: <FilePdfOutlined className="text-rose-500" />,
  text: <FileTextOutlined className="text-emerald-500" />,
  quiz: <QuestionCircleOutlined className="text-amber-500" />,
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "green",
  intermediate: "blue",
  advanced: "red",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

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
    if (availableCoupons.length > 0) return; // already loaded
    setLoadingCoupons(true);
    try {
      const data = await courseService.getAvailableCoupons(course.id);
      setAvailableCoupons(data);
    } catch {
      // silently ignore — modal will show empty state
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
      // Refetch to get updated enrollment status
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
    // Free course: auto-enroll then navigate
    setEnrolling(true);
    try {
      await courseService.enroll(course.id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 409 = already enrolled — fine, just navigate
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

  const enrolled = !!course.enrollment;
  const progress = course.enrollment?.progressPercent ?? 0;
  const completedLessons = course.enrollment?.completedLessons ?? 0;
  const priceLabel = formatPrice(course.price);
  const isPremium = course.isPremium && course.price > 0;

  // Group lessons by type for the "what's included" summary
  const lessonTypeCounts = course.lessons.reduce(
    (acc, l) => {
      acc[l.type] = (acc[l.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="py-10">
      {contextHolder}
      <div className="mx-auto max-w-6xl px-6">
        {/* Back link */}
        <Link
          href="/courses"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 no-underline hover:text-zinc-900"
        >
          <ArrowLeftOutlined /> Back to Courses
        </Link>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* ── Left: Course info ── */}
          <div className="lg:col-span-2">
            {/* Hero */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-indigo-50 to-violet-50">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <span className="text-7xl">
                    {course.level === "beginner"
                      ? "📚"
                      : course.level === "intermediate"
                        ? "💼"
                        : course.level === "advanced"
                          ? "🎯"
                          : "📖"}
                  </span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {course.level && (
                <Tag
                  color={LEVEL_COLOR[course.level] ?? "default"}
                  className="rounded-full border-0 text-xs capitalize"
                >
                  {course.level}
                </Tag>
              )}
              {course.isPremium ? (
                <Tag color="gold" className="rounded-full border-0 text-xs">
                  <LockOutlined className="mr-1" />
                  Premium
                </Tag>
              ) : (
                <Tag color="green" className="rounded-full border-0 text-xs">
                  Free
                </Tag>
              )}
              {enrolled && (
                <Tag color="purple" className="rounded-full border-0 text-xs">
                  <CheckCircleFilled className="mr-1" />
                  Enrolled
                </Tag>
              )}
            </div>

            <h1 className="mb-3 text-3xl font-bold text-zinc-900">{course.title}</h1>
            <p className="mb-6 text-base leading-relaxed text-zinc-500">
              {course.description ?? "No description provided."}
            </p>

            {/* Meta stats */}
            <div className="mb-8 flex flex-wrap items-center gap-5 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <BookOutlined /> {course.totalLessons} lessons
              </span>
              {Object.entries(lessonTypeCounts).map(([type, count]) => (
                <span key={type} className="flex items-center gap-1.5 capitalize">
                  {LESSON_ICON[type]} {count} {type}
                </span>
              ))}
            </div>

            {/* Progress (if enrolled) */}
            {enrolled && (
              <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-700">Your Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{progress}%</span>
                </div>
                <Progress
                  percent={progress}
                  showInfo={false}
                  strokeColor="#6366f1"
                  trailColor="#e0e7ff"
                />
                <p className="mt-2 text-xs text-indigo-400">
                  {completedLessons} of {course.totalLessons} lessons completed
                </p>
              </div>
            )}

            {/* Curriculum */}
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Curriculum</h2>
            <div className="space-y-2">
              {course.lessons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
                  No lessons added yet.
                </div>
              ) : (
                course.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson: Lesson, index: number) => (
                    <div
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                        lesson.completed
                          ? "border-emerald-100 bg-emerald-50/50 hover:border-emerald-200"
                          : isPremium && !enrolled
                            ? "cursor-not-allowed border-zinc-100 bg-white opacity-60"
                            : "border-zinc-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}
                    >
                      {/* Completion indicator */}
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          lesson.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {lesson.completed ? <CheckOutlined /> : index + 1}
                      </span>

                      {/* Type icon */}
                      <span>{LESSON_ICON[lesson.type]}</span>

                      {/* Title */}
                      <span
                        className={`flex-1 font-medium ${lesson.completed ? "text-emerald-700" : "text-zinc-800"}`}
                      >
                        {lesson.title}
                      </span>

                      {/* Duration */}
                      {lesson.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <ClockCircleOutlined /> {lesson.durationMinutes}m
                        </span>
                      )}

                      {/* Lesson type badge / lock */}
                      {isPremium && !enrolled ? (
                        <LockOutlined className="text-xs text-zinc-400" />
                      ) : (
                        <span className="hidden rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-400 capitalize sm:inline">
                          {lesson.type}
                        </span>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <div>
            <div className="sticky top-20 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-lg shadow-black/5">
              {/* Price */}
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-600">
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
                <p className="mb-4 text-xs text-zinc-400">One-time purchase · Lifetime access</p>
              )}
              {appliedCoupon && (
                <p className="mb-4 text-xs font-semibold text-emerald-600">
                  You save ₹{appliedCoupon.discountAmount} ({appliedCoupon.discountPercent}% off)
                </p>
              )}

              {/* Coupon section — only for unenrolled premium courses */}
              {isPremium && !enrolled && (
                <div className="mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <TagOutlined className="text-sm text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</p>
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
                          placeholder="Have a coupon code?"
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
              )}

              {/* Available coupons modal */}
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
                  className="mb-3 h-11 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
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
                  className="mb-3 h-11 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    border: "none",
                  }}
                >
                  Buy Course — {appliedCoupon ? formatPrice(appliedCoupon.finalPrice) : priceLabel}
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  block
                  loading={enrolling}
                  onClick={handleEnroll}
                  className="mb-3 h-11 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    border: "none",
                  }}
                >
                  Enroll for Free
                </Button>
              )}

              {enrolled && progress > 0 && (
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-semibold text-indigo-600">{progress}%</span>
                  </div>
                  <Progress
                    percent={progress}
                    showInfo={false}
                    size="small"
                    strokeColor="#6366f1"
                    trailColor="#f1f5f9"
                  />
                </div>
              )}

              <Divider className="my-4" />

              {/* Course stats */}
              <div className="space-y-3 text-sm text-zinc-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOutlined /> Lessons
                  </span>
                  <span className="font-medium text-zinc-900">{course.totalLessons}</span>
                </div>
                {course.level && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrophyOutlined /> Level
                    </span>
                    <span className="font-medium text-zinc-900 capitalize">{course.level}</span>
                  </div>
                )}
                {Object.entries(lessonTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize">
                      {LESSON_ICON[type]} {type}s
                    </span>
                    <span className="font-medium text-zinc-900">{count}</span>
                  </div>
                ))}
                {enrolled && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircleFilled className="text-emerald-500" /> Completed
                    </span>
                    <span className="font-medium text-zinc-900">
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
  );
}
