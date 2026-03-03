"use client";

import React from "react";
import Link from "next/link";
import { Button, Progress, Timeline } from "antd";
import {
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  RightOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const enrolledCourses = [
  { title: "English for Beginners", progress: 72, lessons: "17/24", emoji: "📚" },
  { title: "Business English Mastery", progress: 35, lessons: "11/32", emoji: "💼" },
  { title: "Pronunciation Mastery", progress: 10, lessons: "2/18", emoji: "🗣️" },
];

const upcomingSessions = [
  {
    partner: "Emma Williams",
    avatar: "👩‍🏫",
    date: "Today, 4:00 PM",
    topic: "Conversation Practice",
  },
  {
    partner: "James Anderson",
    avatar: "👨‍💼",
    date: "Tomorrow, 10:00 AM",
    topic: "Business English",
  },
];

export default function DashboardPage() {
  return (
    <div className="py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, <span className="gradient-text">Alex!</span> 👋
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            Here&apos;s your learning overview
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Courses Enrolled",
              value: "3",
              icon: <BookOutlined />,
              bg: "from-indigo-500 to-violet-600",
            },
            {
              label: "Hours Practiced",
              value: "24",
              icon: <ClockCircleOutlined />,
              bg: "from-cyan-500 to-blue-600",
            },
            {
              label: "Speaking Sessions",
              value: "12",
              icon: <TeamOutlined />,
              bg: "from-emerald-500 to-teal-600",
            },
            {
              label: "Day Streak",
              value: "7🔥",
              icon: <FireOutlined />,
              bg: "from-amber-500 to-orange-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base text-white ${s.bg}`}
              >
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white">{s.value}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* My courses */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  My Courses
                </h2>
                <Link href="/courses">
                  <Button type="link" size="small" className="text-xs font-medium">
                    View All <RightOutlined />
                  </Button>
                </Link>
              </div>
              <div className="space-y-5">
                {enrolledCourses.map((c) => (
                  <div key={c.title} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-xl dark:from-indigo-950/20 dark:to-violet-950/20">
                      {c.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                          {c.title}
                        </h4>
                        <span className="flex-shrink-0 text-[11px] text-zinc-400">{c.lessons}</span>
                      </div>
                      <Progress
                        percent={c.progress}
                        size={["100%", 8]}
                        strokeColor={{ "0%": "#6366f1", "100%": "#a78bfa" }}
                        showInfo={false}
                      />
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {c.progress}% complete
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
                Achievements
              </h2>
              <div className="space-y-3.5">
                {[
                  { icon: "🔥", title: "7-Day Streak", desc: "Learn for 7 days straight" },
                  { icon: "🎯", title: "First Course", desc: "Enroll in your first course" },
                  { icon: "💬", title: "Conversation Star", desc: "Complete 10 speaking sessions" },
                  { icon: "📚", title: "Bookworm", desc: "Finish 50 lessons" },
                ].map((b) => (
                  <div key={b.title} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-lg dark:bg-amber-950/20">
                      {b.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
                Recent Activity
              </h2>
              <Timeline
                items={[
                  {
                    color: "green",
                    children: (
                      <div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          Completed &quot;Verbs &amp; Tenses&quot;
                        </p>
                        <p className="text-[11px] text-zinc-400">2 hours ago</p>
                      </div>
                    ),
                  },
                  {
                    color: "blue",
                    children: (
                      <div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          Speaking session with Emma
                        </p>
                        <p className="text-[11px] text-zinc-400">5 hours ago</p>
                      </div>
                    ),
                  },
                  {
                    color: "gold",
                    children: (
                      <div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          Earned &quot;Week Streak&quot; badge
                        </p>
                        <p className="text-[11px] text-zinc-400">Yesterday</p>
                      </div>
                    ),
                  },
                  {
                    color: "purple",
                    children: (
                      <div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          Enrolled in Pronunciation Mastery
                        </p>
                        <p className="text-[11px] text-zinc-400">2 days ago</p>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
