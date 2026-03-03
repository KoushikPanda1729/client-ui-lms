import api from "@/lib/api";

export interface UserProfile {
  userId: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  nativeLanguage: string | null;
  englishLevel: "beginner" | "elementary" | "intermediate" | "advanced" | null;
  learningGoal: string | null;
  country: string | null;
  timezone: string | null;
  totalSessions: number;
  totalPracticeMins: number;
  streakDays: number;
  lastSessionAt: string | null;
  onboardingCompleted: boolean;
}

export interface UpdateProfilePayload {
  username?: string;
  displayName?: string;
  bio?: string;
  nativeLanguage?: string;
  englishLevel?: "beginner" | "elementary" | "intermediate" | "advanced";
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

  async uploadAvatar(file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as UserProfile;
  },

  async deleteAvatar(): Promise<UserProfile> {
    const { data } = await api.delete("/users/me/avatar");
    return data.data as UserProfile;
  },
};
