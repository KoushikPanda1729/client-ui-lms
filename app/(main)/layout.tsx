"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spin } from "antd";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportWidget from "@/components/SupportWidget";
import { useAuth } from "@/contexts/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
    } else if (!loading && user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [user, loading, router, pathname]);

  // Block render until auth is resolved — prevents dashboard flash
  if (loading || !user || !user.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-16">{children}</main>
      <Footer />
      <SupportWidget />
    </>
  );
}
