import api from "@/lib/api";

export interface AIPersona {
  id: string;
  name: string;
  avatar: string;
  expertise: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isPremium: boolean;
  usageCount: number;
}

export interface AISession {
  id: string;
  userId: string;
  personaId: string | null;
  provider: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  persona?: AIPersona;
}

export interface StartSessionResult {
  sessionId: string;
  token: string;
  serverUrl: string;
  mode: "webrtc" | "text";
  systemPrompt: string;
}

export const aiConversationService = {
  async listPersonas() {
    const { data } = await api.get("/ai-conversation/personas");
    return data.data as AIPersona[];
  },

  async startSession(personaId: string) {
    const { data } = await api.post(`/ai-conversation/sessions/${personaId}`);
    return data.data as StartSessionResult;
  },

  async sendMessage(personaId: string, messages: { role: "user" | "model"; text: string }[]) {
    const { data } = await api.post("/ai-conversation/message", { personaId, messages });
    return data.data.reply as string;
  },

  async endSession(sessionId: string) {
    const { data } = await api.patch(`/ai-conversation/sessions/${sessionId}/end`);
    return data.data as AISession;
  },

  async getHistory(page = 1, limit = 20) {
    const { data } = await api.get("/ai-conversation/sessions/history", {
      params: { page, limit },
    });
    return data.data as { sessions: AISession[]; total: number };
  },
};
