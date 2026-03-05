import api from "@/lib/api";

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "other", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export interface MyReport {
  id: string;
  sessionId: string | null;
  reportedId: string;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  adminNote: string | null;
  createdAt: string;
}

export const reportService = {
  async submitReport(dto: {
    reportedId: string;
    sessionId?: string;
    reason: ReportReason;
    description?: string;
  }): Promise<void> {
    await api.post("/reports", dto);
  },

  async getMyReports(page = 1, limit = 10): Promise<{ reports: MyReport[]; total: number }> {
    const { data } = await api.get("/reports/mine", { params: { page, limit } });
    return data.data;
  },
};
