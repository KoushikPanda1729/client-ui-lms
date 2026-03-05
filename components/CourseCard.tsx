"use client";

import Link from "next/link";
import Image from "next/image";
import { Skeleton, Progress } from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleFilled,
  LockOutlined,
} from "@ant-design/icons";
import { Course } from "@/lib/services/course";

/* ── Level theme config ─────────────────────────── */
const LEVEL_THEME = {
  beginner: { gradient: "from-emerald-400 to-teal-500", emoji: "📚", dot: "bg-emerald-400" },
  intermediate: { gradient: "from-blue-400 to-indigo-500", emoji: "💼", dot: "bg-blue-400" },
  advanced: { gradient: "from-rose-400 to-pink-500", emoji: "🎯", dot: "bg-rose-400" },
} as const;

const DEFAULT_THEME = {
  gradient: "from-indigo-400 to-violet-500",
  emoji: "📖",
  dot: "bg-indigo-400",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

/* ── Skeleton ────────────────────────────────────── */
export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="aspect-[16/9] w-full bg-zinc-100" />
      <div className="p-5">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    </div>
  );
}

/* ── Main card ───────────────────────────────────── */
export default function CourseCard({ course }: { course: Course }) {
  const theme = course.level ? LEVEL_THEME[course.level] : DEFAULT_THEME;
  const priceLabel = course.isPremium ? formatPrice(course.price) : "Free";
  const enrolled = !!course.enrollment;
  const progress = course.enrollment?.progressPercent ?? 0;

  return (
    <Link href={`/courses/${course.id}`} className="no-underline">
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-zinc-200/60">
        {/* ── Thumbnail header ─────────────── */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Gradient fallback when no thumbnail */
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}
            >
              <span className="text-6xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                {theme.emoji}
              </span>
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/10" />
            </div>
          )}

          {/* Overlay gradient for readability of badges */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* ── Top badges row ──────────────── */}
          <div className="absolute top-0 right-0 left-0 flex items-start justify-between p-3.5">
            <div className="flex items-center gap-2">
              {enrolled && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                  <CheckCircleFilled className="text-[10px]" /> Enrolled
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white capitalize shadow-sm backdrop-blur-md ${
                  course.thumbnailUrl ? "bg-white/20" : "bg-white/25"
                }`}
              >
                {course.level ?? "General"}
              </span>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-md ${
                priceLabel === "Free" ? "bg-white/20" : "bg-black/30"
              }`}
            >
              {course.isPremium && priceLabel !== "Free" && (
                <LockOutlined className="mr-1 text-[10px]" />
              )}
              {priceLabel}
            </span>
          </div>

          {/* ── Hover play icon ─────────────── */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
              <PlayCircleOutlined className="text-2xl" />
            </div>
          </div>
        </div>

        {/* ── Card body ────────────────────── */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-1.5 line-clamp-2 text-[15px] leading-snug font-bold text-zinc-900 transition-colors group-hover:text-indigo-600">
            {course.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
            {course.description ?? "No description available."}
          </p>

          <div className="mt-auto" />

          {/* Progress bar (enrolled only) */}
          {enrolled && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-[11px]">
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

          {/* Meta row */}
          <div className="flex items-center gap-4 text-[12px] text-zinc-400">
            <span className="flex items-center gap-1">
              <BookOutlined /> {course.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1 capitalize">
              <ClockCircleOutlined /> {course.level ?? "All levels"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
