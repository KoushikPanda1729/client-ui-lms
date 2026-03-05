import api from "@/lib/api";

export interface SessionUser {
  id: string;
  email: string;
  profile?: { displayName: string | null; avatarUrl?: string | null } | null;
}

export interface SessionRating {
  id: string;
  raterId: string;
  ratedId: string;
  stars: number;
  feedback: string | null;
  createdAt: string;
  rater?: SessionUser;
  rated?: SessionUser;
}

export interface SessionHistory {
  id: string;
  roomId: string;
  userAId: string;
  userBId: string;
  userA?: SessionUser;
  userB?: SessionUser;
  topic: string | null;
  level: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  ratings?: SessionRating[];
}

export const sessionService = {
  async getByRoom(roomId: string): Promise<{ id: string; endedAt: string | null }> {
    const { data } = await api.get(`/sessions/by-room/${encodeURIComponent(roomId)}`);
    return data.data;
  },

  async getHistory(
    page = 1,
    limit = 20,
  ): Promise<{ sessions: SessionHistory[]; total: number; page: number; limit: number }> {
    const { data } = await api.get("/sessions", { params: { page, limit } });
    return data.data;
  },

  async rate(sessionId: string, stars: number, feedback?: string): Promise<void> {
    await api.post(`/sessions/${sessionId}/rate`, { stars, feedback: feedback || null });
  },
};
