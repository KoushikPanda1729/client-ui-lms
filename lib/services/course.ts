import api from "@/lib/api";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  isPremium: boolean;
  price: number; // smallest currency unit (paise/cents)
  isPublished: boolean;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
  enrollment?: {
    completedLessons: number;
    progressPercent: number;
    completedAt: string | null;
    enrolledAt: string;
  } | null;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: "video" | "pdf" | "text" | "quiz";
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  order: number;
  durationMinutes: number | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multiple";
  order: number;
  options: { id: string; text: string }[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
}

export const courseService = {
  async list(params?: {
    level?: string;
    isPremium?: boolean;
    page?: number;
    limit?: number;
  }): Promise<CoursesResponse> {
    const res = await api.get("/courses", { params });
    return res.data.data;
  },

  async getCourse(id: string): Promise<CourseDetail> {
    const res = await api.get(`/courses/${id}`);
    return res.data.data;
  },

  async getMyCourses(params?: { page?: number; limit?: number }): Promise<CoursesResponse> {
    const res = await api.get("/courses/my", { params });
    return res.data.data;
  },

  async enroll(id: string): Promise<void> {
    await api.post(`/courses/${id}/enroll`);
  },

  async getLesson(courseId: string, lessonId: string): Promise<Lesson> {
    const res = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
    return res.data.data;
  },

  async completeLesson(
    courseId: string,
    lessonId: string,
  ): Promise<{ completedLessons: number; progressPercent: number }> {
    const res = await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
    return res.data.data;
  },

  async getQuiz(courseId: string, lessonId: string): Promise<Quiz> {
    const res = await api.get(`/courses/${courseId}/lessons/${lessonId}/quiz`);
    return res.data.data;
  },

  async submitQuiz(
    courseId: string,
    lessonId: string,
    answers: { questionId: string; selectedOptionIds: string[] }[],
  ): Promise<QuizResult> {
    const res = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz/submit`, {
      answers,
    });
    return res.data.data;
  },

  async getAvailableCoupons(
    courseId: string,
  ): Promise<{ code: string; discountPercent: number; expiresAt: string | null }[]> {
    const res = await api.get(`/payments/courses/${courseId}/coupons`);
    return res.data.data;
  },

  async getPriceQuote(
    courseId: string,
    couponCode?: string,
  ): Promise<{
    priceToken: string;
    price: number;
    originalPrice: number;
    discountPercent: number | null;
    discountAmount: number;
    currency: string;
    expiresIn: number;
  }> {
    const params = couponCode ? { coupon: couponCode } : undefined;
    const res = await api.get(`/payments/courses/${courseId}/quote`, { params });
    return res.data.data;
  },

  async createCheckout(
    courseId: string,
    priceToken: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const idempotencyKey = crypto.randomUUID();
    const res = await api.post(
      `/payments/courses/${courseId}/checkout`,
      { priceToken },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    return res.data.data;
  },
};
