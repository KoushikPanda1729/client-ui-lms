"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Drawer, Dropdown, Avatar } from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/partners", label: "Find Partners" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const userMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Profile Settings",
      onClick: () => router.push("/settings"),
    },
    { type: "divider" as const },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log Out",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200 bg-white shadow-sm"
          : "border-b border-white/10 bg-white/10 backdrop-blur-xl"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span
            className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? "text-zinc-900" : "text-white"}`}
          >
            Speak<span className={scrolled ? "gradient-text" : "text-indigo-300"}>Easy</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium no-underline transition-colors ${scrolled ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth area */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
              <button
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${scrolled ? "border-zinc-200 bg-white hover:border-indigo-300 hover:shadow-sm" : "border-white/25 bg-white/15 backdrop-blur-sm hover:bg-white/25"}`}
              >
                <Avatar
                  size={28}
                  src={user.avatarUrl}
                  icon={!user.avatarUrl && <UserOutlined />}
                  style={{ backgroundColor: "#6366f1" }}
                />
                <span
                  className={`max-w-[120px] truncate text-sm font-medium ${scrolled ? "text-zinc-700" : "text-white"}`}
                >
                  {user.name || user.email.split("@")[0]}
                </span>
              </button>
            </Dropdown>
          ) : (
            <>
              <Link href="/login">
                <Button
                  type="text"
                  className={`h-9 text-sm font-medium ${scrolled ? "text-zinc-600" : "!text-white/80 hover:!text-white"}`}
                >
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  type="primary"
                  className="h-9 rounded-lg px-5 text-sm font-semibold shadow-lg shadow-indigo-500/30"
                >
                  Sign Up Free
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="block md:hidden">
          <Button
            type="text"
            icon={<MenuOutlined className="text-lg text-zinc-700" />}
            onClick={() => setMobileOpen(true)}
          />
        </div>

        <Drawer
          title={
            <span className="text-lg font-bold text-zinc-900">
              Speak<span className="gradient-text">Easy</span>
            </span>
          }
          placement="right"
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          closeIcon={<CloseOutlined />}
          size="default"
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 no-underline hover:bg-zinc-100"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-3 border-t border-zinc-200" />
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2">
                  <Avatar
                    size={32}
                    src={user.avatarUrl}
                    icon={!user.avatarUrl && <UserOutlined />}
                    style={{ backgroundColor: "#6366f1" }}
                  />
                  <span className="text-sm font-medium text-zinc-700">
                    {user.name || user.email.split("@")[0]}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 no-underline hover:bg-zinc-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 no-underline hover:bg-zinc-100"
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button block size="large" className="mb-2">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button type="primary" block size="large">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Drawer>
      </nav>
    </header>
  );
}
