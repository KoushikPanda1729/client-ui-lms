"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Rate, Spin, Pagination } from "antd";
import { ClockCircleOutlined, StarOutlined, StarFilled, PhoneOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/contexts/AuthContext";
import { sessionService, type SessionHistory, type SessionRating } from "@/lib/services/session";
import {
  reportService,
  REPORT_REASONS,
  type ReportReason,
  type MyReport,
} from "@/lib/services/report";

dayjs.extend(relativeTime);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs: number | null): string {
  if (!secs) return "—";
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function getPartner(session: SessionHistory, myId: string): SessionHistory["userA"] {
  return session.userAId === myId ? session.userB : session.userA;
}

function getPartnerLabel(user: SessionHistory["userA"]): string {
  if (!user) return "Unknown";
  return user.profile?.displayName || user.email.split("@")[0];
}

function getInitials(label: string): string {
  return label.charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-teal-500 to-cyan-600",
  "from-emerald-500 to-green-600",
];

function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Rate Modal ────────────────────────────────────────────────────────────────

function RateModal({
  partnerName,
  onSubmit,
  onSkip,
}: {
  partnerName: string;
  onSubmit: (stars: number, feedback: string) => Promise<void>;
  onSkip: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  const handleSubmit = async () => {
    if (stars === 0) return;
    setLoading(true);
    await onSubmit(stars, feedback);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-5 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
            {getInitials(partnerName)}
          </div>
          <p className="text-sm font-semibold text-white">{partnerName}</p>
          <p className="text-xs text-white/70">How was your conversation?</p>
        </div>

        <div className="p-6">
          {/* Stars */}
          <div className="mb-2 flex justify-center">
            <Rate value={stars} onChange={setStars} style={{ fontSize: 36, gap: 8 }} />
          </div>
          {stars > 0 && (
            <p className="mb-5 text-center text-sm font-semibold text-indigo-600">
              {labels[stars]}
            </p>
          )}
          {stars === 0 && <div className="mb-5" />}

          {/* Feedback */}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share a comment (optional)..."
            maxLength={500}
            rows={3}
            className="mb-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />

          <div className="flex gap-2.5">
            <button
              onClick={onSkip}
              className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-400 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={stars === 0 || loading}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 active:scale-95 disabled:opacity-40"
            >
              {loading ? "Submitting…" : "Submit Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Stars ──────────────────────────────────────────────────────────────

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-px">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarFilled key={n} style={{ fontSize: 11, color: n <= count ? "#facc15" : "#e4e4e7" }} />
      ))}
    </span>
  );
}

// ─── Report Modal ──────────────────────────────────────────────────────────────

