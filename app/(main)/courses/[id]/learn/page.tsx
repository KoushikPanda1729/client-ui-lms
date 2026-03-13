"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Hls from "hls.js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spin, Progress, message, Radio, Checkbox, Tag, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { courseService, CourseDetail, Lesson, Quiz, QuizResult } from "@/lib/services/course";

// ─── Lesson type icon helper ──────────────────────────────────────────────────
const LESSON_ICON: Record<string, React.ReactNode> = {
  video: <PlayCircleOutlined />,
  pdf: <FilePdfOutlined />,
  text: <FileTextOutlined />,
  quiz: <QuestionCircleOutlined />,
};

// ─── Text Lesson ──────────────────────────────────────────────────────────────
function TextLesson({ content }: { content: string | null }) {
  return (
    <div className="prose prose-zinc max-w-none">
      {content ? (
        <div
          className="leading-relaxed text-zinc-700"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-zinc-400 italic">No content available for this lesson.</p>
      )}
    </div>
  );
}

// ─── Video Lesson ─────────────────────────────────────────────────────────────
function VideoLesson({ videoUrl }: { videoUrl: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const isHls = !!videoUrl && videoUrl.endsWith("/stream");
  const isYoutube =
    !!videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"));
  const isVimeo = !!videoUrl && videoUrl.includes("vimeo.com");

  useEffect(() => {
    if (!isHls || !videoRef.current || !videoUrl) return;

    const video = videoRef.current;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5503";

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, url) => {
          // Send cookies only for our API (manifest), not CloudFront (segments)
          if (url.startsWith(apiBase)) {
            xhr.withCredentials = true;
          }
        },
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = videoUrl;
    }
  }, [videoUrl, isHls]);

  if (!videoUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
        No video available
      </div>
    );
  }

  if (isYoutube || isVimeo) {
    const embedUrl = isYoutube
      ? videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")
      : videoUrl.replace("vimeo.com/", "player.vimeo.com/video/");
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black">
        <iframe
          src={embedUrl}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // HLS stream or direct video — both use <video>
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black">
      <video
        ref={videoRef}
        {...(!isHls && { src: videoUrl })}
        controls
        className="aspect-video w-full"
        controlsList="nodownload"
      />
    </div>
  );
}

// ─── PDF Lesson ───────────────────────────────────────────────────────────────
function PdfLesson({ pdfUrl }: { pdfUrl: string | null }) {
  if (!pdfUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
        No PDF available
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <iframe src={`${pdfUrl}#view=fitH`} className="h-[70vh] w-full" title="PDF Lesson" />
    </div>
  );
}

