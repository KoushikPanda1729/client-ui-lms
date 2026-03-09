"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Keep a ref so the effect always sees the latest pathname for the redirect
  // URL without re-triggering on every client-side navigation.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathnameRef.current)}`);
    } else if (!loading && user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]); // intentionally omit router/pathname — run only on auth state change

  // Block render until auth is resolved — prevents dashboard flash
  if (loading || !user || !user.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <CallProvider>
      <Navbar />
      <main className="min-h-screen bg-white pt-16">{children}</main>
      <Footer />
    </CallProvider>
  );
}
