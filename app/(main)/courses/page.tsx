"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input, Select, Empty, Button } from "antd";
import Link from "next/link";
import {
  BookOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { courseService, Course } from "@/lib/services/course";
import CourseCard, { CourseCardSkeleton } from "@/components/CourseCard";

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

  // Split enrolled vs all
  const enrolled = courses.filter((c) => !!c.enrollment);
  const notEnrolled = courses.filter((c) => !c.enrollment);

  // Search filter applies to all courses section
  const filteredAll = search
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : notEnrolled;

  const levelCounts = {
    all: total,
    beginner: courses.filter((c) => c.level === "beginner").length,
    intermediate: courses.filter((c) => c.level === "intermediate").length,
    advanced: courses.filter((c) => c.level === "advanced").length,
  };

  // In-progress and completed
  const inProgress = enrolled.filter((c) => (c.enrollment?.progressPercent ?? 0) < 100);
  const completed = enrolled.filter((c) => (c.enrollment?.progressPercent ?? 0) >= 100);

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Courses
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                {total} course{total !== 1 ? "s" : ""} available
              </p>
            </div>
            <div className="hidden gap-6 sm:flex">
              {[
                { value: total > 0 ? `${total}` : "—", label: "Total" },
                { value: enrolled.length > 0 ? `${enrolled.length}` : "—", label: "Enrolled" },
                { value: completed.length > 0 ? `${completed.length}` : "—", label: "Completed" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-bold text-zinc-900">{s.value}</div>
                  <div className="text-[11px] text-zinc-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ────────────────────────────────────────────────
            My Courses Section
           ──────────────────────────────────────────────── */}
        {!loading && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
                <TrophyOutlined className="text-indigo-500" />
                My Courses
              </h2>
              {enrolled.length > 0 && (
                <span className="text-xs text-zinc-400">
                  {inProgress.length} in progress · {completed.length} completed
                </span>
              )}
            </div>

            {enrolled.length === 0 ? (
              /* Empty state */
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <RocketOutlined className="text-2xl text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">
                  You haven&apos;t enrolled in any courses yet
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
                  Browse the courses below and start your learning journey today.
                </p>
                <button
                  onClick={() => {
                    document.getElementById("all-courses")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Browse Courses <ArrowRightOutlined style={{ fontSize: 11 }} />
                </button>
              </div>
            ) : (
              /* Enrolled courses — horizontal scroll on mobile, grid on desktop */
              <>
                <div className="-mx-4 sm:hidden">
                  <div
                    className="flex gap-4 overflow-x-auto px-4 pb-2"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {enrolled.map((c) => (
                      <div key={c.id} className="w-64 shrink-0">
                        <CourseCard course={c} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {enrolled.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ────────────────────────────────────────────────
            All Courses Section
           ──────────────────────────────────────────────── */}
        <section id="all-courses">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
              <BookOutlined className="text-violet-500" />
              All Courses
            </h2>
          </div>

          {/* Filter bar */}
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search courses..."
                prefix={<SearchOutlined className="text-zinc-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg sm:w-64"
                allowClear
              />
              <Select
                value={level}
                onChange={setLevel}
                className="min-w-[180px]"
                suffixIcon={<FilterOutlined />}
                options={[
                  { value: "all", label: `All Levels (${levelCounts.all})` },
                  { value: "beginner", label: `🟢 Beginner (${levelCounts.beginner})` },
                  { value: "intermediate", label: `🔵 Intermediate (${levelCounts.intermediate})` },
                  { value: "advanced", label: `🔴 Advanced (${levelCounts.advanced})` },
                ]}
              />
            </div>
            <p className="text-xs text-zinc-400">
              {loading
                ? "Loading…"
                : `${filteredAll.length} course${filteredAll.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Grid / scroll */}
          {loading ? (
            <>
              <div className="-mx-4 sm:hidden">
                <div
                  className="flex gap-4 overflow-x-auto px-4 pb-2"
                  style={{ scrollbarWidth: "none" }}
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-64 shrink-0">
                      <CourseCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            </>
          ) : filteredAll.length > 0 ? (
            <>
              <div className="-mx-4 sm:hidden">
                <div
                  className="flex gap-4 overflow-x-auto px-4 pb-2"
                  style={{ scrollbarWidth: "none" }}
                >
                  {filteredAll.map((c) => (
                    <div key={c.id} className="w-64 shrink-0">
                      <CourseCard course={c} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAll.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16">
              <Empty
                description={
                  <span className="text-zinc-400">No courses found matching your search</span>
                }
              />
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
          <div className="flex flex-col items-center gap-5 px-6 py-10 text-center md:flex-row md:px-10 md:text-left">
            <div className="flex-1">
              <h3 className="mb-1 text-xl font-bold text-white">
                Can&apos;t decide where to start?
              </h3>
              <p className="max-w-md text-sm text-indigo-100">
                Browse by level and find the perfect course for your skills.
              </p>
            </div>
            <Button
              size="large"
              onClick={() => setLevel("beginner")}
              className="h-11 rounded-xl border-0 bg-white px-6 text-sm font-bold text-indigo-600 shadow-xl hover:bg-indigo-50"
            >
              Start from Beginner <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
