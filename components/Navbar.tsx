"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button, Drawer, Dropdown, Avatar, Badge, Spin } from "antd";
import {
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  BellOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService, type AppNotification } from "@/lib/services/notification";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/partners", label: "Find Partners" },
  { href: "/ai-conversation", label: "AI Tutor" },
  { href: "/sessions", label: "My Sessions" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      /* ignore */
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await notificationService.getMyNotifications(1, 30);
      setNotifications(res.notifications);
      setUnreadCount(res.notifications.filter((n) => !n.read).length);
    } catch {
      /* ignore */
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const handleOpenNotifs = useCallback(() => {
    setNotifOpen(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  }, []);

  // Poll unread count every 60s when user is logged in
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchUnreadCount]);

  // Transparent mode only on home page (has dark hero background)
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

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
        transparent
          ? "border-b border-white/10 bg-white/10 backdrop-blur-xl"
          : "border-b border-zinc-200 bg-white shadow-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span
            className={`text-xl font-bold tracking-tight transition-colors ${transparent ? "text-white" : "text-zinc-900"}`}
          >
            Speak<span className={transparent ? "text-indigo-300" : "gradient-text"}>Easy</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium no-underline transition-colors ${transparent ? "text-white/80 hover:text-white" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth area */}
        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <button
              onClick={handleOpenNotifs}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
            >
              <BellOutlined style={{ fontSize: 18 }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
              <button
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${transparent ? "border-white/25 bg-white/15 backdrop-blur-sm hover:bg-white/25" : "border-zinc-200 bg-white hover:border-indigo-300 hover:shadow-sm"}`}
              >
                <Avatar
                  size={28}
                  src={user.avatarUrl}
                  icon={!user.avatarUrl && <UserOutlined />}
                  style={{ backgroundColor: "#6366f1" }}
                />
                <span
                  className={`max-w-[120px] truncate text-sm font-medium ${transparent ? "text-white" : "text-zinc-700"}`}
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
                  className={`h-9 text-sm font-medium ${transparent ? "!text-white/80 hover:!text-white" : "text-zinc-600"}`}
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
            icon={
              <MenuOutlined className={`text-lg ${transparent ? "text-white" : "text-zinc-700"}`} />
            }
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

      {/* Notification Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-zinc-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
              >
                <CheckOutlined style={{ fontSize: 11 }} />
                Mark all read
              </button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setNotifOpen(false)}
        open={notifOpen}
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        {notifLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
            <BellOutlined style={{ fontSize: 36 }} />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkAsRead(n.id)}
                className={`flex cursor-pointer gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 ${!n.read ? "bg-indigo-50/50" : ""}`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <div
                    className={`h-2 w-2 rounded-full ${n.read ? "bg-transparent" : "bg-indigo-500"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm leading-snug ${n.read ? "font-normal text-zinc-700" : "font-semibold text-zinc-900"}`}
                  >
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{n.body}</p>
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    {(() => {
                      const utcStr =
                        n.createdAt.endsWith("Z") || n.createdAt.includes("+")
                          ? n.createdAt
                          : n.createdAt + "Z";
                      const diff = Date.now() - new Date(utcStr).getTime();
                      const mins = Math.floor(diff / 60_000);
                      if (mins < 1) return "just now";
                      if (mins < 60) return `${mins}m ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </header>
  );
}
