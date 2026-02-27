import api from "@/lib/api";

export interface UserProfile {
  userId: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  nativeLanguage: string | null;
  englishLevel: "beginner" | "intermediate" | "advanced" | null;
  learningGoal: string | null;
  country: string | null;
  timezone: string | null;
  totalSessions: number;
  totalPracticeMins: number;
  streak: number;
}

export interface UpdateProfilePayload {
  username?: string;
  displayName?: string;
  bio?: string;
  nativeLanguage?: string;
  englishLevel?: "beginner" | "intermediate" | "advanced";
  learningGoal?: string;
  country?: string;
  timezone?: string;
}

export const userService = {
  async getMe(): Promise<UserProfile> {
    const { data } = await api.get("/users/me");
    return data.data as UserProfile;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await api.patch("/users/me", payload);
    return data.data as UserProfile;
  },
};
