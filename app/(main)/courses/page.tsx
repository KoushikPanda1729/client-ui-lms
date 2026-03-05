"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input, Select, Empty, Button } from "antd";
import {
  BookOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowRightOutlined,
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
            {filtered.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
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