// ── Quiz Lesson ──────────────────────────────────────────────────────────────
function QuizLesson({
  courseId,
  lessonId,
  onPass,
}: {
  courseId: string;
  lessonId: string;
  onPass: () => void;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showingBest, setShowingBest] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    (async () => {
      try {
        const q = await courseService.getQuiz(courseId, lessonId);
        setQuiz(q);
        // If there's a best attempt, show it by default
        if (q.bestAttempt) {
          setShowingBest(true);
        }
      } catch {
        messageApi.error("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, lessonId, messageApi]);

  const handleSingle = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  };

  const handleMultiple = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      return {
        ...prev,
        [questionId]: checked ? [...current, optionId] : current.filter((id) => id !== optionId),
      };
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const payload = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: answers[q.id] ?? [],
    }));
    setSubmitting(true);
    try {
      const res = await courseService.submitQuiz(courseId, lessonId, payload);
      setResult(res);
      if (res.passed) onPass();
    } catch {
      messageApi.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    setShowingBest(false);
    setRetaking(true);
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
        Quiz not found
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => (answers[q.id]?.length ?? 0) > 0);
  const bestAttempt = quiz.bestAttempt;

  // ── Show best attempt results ──
  if (showingBest && bestAttempt && !retaking) {
    const bestAnswerMap: Record<string, string[]> = {};
    bestAttempt.answers.forEach((a) => {
      bestAnswerMap[a.questionId] = a.selectedOptionIds;
    });

    return (
      <div>
        {contextHolder}
        {/* Quiz header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-zinc-900">{quiz.title}</h3>
          <p className="text-sm text-zinc-400">
            Passing score: {quiz.passingScore}% · {quiz.questions.length} questions
          </p>
        </div>

        {/* Score result card */}
        <div
          className={`mb-8 flex flex-col items-center gap-5 rounded-2xl p-6 sm:flex-row ${
            bestAttempt.passed
              ? "border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"
              : "border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
          }`}
        >
          <Progress
            type="circle"
            percent={bestAttempt.score}
            size={80}
            strokeColor={
              bestAttempt.passed
                ? { "0%": "#10b981", "100%": "#059669" }
                : { "0%": "#f59e0b", "100%": "#d97706" }
            }
            trailColor={bestAttempt.passed ? "#d1fae5" : "#fef3c7"}
            strokeWidth={8}
            format={(pct) => (
              <span
                className={`text-lg font-bold ${
                  bestAttempt.passed ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {pct}%
              </span>
            )}
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
              <span className="text-2xl">{bestAttempt.passed ? "🎉" : "💪"}</span>
              <p
                className={`text-lg font-bold ${
                  bestAttempt.passed ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {bestAttempt.passed ? "You passed!" : "Keep practicing!"}
              </p>
            </div>
            <p className={`text-sm ${bestAttempt.passed ? "text-emerald-600" : "text-amber-600"}`}>
              Score: {bestAttempt.score}% ·{" "}
              {bestAttempt.passed
                ? "Lesson marked as complete"
                : `Need ${quiz.passingScore}% to pass`}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Attempted on{" "}
              {new Date(bestAttempt.attemptedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRetake}
            className="rounded-xl"
            size="large"
          >
            Retake Quiz
          </Button>
        </div>

        {/* Review answers */}
        <h4 className="mb-4 text-sm font-semibold text-zinc-600">Your Answers</h4>
        <div className="space-y-4">
          {quiz.questions
            .sort((a, b) => a.order - b.order)
            .map((q, idx) => {
              const selectedIds = bestAnswerMap[q.id] ?? [];

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
                >
                  <p className="mb-4 font-semibold text-zinc-900">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = selectedIds.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                            isSelected
                              ? "border-indigo-300 bg-indigo-50 font-medium text-indigo-700"
                              : "border-zinc-100 bg-zinc-50 text-zinc-500"
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircleFilled className="text-indigo-500" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border-2 border-zinc-200" />
                          )}
                          {opt.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {contextHolder}
      {/* Quiz header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">{quiz.title}</h3>
          <p className="text-sm text-zinc-400">
            Passing score: {quiz.passingScore}% · {quiz.questions.length} questions
          </p>
        </div>
      </div>

      {/* Result banner (after submitting) */}
      {result && (
        <div
          className={`mb-6 flex items-center gap-4 rounded-2xl p-5 ${
            result.passed
              ? "border border-emerald-200 bg-emerald-50"
              : "border border-rose-200 bg-rose-50"
          }`}
        >
          <Progress
            type="circle"
            percent={result.score}
            size={64}
            strokeColor={
              result.passed
                ? { "0%": "#10b981", "100%": "#059669" }
                : { "0%": "#f43f5e", "100%": "#e11d48" }
            }
            trailColor={result.passed ? "#d1fae5" : "#ffe4e6"}
            strokeWidth={8}
            format={(pct) => (
              <span
                className={`text-sm font-bold ${
                  result.passed ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {pct}%
              </span>
            )}
          />
          <div className="flex-1">
            <p className={`font-bold ${result.passed ? "text-emerald-700" : "text-rose-700"}`}>
              {result.passed ? "You passed! 🎉" : "Not quite there yet"}
            </p>
            <p className={`text-sm ${result.passed ? "text-emerald-600" : "text-rose-600"}`}>
              Score: {result.score}% ·{" "}
              {result.passed ? "Lesson marked as complete" : `Need ${quiz.passingScore}% to pass`}
            </p>
          </div>
          {!result.passed && (
            <Button icon={<ReloadOutlined />} onClick={handleReset} className="rounded-xl">
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Questions */}
      {!result && (
        <>
          <div className="space-y-6">
            {quiz.questions
              .sort((a, b) => a.order - b.order)
              .map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
                >
                  <p className="mb-4 font-semibold text-zinc-900">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    {q.question}
                    {q.type === "multiple" && (
                      <span className="ml-2 text-xs font-normal text-zinc-400">
                        (select all that apply)
                      </span>
                    )}
                  </p>

                  {q.type === "single" ? (
                    <Radio.Group
                      className="w-full"
                      value={answers[q.id]?.[0]}
                      onChange={(e) => handleSingle(q.id, e.target.value)}
                    >
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                              answers[q.id]?.[0] === opt.id
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-zinc-100 bg-zinc-50 text-zinc-700 hover:border-indigo-200"
                            }`}
                          >
                            <Radio value={opt.id} className="flex-shrink-0" />
                            {opt.text}
                          </label>
                        ))}
                      </div>
                    </Radio.Group>
                  ) : (
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                            answers[q.id]?.includes(opt.id)
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-zinc-100 bg-zinc-50 text-zinc-700 hover:border-indigo-200"
                          }`}
                        >
                          <Checkbox
                            checked={answers[q.id]?.includes(opt.id)}
                            onChange={(e) => handleMultiple(q.id, opt.id, e.target.checked)}
                            className="flex-shrink-0"
                          />
                          {opt.text}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={submitting}
            disabled={!allAnswered}
            onClick={handleSubmit}
            className="mt-6 h-11 rounded-xl text-sm font-semibold"
            style={{
              background: allAnswered
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : undefined,
              border: "none",
            }}
          >
            Submit Quiz
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Main learn page ──────────────────────────────────────────────────────────
export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch course + lesson list
  const fetchCourse = useCallback(async () => {
    try {
      const data = await courseService.getCourse(courseId);
      setCourse(data);
      return data;
    } catch {
      messageApi.error("Failed to load course");
      return null;
    } finally {
      setCourseLoading(false);
    }
  }, [courseId, messageApi]);

  // Fetch active lesson content
  const fetchLesson = useCallback(
    async (lId: string) => {
      setLessonLoading(true);
      try {
        const data = await courseService.getLesson(courseId, lId);
        setActiveLesson(data);
      } catch {
        messageApi.error("Failed to load lesson");
      } finally {
        setLessonLoading(false);
      }
    },
    [courseId, messageApi],
  );

  useEffect(() => {
    fetchCourse().then((data) => {
      if (!data) return;
      // Use URL param, or default to first lesson
      const targetId = lessonId ?? data.lessons[0]?.id;
      if (targetId) fetchLesson(targetId);
    });
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When URL lesson param changes, load that lesson
  useEffect(() => {
    if (lessonId) fetchLesson(lessonId);
  }, [lessonId, fetchLesson]);

  const handleSelectLesson = (lesson: Lesson) => {
    router.push(`/courses/${courseId}/learn?lesson=${lesson.id}`);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      await courseService.completeLesson(courseId, activeLesson.id);
      messageApi.success("Lesson marked as complete!");
      // Refetch course to update sidebar checkmarks
      const updated = await courseService.getCourse(courseId);
      setCourse(updated);
      setActiveLesson((prev) => (prev ? { ...prev, completed: true } : null));
    } catch {
      messageApi.error("Failed to mark complete");
    } finally {
      setCompleting(false);
    }
  };

  const navigateLesson = (direction: "prev" | "next") => {
    if (!course || !activeLesson) return;
    const sorted = course.lessons.sort((a, b) => a.order - b.order);
    const currentIdx = sorted.findIndex((l) => l.id === activeLesson.id);
    const nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= 0 && nextIdx < sorted.length) {
      handleSelectLesson(sorted[nextIdx]);
    }
  };

  if (courseLoading) {
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

  if (!course.enrollment) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-zinc-600">You need to enroll in this course first.</p>
        <Link href={`/courses/${courseId}`}>
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            View Course
          </Button>
        </Link>
      </div>
    );
  }

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
  const currentIdx = sortedLessons.findIndex((l) => l.id === activeLesson?.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < sortedLessons.length - 1;
  const progress = course.enrollment.progressPercent;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {contextHolder}

      {/* ── Top bar ── */}
      <div className="sticky top-16 z-30 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 no-underline hover:text-zinc-900"
          >
            <ArrowLeftOutlined style={{ fontSize: 13 }} />
            <span className="max-w-[160px] truncate sm:max-w-none">{course.title}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Progress
              type="circle"
              percent={progress}
              size={28}
              strokeColor="#6366f1"
              trailColor="#f1f5f9"
              strokeWidth={10}
              format={(pct) => <span className="text-[8px] font-bold text-indigo-600">{pct}</span>}
            />
            <span className="text-xs text-zinc-400">{progress}%</span>
          </div>
        </div>

        {/* Mobile lesson strip */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-2.5 lg:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {sortedLessons.map((lesson, index) => {
            const isActive = activeLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : lesson.completed
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {lesson.completed && !isActive ? (
                  <CheckOutlined style={{ fontSize: 10 }} />
                ) : (
                  <span>{index + 1}</span>
                )}
                <span className="max-w-[90px] truncate">{lesson.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0">
        {/* ── Sidebar (desktop only) ── */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white lg:flex">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              Course Content
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {course.enrollment.completedLessons} / {course.totalLessons} completed
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {sortedLessons.map((lesson, index) => {
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                        lesson.completed
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {lesson.completed ? <CheckOutlined /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${isActive ? "text-indigo-700" : ""}`}
                      >
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        {LESSON_ICON[lesson.type]}
                        <span className="capitalize">{lesson.type}</span>
                        {lesson.durationMinutes && (
                          <>
                            <span>·</span>
                            <ClockCircleOutlined />
                            <span>{lesson.durationMinutes}m</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-8 sm:pb-8">
          {lessonLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spin size="large" />
            </div>
          ) : activeLesson ? (
            <>
              {/* Lesson header */}
              <div className="mb-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Tag
                    className="rounded-full border-0 text-xs capitalize"
                    color={
                      activeLesson.type === "video"
                        ? "blue"
                        : activeLesson.type === "pdf"
                          ? "red"
                          : activeLesson.type === "quiz"
                            ? "gold"
                            : "green"
                    }
                  >
                    {LESSON_ICON[activeLesson.type]}
                    <span className="ml-1 capitalize">{activeLesson.type}</span>
                  </Tag>
                  {activeLesson.completed && (
                    <Tag color="green" className="rounded-full border-0 text-xs">
                      <CheckCircleFilled className="mr-1" />
                      Completed
                    </Tag>
                  )}
                  {activeLesson.durationMinutes && (
                    <span className="text-xs text-zinc-400">
                      <ClockCircleOutlined className="mr-1" />
                      {activeLesson.durationMinutes} min
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-zinc-900 sm:text-2xl">
                  {activeLesson.title}
                </h1>
              </div>

              {/* Lesson content */}
              <div className="mb-5">
                {activeLesson.type === "video" && <VideoLesson videoUrl={activeLesson.videoUrl} />}
                {activeLesson.type === "pdf" && <PdfLesson pdfUrl={activeLesson.pdfUrl} />}
                {activeLesson.type === "text" && <TextLesson content={activeLesson.content} />}
                {activeLesson.type === "quiz" && (
                  <QuizLesson
                    courseId={courseId}
                    lessonId={activeLesson.id}
                    onPass={() => {
                      setActiveLesson((prev) => (prev ? { ...prev, completed: true } : null));
                      fetchCourse();
                    }}
                  />
                )}
              </div>

              {/* Bottom navigation — sticky on mobile */}
              <div className="fixed right-0 bottom-16 left-0 z-20 border-t border-zinc-100 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:static sm:bottom-auto sm:rounded-2xl sm:border sm:px-4 sm:shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!hasPrev}
                    onClick={() => navigateLesson("prev")}
                    className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 active:scale-95 disabled:opacity-30"
                  >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <Tooltip title={activeLesson.completed ? "Already completed" : ""}>
                    <button
                      disabled={
                        activeLesson.completed || activeLesson.type === "quiz" || completing
                      }
                      onClick={handleMarkComplete}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
                      style={
                        activeLesson.completed
                          ? { background: "#10b981" }
                          : { background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }
                      }
                    >
                      <CheckOutlined style={{ fontSize: 12 }} />
                      {completing
                        ? "Saving…"
                        : activeLesson.completed
                          ? "Completed"
                          : "Mark Complete"}
                    </button>
                  </Tooltip>

                  <button
                    disabled={!hasNext}
                    onClick={() => navigateLesson("next")}
                    className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 active:scale-95 disabled:opacity-30"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRightOutlined style={{ fontSize: 12 }} />
                  </button>
                </div>
              </div>

              {/* Course complete banner */}
              {progress === 100 && (
                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Course Complete!</p>
                    <p className="text-xs text-emerald-600">
                      You&apos;ve finished all {course.totalLessons} lessons in this course.
                    </p>
                  </div>
                  <TrophyOutlined className="ml-auto text-xl text-amber-500" />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
              Select a lesson to start learning.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
