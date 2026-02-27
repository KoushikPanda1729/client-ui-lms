"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input, Select, Empty, Button } from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  StarFilled,
  UserOutlined,
  FilterOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const allCourses = [
  {
    id: "1",
    title: "English for Beginners",
    desc: "Start your English journey with fundamental grammar, vocabulary, and basic conversation skills.",
    level: "Beginner",
    rating: 4.9,
    students: 2340,
    lessons: 24,
    duration: "12h",
    instructor: "Sarah Johnson",
    instructorRole: "Cambridge Certified",
    emoji: "📚",
    price: "Free",
    gradient: "from-emerald-400 to-teal-500",
    lightGradient: "from-emerald-50 to-teal-50",
    levelColor: "bg-emerald-100 text-emerald-700",
    priceColor: "bg-emerald-500",
    highlights: ["Grammar basics", "500+ vocabulary", "Daily conversation"],
  },
  {
    id: "2",
    title: "Business English Mastery",
    desc: "Master professional English for meetings, presentations, emails, and corporate communication.",
    level: "Intermediate",
    rating: 4.8,
    students: 1890,
    lessons: 32,
    duration: "16h",
    instructor: "Michael Chen",
    instructorRole: "TESOL Expert",
    emoji: "💼",
    price: "$49",
    gradient: "from-blue-400 to-indigo-500",
    lightGradient: "from-blue-50 to-indigo-50",
    levelColor: "bg-blue-100 text-blue-700",
    priceColor: "bg-blue-500",
    highlights: ["Email writing", "Presentations", "Negotiation skills"],
  },
  {
    id: "3",
    title: "IELTS Preparation Pro",
    desc: "Comprehensive preparation for all IELTS modules — Reading, Writing, Listening & Speaking.",
    level: "Advanced",
    rating: 4.9,
    students: 3210,
    lessons: 48,
    duration: "24h",
    instructor: "Dr. Emily Roberts",
    instructorRole: "IELTS Examiner",
    emoji: "🎯",
    price: "$79",
    gradient: "from-rose-400 to-pink-500",
    lightGradient: "from-rose-50 to-pink-50",
    levelColor: "bg-rose-100 text-rose-700",
    priceColor: "bg-rose-500",
    highlights: ["All 4 modules", "Mock tests", "Band 7+ strategies"],
  },
  {
    id: "4",
    title: "Everyday Conversations",
    desc: "Learn practical phrases and expressions for daily situations — shopping, travel, dining.",
    level: "Beginner",
    rating: 4.7,
    students: 1560,
    lessons: 20,
    duration: "10h",
    instructor: "Jessica Lee",
    instructorRole: "ESL Teacher",
    emoji: "💬",
    price: "Free",
    gradient: "from-violet-400 to-purple-500",
    lightGradient: "from-violet-50 to-purple-50",
    levelColor: "bg-emerald-100 text-emerald-700",
    priceColor: "bg-emerald-500",
    highlights: ["Real situations", "Audio practice", "Cultural tips"],
  },
  {
    id: "5",
    title: "Pronunciation Mastery",
    desc: "Perfect your accent with phonetics training, stress patterns, and intonation exercises.",
    level: "Intermediate",
    rating: 4.8,
    students: 980,
    lessons: 18,
    duration: "9h",
    instructor: "David Wilson",
    instructorRole: "Phonetics PhD",
    emoji: "🗣️",
    price: "$39",
    gradient: "from-amber-400 to-orange-500",
    lightGradient: "from-amber-50 to-orange-50",
    levelColor: "bg-blue-100 text-blue-700",
    priceColor: "bg-blue-500",
    highlights: ["IPA training", "Accent reduction", "Intonation drills"],
  },
  {
    id: "6",
    title: "Academic Writing",
    desc: "Master essay writing, research papers, and academic discourse for university-level English.",
    level: "Advanced",
    rating: 4.6,
    students: 720,
    lessons: 28,
    duration: "14h",
    instructor: "Prof. James Miller",
    instructorRole: "University Professor",
    emoji: "✍️",
    price: "$59",
    gradient: "from-cyan-400 to-sky-500",
    lightGradient: "from-cyan-50 to-sky-50",
    levelColor: "bg-rose-100 text-rose-700",
    priceColor: "bg-rose-500",
    highlights: ["Essay structure", "Citations", "Academic tone"],
  },
  {
    id: "7",
    title: "English Grammar Bootcamp",
    desc: "Intensive grammar training covering tenses, articles, prepositions, and conditionals.",
    level: "Beginner",
    rating: 4.8,
    students: 2100,
    lessons: 30,
    duration: "15h",
    instructor: "Anna Thompson",
    instructorRole: "Grammar Expert",
    emoji: "📖",
    price: "$29",
    gradient: "from-lime-400 to-green-500",
    lightGradient: "from-lime-50 to-green-50",
    levelColor: "bg-emerald-100 text-emerald-700",
    priceColor: "bg-emerald-500",
    highlights: ["All tenses", "Common mistakes", "Practice tests"],
  },
  {
    id: "8",
    title: "TOEFL Preparation",
    desc: "Full TOEFL preparation with practice tests, strategies, and expert tips for top scores.",
    level: "Advanced",
    rating: 4.9,
    students: 1450,
    lessons: 42,
    duration: "21h",
    instructor: "Robert Brown",
    instructorRole: "TOEFL Specialist",
    emoji: "🏆",
    price: "$89",
    gradient: "from-indigo-400 to-violet-500",
    lightGradient: "from-indigo-50 to-violet-50",
    levelColor: "bg-rose-100 text-rose-700",
    priceColor: "bg-rose-500",
    highlights: ["4 sections", "Score prediction", "Full mock test"],
  },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  const filtered = allCourses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase());
    const matchLevel = level === "all" || c.level === level;
    return matchSearch && matchLevel;
  });

  const counts = {
    all: allCourses.length,
    Beginner: allCourses.filter((c) => c.level === "Beginner").length,
    Intermediate: allCourses.filter((c) => c.level === "Intermediate").length,
    Advanced: allCourses.filter((c) => c.level === "Advanced").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Hero header */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600">
                <BookOutlined /> 200+ Courses Available
              </div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Explore <span className="gradient-text">Courses</span>
              </h1>
              <p className="max-w-lg text-base text-zinc-500">
                Expert-crafted courses from beginner to advanced. Learn at your pace, earn
                certificates, and track your progress.
              </p>
            </div>
            {/* Stats */}
            <div className="flex gap-6">
              {[
                { value: "200+", label: "Courses" },
                { value: "50K+", label: "Students" },
                { value: "4.8", label: "Avg Rating" },
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
              className="min-w-[180px]"
              suffixIcon={<FilterOutlined />}
              options={[
                { value: "all", label: `All Levels (${counts.all})` },
                { value: "Beginner", label: `🟢 Beginner (${counts.Beginner})` },
                { value: "Intermediate", label: `🔵 Intermediate (${counts.Intermediate})` },
                { value: "Advanced", label: `🔴 Advanced (${counts.Advanced})` },
              ]}
            />
          </div>
          <p className="text-sm font-medium text-zinc-500">
            {filtered.length} course{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="no-underline">
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-200/60">
                  {/* Card header — colored gradient */}
                  <div
                    className={`relative flex h-44 flex-col justify-between bg-gradient-to-br p-5 ${c.gradient}`}
                  >
                    {/* Top row: level + price */}
                    <div className="flex items-start justify-between">
                      <span className="rounded-lg bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                        {c.level}
                      </span>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold text-white ${c.price === "Free" ? "bg-white/25 backdrop-blur-sm" : "bg-black/20 backdrop-blur-sm"}`}
                      >
                        {c.price}
                      </span>
                    </div>
                    {/* Emoji */}
                    <div className="flex items-end justify-between">
                      <span className="text-5xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                        {c.emoji}
                      </span>
                      {/* Play button on hover */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
                        <PlayCircleOutlined className="text-lg" />
                      </div>
                    </div>
                    {/* Decorative shapes */}
                    <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/10" />
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Rating row */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <StarFilled className="text-xs text-amber-400" />
                        <span className="text-sm font-bold text-zinc-900">{c.rating}</span>
                      </div>
                      <span className="text-xs text-zinc-300">•</span>
                      <span className="text-xs text-zinc-400">
                        {c.students.toLocaleString()} students
                      </span>
                    </div>

                    {/* Title & desc */}
                    <h3 className="mb-2 text-[15px] leading-snug font-bold text-zinc-900">
                      {c.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                      {c.desc}
                    </p>

                    {/* Highlights */}
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {c.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-md bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500"
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Spacer */}
                    <div className="mt-auto" />

                    {/* Meta row */}
                    <div className="mb-4 flex items-center gap-4 text-[12px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <BookOutlined /> {c.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined /> {c.duration}
                      </span>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2.5 border-t border-zinc-100 pt-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-600">
                        {c.instructor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-zinc-800">{c.instructor}</p>
                        <p className="text-[10px] text-zinc-400">{c.instructorRole}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
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
                Take our 2-minute placement test and we&apos;ll recommend the perfect courses for
                your level.
              </p>
            </div>
            <Link href="/register">
              <Button
                size="large"
                className="h-12 rounded-xl border-0 bg-white px-8 text-[15px] font-bold text-indigo-600 shadow-xl hover:bg-indigo-50"
              >
                Take Placement Test <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
