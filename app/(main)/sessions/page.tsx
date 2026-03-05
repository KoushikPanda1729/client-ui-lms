"use client";

import { useCallback, useEffect, useState } from "react";
import { Rate, Spin, Pagination } from "antd";
import { ClockCircleOutlined, CalendarOutlined, StarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { sessionService, type SessionHistory, type SessionRating } from "@/lib/services/session";

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
  return user.profile?.displayName || user.email;
}

// ─── Inline Rating Modal ───────────────────────────────────────────────────────

function RateModal({
  onSubmit,
  onSkip,
}: {
  onSubmit: (stars: number, feedback: string) => Promise<void>;
  onSkip: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) return;
    setLoading(true);
    await onSubmit(stars, feedback);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <p className="mb-1 text-lg font-bold text-zinc-900">Rate this session</p>
        <p className="mb-5 text-sm text-zinc-400">How was your conversation partner?</p>

        <div className="mb-5 flex justify-center">
          <Rate value={stars} onChange={setStars} style={{ fontSize: 32 }} />
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Leave a comment (optional)..."
          maxLength={500}
          rows={3}
          className="mb-4 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-zinc-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={stars === 0 || loading}
            className="flex-1 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:opacity-40"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
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
  const ratings = session.ratings ?? [];
  const myRating = ratings.find((r) => r.raterId === myId);
  const theirRating = ratings.find((r) => r.ratedId === myId);
  const canRate = !!session.endedAt && !myRating;

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
      <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:shadow-md">
        {/* Top row: partner + meta */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow">
              {getPartnerLabel(partner).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-zinc-900">{getPartnerLabel(partner)}</p>
              <p className="text-xs text-zinc-400">{partner?.email}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <CalendarOutlined />
              {dayjs(session.startedAt).format("DD MMM YYYY")}
            </span>
            <span className="flex items-center gap-1">
              <ClockCircleOutlined />
              {formatDuration(session.durationSeconds)}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {session.level && (
            <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-600 capitalize">
              {session.level}
            </span>
          )}
          {session.topic && (
            <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-500">
              {session.topic}
            </span>
          )}
          {!session.endedAt && (
            <span className="rounded-full bg-green-50 px-3 py-0.5 text-xs font-medium text-green-600">
              Ongoing
            </span>
          )}
        </div>

        {/* Ratings row */}
        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <div className="flex gap-6">
            {/* My rating */}
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                You rated
              </p>
              {myRating ? (
                <div>
                  <Rate disabled value={myRating.stars} style={{ fontSize: 14 }} />
                  {myRating.feedback && (
                    <p className="mt-0.5 text-xs text-zinc-400 italic">
                      &ldquo;{myRating.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-300">Not rated</span>
              )}
            </div>

            {/* Their rating */}
            <div>
              <p className="mb-1 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                They rated you
              </p>
              {theirRating ? (
                <div>
                  <Rate disabled value={theirRating.stars} style={{ fontSize: 14 }} />
                  {theirRating.feedback && (
                    <p className="mt-0.5 text-xs text-zinc-400 italic">
                      &ldquo;{theirRating.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-300">Not rated</span>
              )}
            </div>
          </div>

          {/* Rate button */}
          {canRate && (
            <button
              onClick={() => setShowRateModal(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-95"
            >
              <StarOutlined />
              Rate
            </button>
          )}
        </div>
      </div>

      {showRateModal && (
        <RateModal onSubmit={handleSubmitRating} onSkip={() => setShowRateModal(false)} />
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
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-zinc-900">My Sessions</h1>
        <p className="text-sm text-zinc-400">
          Your past conversations — ratings given and received
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
            🎙️
          </div>
          <p className="text-base font-semibold text-zinc-700">No sessions yet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Start a conversation to see your history here
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
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
  );
}
