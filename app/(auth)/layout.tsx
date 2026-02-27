"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/contexts/AuthContext";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [user, loading, router, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (user) {
    // While redirecting, show spinner
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding panel */}
      <div className="relative hidden w-[45%] overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 lg:flex lg:flex-col lg:justify-between lg:p-10">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-base font-bold text-white shadow-lg backdrop-blur-sm">
            S
          </div>
          <span className="text-xl font-bold text-white">SpeakEasy</span>
        </Link>

        {/* Middle content */}
        <div className="relative z-10 max-w-md">
          <h2 className="mb-4 text-3xl leading-tight font-bold text-white">
            Master English with confidence and fluency
          </h2>
          <p className="mb-8 text-base leading-relaxed text-indigo-100">
            Join 10,000+ learners practicing English with native speakers through live sessions and
            expert courses.
          </p>
          <div className="space-y-3">
            {[
              "Live 1-on-1 speaking sessions",
              "200+ expert-crafted courses",
              "Track your progress daily",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 rounded-xl bg-white/10 p-5 backdrop-blur-sm">
          <p className="mb-3 text-sm leading-relaxed text-white/90 italic">
            &ldquo;SpeakEasy helped me go from barely speaking English to acing my IELTS in 4
            months. The live practice sessions are amazing!&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm">
              👩‍🎓
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Maria Gonzalez</p>
              <p className="text-xs text-indigo-200">IELTS Score: 8.5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