function ReportModal({
  partnerName,
  onSubmit,
  onClose,
}: {
  partnerName: string;
  onSubmit: (reason: ReportReason, description: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await onSubmit(reason, description);
    setLoading(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {done ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
              ✅
            </div>
            <p className="text-sm font-semibold text-zinc-800">Report submitted</p>
            <p className="mt-1 text-xs text-zinc-400">
              Our team will review it shortly. Thank you.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-2xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-5 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl">
                🚩
              </div>
              <p className="text-sm font-semibold text-white">Report {partnerName}</p>
              <p className="text-xs text-white/70">Help us keep the community safe</p>
            </div>

            <div className="p-6">
              {/* Reason */}
              <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Reason
              </p>
              <div className="mb-4 flex flex-col gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      reason === r.value
                        ? "border-rose-400 bg-rose-50 text-rose-600"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition ${
                        reason === r.value ? "border-rose-500 bg-rose-500" : "border-zinc-300"
                      }`}
                    />
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details (optional)..."
                maxLength={500}
                rows={2}
                className="mb-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />

              <div className="flex gap-2.5">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-50 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason || loading}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:opacity-90 active:scale-95 disabled:opacity-40"
                >
                  {loading ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Report Status Badge ───────────────────────────────────────────────────────

function ReportStatusBadge({ report }: { report: MyReport }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    reviewed: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dismissed: "bg-zinc-100 text-zinc-400 border-zinc-200",
    actioned: "bg-blue-50 text-blue-600 border-blue-200",
  };
  const statusLabel: Record<string, string> = {
    pending: "Under Review",
    reviewed: "Reviewed",
    dismissed: "Dismissed",
    actioned: "Actioned",
  };
  const cls = statusStyles[report.status] ?? statusStyles.pending;

  return (
    <div className="relative">
      <button
        onClick={() => report.adminNote && setExpanded((e) => !e)}
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${cls} ${report.adminNote ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
        title={report.adminNote ? "Click to see admin response" : undefined}
      >
        {statusLabel[report.status] ?? "Reported"}
        {report.adminNote && <span className="ml-1">·</span>}
        {report.adminNote && <span className="ml-0.5">💬</span>}
      </button>
      {expanded && report.adminNote && (
        <div className="absolute top-full right-0 z-10 mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="mb-1 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            Admin Response
          </p>
          <p className="text-xs text-zinc-600 italic">&ldquo;{report.adminNote}&rdquo;</p>
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  myId,
  onRated,
  existingReport,
}: {
  session: SessionHistory;
  myId: string;
  onRated: (sessionId: string, rating: SessionRating) => void;
  existingReport?: MyReport;
}) {
  const [showRateModal, setShowRateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [localReport, setLocalReport] = useState<MyReport | null>(existingReport ?? null);

  const partner = getPartner(session, myId);
  const partnerName = getPartnerLabel(partner);
  const ratings = session.ratings ?? [];
  const myRating = ratings.find((r) => r.raterId === myId);
  const theirRating = ratings.find((r) => r.ratedId === myId);
  const canRate = !!session.endedAt && !myRating;
  const canReport = !!session.endedAt && !!partner && !localReport;
  const color = avatarColor(partnerName);
  const isLive = !session.endedAt;

  const handleSubmitReport = async (reason: ReportReason, description: string) => {
    await reportService.submitReport({
      reportedId: partner!.id,
      sessionId: session.id,
      reason,
      description: description || undefined,
    });
    setLocalReport({
      id: "",
      sessionId: session.id,
      reportedId: partner!.id,
      reason,
      description: description || null,
      status: "pending",
      adminNote: null,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSubmitRating = async (stars: number, feedback: string) => {
    await sessionService.rate(session.id, stars, feedback || undefined);
    setShowRateModal(false);
    onRated(session.id, {
      id: crypto.randomUUID(),
      raterId: myId,
      ratedId: partner?.id ?? "",
      stars,
      feedback: feedback || null,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <div className="rounded-xl border border-zinc-100 bg-white p-4 transition-shadow hover:shadow-sm sm:p-5">
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${color}`}
            >
              {getInitials(partnerName)}
            </div>
            {isLive && (
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            )}
          </div>

          {/* Name + date */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-zinc-900">{partnerName}</span>
              {session.level && (
                <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-500 capitalize">
                  {session.level}
                </span>
              )}
              {session.topic && (
                <span className="hidden shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 lg:inline">
                  {session.topic}
                </span>
              )}
              {isLive && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              {dayjs(session.startedAt).format("DD MMM, h:mm A")}
              <span className="mx-1 text-zinc-200">·</span>
              <ClockCircleOutlined style={{ fontSize: 10 }} />{" "}
              {formatDuration(session.durationSeconds)}
              {session.endedAt && (
                <>
                  <span className="mx-1 text-zinc-200">·</span>
                  {dayjs(session.endedAt).fromNow()}
                </>
              )}
            </p>
          </div>

          {/* Desktop: inline ratings */}
          <div className="hidden shrink-0 items-center gap-5 lg:flex">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">You:</span>
              {myRating ? (
                <>
                  <Stars count={myRating.stars} />
                  {myRating.feedback && (
                    <span className="max-w-[120px] truncate italic">
                      &ldquo;{myRating.feedback}&rdquo;
                    </span>
                  )}
                </>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">Them:</span>
              {theirRating ? (
                <>
                  <Stars count={theirRating.stars} />
                  {theirRating.feedback && (
                    <span className="max-w-[120px] truncate italic">
                      &ldquo;{theirRating.feedback}&rdquo;
                    </span>
                  )}
                </>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {canRate && (
              <button
                onClick={() => setShowRateModal(true)}
                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
              >
                <StarOutlined className="mr-1" />
                Rate
              </button>
            )}
            {canReport && (
              <button
                onClick={() => setShowReportModal(true)}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-100"
                title="Report this user"
              >
                <svg className="mr-1 inline h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 2 0V9h7.3l-1.6-3L11.3 3H4V2H3zm1 1h6.7l-1.4 2.6 1.4 2.4H4V3z" />
                </svg>
                Report
              </button>
            )}
            {localReport && <ReportStatusBadge report={localReport} />}
          </div>
        </div>

        {/* Mobile: ratings below (only if any rating exists) */}
        {(myRating || theirRating) && (
          <div className="mt-3 flex gap-4 border-t border-zinc-50 pt-3 lg:hidden">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">You:</span>
              {myRating ? (
                <>
                  <Stars count={myRating.stars} />
                  {myRating.feedback && (
                    <span className="max-w-[100px] truncate italic">
                      &ldquo;{myRating.feedback}&rdquo;
                    </span>
                  )}
                </>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">Them:</span>
              {theirRating ? (
                <>
                  <Stars count={theirRating.stars} />
                  {theirRating.feedback && (
                    <span className="max-w-[100px] truncate italic">
                      &ldquo;{theirRating.feedback}&rdquo;
                    </span>
                  )}
                </>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        )}
      </div>

      {showRateModal && (
        <RateModal
          partnerName={partnerName}
          onSubmit={handleSubmitRating}
          onSkip={() => setShowRateModal(false)}
        />
      )}
      {showReportModal && (
        <ReportModal
          partnerName={partnerName}
          onSubmit={handleSubmitReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reportMap, setReportMap] = useState<Map<string, MyReport>>(new Map());
  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const [res, reportsRes] = await Promise.all([
        sessionService.getHistory(pg, PAGE_SIZE),
        reportService.getMyReports(1, 10).catch(() => ({ reports: [], total: 0 })),
      ]);
      setSessions(res.sessions);
      setTotal(res.total);
      const map = new Map<string, MyReport>();
      for (const r of reportsRes.reports) {
        if (r.sessionId) map.set(r.sessionId, r);
      }
      setReportMap(map);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleRated = (sessionId: string, newRating: SessionRating) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, ratings: [...(s.ratings ?? []), newRating] } : s,
      ),
    );
  };

  // Quick stats
  const ended = sessions.filter((s) => !!s.endedAt);
  const rated = sessions.filter((s) => (s.ratings ?? []).some((r) => r.raterId === user!.id));
  const totalMinutes = sessions.reduce(
    (sum, s) => sum + Math.floor((s.durationSeconds ?? 0) / 60),
    0,
  );
  const avgDuration =
    ended.length > 0
      ? Math.round(ended.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / ended.length)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-50/60 py-8 sm:py-12">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Sessions</h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              {total} conversation{total !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/partners"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-indigo-700"
          >
            <PhoneOutlined style={{ fontSize: 13 }} />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Stat cards */}
        {!loading && sessions.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Total Sessions",
                value: total,
                icon: (
                  <svg
                    className="h-5 w-5 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                ),
                color: "text-indigo-600",
              },
              {
                label: "Avg. Duration",
                value: formatDuration(avgDuration),
                icon: <ClockCircleOutlined style={{ fontSize: 18 }} className="text-emerald-400" />,
                color: "text-emerald-600",
              },
              {
                label: "Total Minutes",
                value: totalMinutes,
                icon: (
                  <svg
                    className="h-5 w-5 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                ),
                color: "text-violet-600",
              },
              {
                label: "Sessions Rated",
                value: rated.length,
                icon: <StarOutlined style={{ fontSize: 18 }} className="text-amber-400" />,
                color: "text-amber-600",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-100 bg-white p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                    {stat.label}
                  </p>
                  <div className="rounded-lg bg-zinc-50 p-1.5">{stat.icon}</div>
                </div>
                <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-zinc-100 bg-white py-16 text-center">
            <div className="mb-3 text-4xl">🎙️</div>
            <p className="text-sm font-semibold text-zinc-700">No sessions yet</p>
            <p className="mt-1 text-xs text-zinc-400">Start your first conversation</p>
            <Link
              href="/partners"
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-indigo-700"
            >
              Find a Partner
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {sessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  myId={user!.id}
                  onRated={handleRated}
                  existingReport={reportMap.get(s.id)}
                />
              ))}
            </div>

            {total > PAGE_SIZE && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onChange={(p) => {
                    setPage(p);
                    fetchHistory(p);
                  }}
                  showTotal={(t) => `${t} sessions`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
