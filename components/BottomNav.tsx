"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  HomeFilled,
  BookOutlined,
  BookFilled,
  TeamOutlined,
  RobotOutlined,
  CalendarOutlined,
  CalendarFilled,
} from "@ant-design/icons";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: <HomeOutlined style={{ fontSize: 22 }} />,
    activeIcon: <HomeFilled style={{ fontSize: 22 }} />,
    exact: true,
  },
  {
    href: "/courses",
    label: "Courses",
    icon: <BookOutlined style={{ fontSize: 22 }} />,
    activeIcon: <BookFilled style={{ fontSize: 22 }} />,
  },
  {
    href: "/partners",
    label: "Partners",
    icon: (
      <span className="relative inline-flex">
        <TeamOutlined style={{ fontSize: 22 }} />
        <span className="absolute -top-0.5 -right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500" />
        </span>
      </span>
    ),
    activeIcon: (
      <span className="relative inline-flex">
        <TeamOutlined style={{ fontSize: 22, color: "#6366f1" }} />
        <span className="absolute -top-0.5 -right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-emerald-500" />
        </span>
      </span>
    ),
  },
  {
    href: "/ai-conversation",
    label: "AI Tutor",
    icon: <RobotOutlined style={{ fontSize: 22 }} />,
    activeIcon: <RobotOutlined style={{ fontSize: 22, color: "#6366f1" }} />,
  },
  {
    href: "/sessions",
    label: "Sessions",
    icon: <CalendarOutlined style={{ fontSize: 22 }} />,
    activeIcon: <CalendarFilled style={{ fontSize: 22 }} />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
      {/* frosted glass bar */}
      <div className="flex items-stretch border-t border-zinc-200/60 bg-white/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 no-underline transition-colors"
            >
              <span
                className={`transition-colors ${isActive ? "text-indigo-600" : "text-zinc-400"}`}
              >
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span
                className={`text-[10px] leading-tight font-medium transition-colors ${
                  isActive ? "text-indigo-600" : "text-zinc-400"
                }`}
              >
                {tab.label}
              </span>
              {/* active indicator dot */}
              {isActive && (
                <span className="absolute -top-px left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
