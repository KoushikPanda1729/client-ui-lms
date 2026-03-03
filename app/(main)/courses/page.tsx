"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input, Select, Empty, Button, Skeleton, Progress } from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
} from "@ant-design/icons";
import { courseService, Course } from "@/lib/services/course";

const LEVEL_CONFIG = {
  beginner: {
    gradient: "from-emerald-400 to-teal-500",
    badge: "bg-white/25",
    emoji: "📚",
  },
  intermediate: {
    gradient: "from-blue-400 to-indigo-500",
    badge: "bg-white/25",
    emoji: "💼",
  },
  advanced: {
    gradient: "from-rose-400 to-pink-500",
    badge: "bg-white/25",
    emoji: "🎯",
  },
} as const;

const DEFAULT_CONFIG = {
  gradient: "from-indigo-400 to-violet-500",
  badge: "bg-white/25",
  emoji: "📖",
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `₹${price}`;
}

function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <Skeleton.Image active className="!h-44 !w-full rounded-none" />
      <div className="p-5">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params: { level?: string; limit: number } = { limit: 50 };
      if (level !== "all") params.level = level;
      const res = await courseService.list(params);
      setCourses(res.courses);
      setTotal(res.total);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const levelCounts = {
    all: total,
    beginner: courses.filter((c) => c.level === "beginner").length,
    intermediate: courses.filter((c) => c.level === "intermediate").length,
    advanced: courses.filter((c) => c.level === "advanced").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Hero header */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600">
                <BookOutlined /> {total > 0 ? `${total} Courses Available` : "Courses"}
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Explore <span className="gradient-text">Courses</span>
              </h1>
              <p className="max-w-lg text-base text-zinc-500">
                Expert-crafted courses from beginner to advanced. Learn at your pace and track your
                progress.
              </p>
            </div>
            <div className="flex gap-6">
              {[
                { value: total > 0 ? `${total}` : "—", label: "Courses" },
                {
                  value: levelCounts.beginner > 0 ? `${levelCounts.beginner}` : "—",
                  label: "Beginner",
                },
                {
                  value: levelCounts.advanced > 0 ? `${levelCounts.advanced}` : "—",
                  label: "Advanced",
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
                  <div className="text-xs text-zinc-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Filters bar */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              size="large"
              placeholder="Search courses..."
              prefix={<SearchOutlined className="text-zinc-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl sm:w-72"
              allowClear
            />
            <Select
              size="large"
              value={level}
              onChange={setLevel}
              className="min-w-[200px]"
              suffixIcon={<FilterOutlined />}
              options={[
                { value: "all", label: `All Levels (${levelCounts.all})` },
                { value: "beginner", label: `🟢 Beginner (${levelCounts.beginner})` },
                { value: "intermediate", label: `🔵 Intermediate (${levelCounts.intermediate})` },
                { value: "advanced", label: `🔴 Advanced (${levelCounts.advanced})` },
              ]}
            />
          </div>
          <p className="text-sm font-medium text-zinc-500">
            {loading
              ? "Loading…"
              : `${filtered.length} course${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => {
              const cfg = c.level ? LEVEL_CONFIG[c.level] : DEFAULT_CONFIG;
              const priceLabel = formatPrice(c.price);
              const enrolled = !!c.enrollment;
              const progress = c.enrollment?.progressPercent ?? 0;

              return (
                <Link key={c.id} href={`/courses/${c.id}`} className="no-underline">
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-200/60">
                    {/* Card header — colored gradient */}
                    <div
                      className={`relative flex h-44 flex-col justify-between bg-gradient-to-br p-5 ${cfg.gradient}`}
                    >
                      {/* Top row: level + price */}
                      <div className="flex items-start justify-between">
                        <span className="rounded-lg bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white capitalize backdrop-blur-sm">
                          {c.level ?? "General"}
                        </span>
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold text-white ${priceLabel === "Free" ? "bg-white/25 backdrop-blur-sm" : "bg-black/20 backdrop-blur-sm"}`}
                        >
                          {c.isPremium && priceLabel !== "Free" && (
                            <LockOutlined className="mr-1 text-[10px]" />
                          )}
                          {priceLabel}
                        </span>
                      </div>

                      {/* Emoji / thumbnail */}
                      <div className="flex items-end justify-between">
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt={c.title}
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

                      {/* Enrolled badge */}
                      {enrolled && (
                        <div className="absolute top-0 left-0 m-2">
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                            <CheckCircleFilled className="text-[10px]" /> Enrolled
                          </span>
                        </div>
                      )}

                      {/* Decorative shapes */}
                      <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
                      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/10" />
                    </div>

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-5">
                      {/* Title & desc */}
                      <h3 className="mb-1.5 text-[15px] leading-snug font-bold text-zinc-900">
                        {c.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                        {c.description ?? "No description available."}
                      </p>

                      <div className="mt-auto" />

                      {/* Progress bar if enrolled */}
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
                      <div className="mb-4 flex items-center gap-4 text-[12px] text-zinc-400">
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
            <Empty
              description={
                <span className="text-zinc-400">No courses found matching your search</span>
              }
            />
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="flex flex-col items-center gap-6 px-8 py-12 text-center md:flex-row md:px-14 md:text-left">
            <div className="flex-1">
              <h3 className="mb-2 text-2xl font-bold text-white">
                Can&apos;t decide where to start?
              </h3>
              <p className="max-w-md text-sm text-indigo-100">
                Browse by level and find the perfect course for your current skills.
              </p>
            </div>
            <Button
              size="large"
              onClick={() => setLevel("beginner")}
              className="h-12 rounded-xl border-0 bg-white px-8 text-[15px] font-bold text-indigo-600 shadow-xl hover:bg-indigo-50"
            >
              Start from Beginner <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
