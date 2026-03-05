"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Rate, Spin, Pagination } from "antd";
import { ClockCircleOutlined, StarOutlined, PhoneFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/contexts/AuthContext";
import { sessionService, type SessionHistory, type SessionRating } from "@/lib/services/session";

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

// ─── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  myId,
  onRated,
}: {
  session: SessionHistory;
  myId: string;
  onRated: (sessionId: string, rating: SessionRating) => void;
}) {
  const [showRateModal, setShowRateModal] = useState(false);

  const partner = getPartner(session, myId);
  const partnerName = getPartnerLabel(partner);
  const ratings = session.ratings ?? [];
  const myRating = ratings.find((r) => r.raterId === myId);
  const theirRating = ratings.find((r) => r.ratedId === myId);
  const canRate = !!session.endedAt && !myRating;
  const color = avatarColor(partnerName);

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
      <div className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        {/* Top: partner info */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-sm ${color}`}
            >
              {getInitials(partnerName)}
            </div>
            <div>
              <p className="font-semibold text-zinc-900">{partnerName}</p>
              <p className="text-xs text-zinc-400">{partner?.email}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs font-medium text-zinc-500">
              {dayjs(session.startedAt).format("DD MMM YYYY")}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              {formatDuration(session.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          {session.level ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 capitalize">
              {session.level}
            </span>
          ) : null}
          {session.topic ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
              {session.topic}
            </span>
          ) : null}
          {!session.endedAt && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          )}
          {session.endedAt && (
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-400">
              <PhoneFilled style={{ fontSize: 10 }} />
              Ended {dayjs(session.endedAt).fromNow()}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-zinc-100" />

        {/* Ratings section */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex gap-6">
            {/* You rated */}
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                You rated
              </p>
              {myRating ? (
                <div>
                  <Rate disabled value={myRating.stars} style={{ fontSize: 13 }} />
                  {myRating.feedback && (
                    <p className="mt-1 max-w-[160px] truncate text-xs text-zinc-400 italic">
                      &ldquo;{myRating.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-300">—</span>
              )}
            </div>

            {/* They rated */}
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                They rated
              </p>
              {theirRating ? (
                <div>
                  <Rate disabled value={theirRating.stars} style={{ fontSize: 13 }} />
                  {theirRating.feedback && (
                    <p className="mt-1 max-w-[160px] truncate text-xs text-zinc-400 italic">
                      &ldquo;{theirRating.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-300">—</span>
              )}
            </div>
          </div>

          {/* Rate CTA */}
          {canRate && (
            <button
              onClick={() => setShowRateModal(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/25 transition hover:opacity-90 active:scale-95"
            >
              <StarOutlined />
              Rate
            </button>
          )}
        </div>
      </div>

      {showRateModal && (
        <RateModal
          partnerName={partnerName}
          onSubmit={handleSubmitRating}
          onSkip={() => setShowRateModal(false)}
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
  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const res = await sessionService.getHistory(pg, PAGE_SIZE);
      setSessions(res.sessions);
      setTotal(res.total);
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

  return (
    <div className="min-h-screen bg-zinc-50/60 py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Sessions</h1>
            <p className="mt-1 text-sm text-zinc-500">Your practice history with ratings</p>
          </div>
          <Link
            href="/partners"
            className="hidden rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-lg shadow-indigo-500/25 transition hover:opacity-90 sm:flex"
          >
            + New Session
          </Link>
        </div>

        {/* Stats strip */}
        {!loading && sessions.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: total, emoji: "🎙️" },
              { label: "Completed", value: ended.length, emoji: "✅" },
              { label: "Rated", value: rated.length, emoji: "⭐" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-2xl border border-zinc-100 bg-white py-4 shadow-sm"
              >
                <span className="mb-1 text-xl">{s.emoji}</span>
                <span className="text-xl font-bold text-zinc-900">{s.value}</span>
                <span className="text-[11px] text-zinc-400">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-zinc-100 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 text-4xl">
              🎙️
            </div>
            <p className="text-base font-semibold text-zinc-800">No sessions yet</p>
            <p className="mt-1 text-sm text-zinc-400">Find a partner and start practicing</p>
            <Link
              href="/partners"
              className="mt-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white no-underline shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
            >
              Find a Partner
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} myId={user!.id} onRated={handleRated} />
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
