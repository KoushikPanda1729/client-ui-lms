import React from "react";
import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Courses", href: "/courses" },
      { label: "Speaking Partners", href: "/partners" },
      { label: "Pricing", href: "#" },
      { label: "Mobile App", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Community", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "API Docs", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      {/* ── Mobile layout ── */}
      <div className="px-5 pt-8 pb-6 md:hidden">
        {/* Brand row */}
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
            S
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Speak<span className="gradient-text">Easy</span>
          </span>
        </div>

        {/* 3-column links */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-5">
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                {section.title}
              </p>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-500 no-underline transition-colors hover:text-zinc-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          &copy; {new Date().getFullYear()} SpeakEasy. All rights reserved.
        </p>
      </div>

      {/* ── Desktop layout ── */}
      <div className="mx-auto hidden max-w-6xl px-6 py-16 md:block">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5 no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900">
                Speak<span className="gradient-text">Easy</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Master English through interactive courses and live speaking practice with real
              partners.
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 no-underline transition-colors hover:text-zinc-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-6 text-center">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} SpeakEasy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
