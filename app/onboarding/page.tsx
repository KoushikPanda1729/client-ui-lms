"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Select, message, Spin } from "antd";
import { CheckCircleOutlined, ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { onboardingService, OnboardingQuestion } from "@/lib/services/onboarding";
import { authService } from "@/lib/services/auth";
import { userService } from "@/lib/services/user";
import { useAuth } from "@/contexts/AuthContext";
import { setOnboardingCookie } from "@/lib/onbCookie";

const { Option } = Select;

const LEARNING_GOALS = [
  { value: "fluency", emoji: "💬", label: "General Fluency", desc: "Speak confidently every day" },
  { value: "business", emoji: "💼", label: "Business English", desc: "Excel at work & meetings" },
  { value: "travel", emoji: "✈️", label: "Travel", desc: "Navigate the world easily" },
  { value: "exam", emoji: "📝", label: "Exam Prep", desc: "Ace IELTS, TOEFL & more" },
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Brazil",
  "Mexico",
  "China",
  "Japan",
  "South Korea",
  "Indonesia",
  "Philippines",
  "Nigeria",
  "Egypt",
  "Other",
];

const LANGUAGES = [
  "Hindi",
  "Spanish",
  "Mandarin",
  "Arabic",
  "Bengali",
  "Portuguese",
  "Russian",
  "Japanese",
  "French",
  "German",
  "Korean",
  "Italian",
  "Tamil",
  "Telugu",
  "Urdu",
  "Vietnamese",
  "Turkish",
  "Persian",
  "Other",
];

const OPTION_LABELS = ["A", "B", "C", "D"];
const STEP_LABELS = ["Location", "Goal", "Level Test"];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [englishLevel, setEnglishLevel] = useState("");
  const [form] = Form.useForm();

  const country = Form.useWatch("country", form);
  const nativeLanguage = Form.useWatch("nativeLanguage", form);
  const learningGoal = Form.useWatch("learningGoal", form);

  const canContinue =
    currentStep === 0 ? !!(country && nativeLanguage) : currentStep === 1 ? !!learningGoal : true;

  const currentQuestion = questions[quizIndex];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  useEffect(() => {
    if (user?.onboardingCompleted) router.replace("/dashboard");
  }, [user, router]);

  useEffect(() => {
    setLoading(true);
    onboardingService
      .getQuestions()
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNext = async () => {
    try {
      if (currentStep < 2) await form.validateFields();
      setCurrentStep((s) => s + 1);
    } catch {
      /* antd shows inline errors */
    }
  };

  const handleSubmit = async () => {
    const values = form.getFieldsValue(true);
    const answerList = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex,
    }));
    const baseName = user?.name || user?.email.split("@")[0] || "user";
    const sanitizedName = baseName.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");
    const idSuffix = (user?.id ?? "").replace(/-/g, "").slice(-5);

    setSubmitting(true);
    try {
      const result = await onboardingService.complete({
        displayName: baseName,
        country: values.country,
        nativeLanguage: values.nativeLanguage,
        learningGoal: values.learningGoal,
        answers: answerList,
      });
      await userService.updateMe({ username: sanitizedName + idSuffix });
      const updated = await authService.self();
      setUser(updated);
      setOnboardingCookie();
      setEnglishLevel(result.englishLevel);
      setCurrentStep(3);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to complete onboarding";
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step content ──────────────────────────────────────────── */

  const stepLocation = (
    <div>
      <div className="mb-4 sm:mb-5">
        <div className="mb-1 text-2xl">🌍</div>
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">Where are you from?</h2>
        <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
          Helps us personalise your experience
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Form.Item
          name="country"
          rules={[{ required: true, message: "Please select your country" }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            size="large"
            placeholder="🏳️  Select your country"
            showSearch
            className="w-full"
            popupClassName="rounded-xl"
          >
            {COUNTRIES.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="nativeLanguage"
          rules={[{ required: true, message: "Please select your language" }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            size="large"
            placeholder="🗣️  Your native language"
            showSearch
            className="w-full"
            popupClassName="rounded-xl"
          >
            {LANGUAGES.map((l) => (
              <Option key={l} value={l}>
                {l}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>
    </div>
  );

  const stepGoal = (
    <div>
      <div className="mb-3 sm:mb-4">
        <div className="mb-1 text-2xl">🎯</div>
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          What&apos;s your learning goal?
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
          We&apos;ll tailor everything around this
        </p>
      </div>
      <Form.Item
        name="learningGoal"
        rules={[{ required: true, message: "Please pick a goal" }]}
        style={{ marginBottom: 0 }}
      >
        <GoalGrid form={form} goals={LEARNING_GOALS} />
      </Form.Item>
    </div>
  );

  const stepQuiz = loading ? (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Spin size="large" />
      <p className="text-sm text-zinc-400">Loading questions…</p>
    </div>
  ) : !questions.length ? (
    <div>
      <div className="mb-1 text-xl">📖</div>
      <h2 className="text-lg font-bold text-zinc-900">English Level Test</h2>
      <p className="mt-1 text-xs text-zinc-500">No questions yet — click Submit to finish.</p>
    </div>
  ) : (
    <div>
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="mb-0.5 text-lg">📖</div>
          <h2 className="text-base font-bold text-zinc-900 sm:text-lg">English Level Test</h2>
          <p className="mt-0.5 text-xs text-zinc-500">No wrong answers — just be honest!</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
          {quizIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${((quizIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3.5 shadow-sm sm:p-4">
          <p className="mb-3 text-sm leading-snug font-semibold text-zinc-900">
            {currentQuestion.question}
          </p>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {currentQuestion.options.map((opt, i) => {
              const selected = answers[currentQuestion.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: i }))}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all duration-200 sm:px-4 sm:py-2.5 ${
                    selected
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    }`}
                  >
                    {OPTION_LABELS[i] ?? i + 1}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question navigation */}
      <div className="mt-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setQuizIndex((i) => Math.max(0, i - 1))}
          disabled={quizIndex === 0}
          className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-30"
        >
          <ArrowLeftOutlined /> Prev
        </button>

        <div className="flex gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setQuizIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === quizIndex
                  ? "w-5 bg-indigo-500"
                  : answers[q.id] !== undefined
                    ? "w-2 bg-indigo-300"
                    : "w-2 bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {quizIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setQuizIndex((i) => i + 1)}
            disabled={answers[currentQuestion?.id] === undefined}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 disabled:opacity-30"
          >
            Next <ArrowRightOutlined />
          </button>
        ) : (
          <span
            className={`text-xs font-medium ${allAnswered ? "text-green-600" : "text-zinc-400"}`}
          >
            {allAnswered ? "✓ Ready!" : "Answer all"}
          </span>
        )}
      </div>
    </div>
  );

  const stepDone = (
    <div className="flex flex-col items-center py-4 text-center sm:py-6">
      <div className="relative mb-4 sm:mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30 sm:h-20 sm:w-20">
          <CheckCircleOutlined className="text-3xl text-white sm:text-4xl" />
        </div>
        <span className="absolute -top-1 -right-1 text-xl sm:text-2xl">🎉</span>
      </div>
      <h2 className="mb-2 text-xl font-bold text-zinc-900 sm:text-2xl">You&apos;re all set!</h2>
      {englishLevel && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5">
          <span className="text-sm text-zinc-500">Your level:</span>
          <span className="font-bold text-indigo-600 capitalize">{englishLevel}</span>
        </div>
      )}
      <p className="mb-6 text-sm text-zinc-500">
        Your profile is ready. Start practising English today.
      </p>
      <Button
        type="primary"
        size="large"
        onClick={() => router.replace("/dashboard")}
        className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 sm:h-12 sm:w-auto sm:px-10"
      >
        Go to Dashboard 🚀
      </Button>
    </div>
  );

  const stepContent = [stepLocation, stepGoal, stepQuiz, stepDone][currentStep] ?? null;

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    // Mobile: fill entire viewport height, flex column
    // Desktop: centre vertically with padding
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50 sm:h-auto sm:min-h-screen sm:justify-center sm:py-4">
      {contextHolder}

      <div className="flex h-full w-full flex-col px-4 sm:mx-auto sm:h-auto sm:max-w-lg">
        {/* ── Logo ── */}
        <div className="shrink-0 pt-8 pb-2 text-center sm:mb-0 sm:pt-0 sm:pb-4">
          <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 sm:mb-2 sm:h-11 sm:w-11">
            S
          </div>
          <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">
            Welcome to Speak
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Easy
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400">Quick setup · 2 minutes</p>
        </div>

        {/* ── Progress pills ── */}
        {currentStep < 3 && (
          <div className="mb-2 flex shrink-0 items-center sm:mb-4">
            {STEP_LABELS.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-7 sm:w-7 ${
                        done
                          ? "bg-indigo-500 text-white"
                          : active
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                            : "bg-zinc-200 text-zinc-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-[10px] font-medium sm:text-xs ${active ? "text-indigo-600" : done ? "text-indigo-400" : "text-zinc-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`mx-1.5 mb-3.5 h-0.5 flex-1 rounded-full transition-all sm:mx-2 sm:mb-4 ${i < currentStep ? "bg-indigo-400" : "bg-zinc-200"}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Card ── fills remaining height on mobile ── */}
        <div className="mb-4 flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-zinc-200/60 backdrop-blur-sm sm:mb-0 sm:flex-none sm:p-5">
          <div className="flex-1 overflow-y-auto">
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ country: "India", nativeLanguage: "Hindi", learningGoal: "fluency" }}
            >
              {stepContent}
            </Form>
          </div>

          {/* ── Navigation ── */}
          {currentStep < 3 && (
            <div className="mt-3 flex shrink-0 items-center gap-2 pt-2 sm:mt-4 sm:gap-3 sm:pt-0">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800 sm:px-4"
                >
                  <ArrowLeftOutlined /> Back
                </button>
              )}

              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canContinue}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue <ArrowRightOutlined />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !allAnswered}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Spin size="small" className="[&_.ant-spin-dot-item]:bg-white" /> Saving…
                    </>
                  ) : (
                    <>Submit &amp; Finish ✓</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Goal grid sub-component ─────────────────────────────────── */
function GoalGrid({
  form,
  goals,
}: {
  form: ReturnType<typeof Form.useForm>[0];
  goals: typeof LEARNING_GOALS;
}) {
  const [selected, setSelected] = useState<string>("fluency");

  const pick = (value: string) => {
    setSelected(value);
    form.setFieldValue("learningGoal", value);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {goals.map((g) => {
        const active = selected === g.value;
        return (
          <button
            key={g.value}
            type="button"
            onClick={() => pick(g.value)}
            className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all duration-200 sm:gap-1.5 sm:p-4 ${
              active
                ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/15"
                : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
            }`}
          >
            <span className="text-xl sm:text-2xl">{g.emoji}</span>
            <span
              className={`text-xs font-semibold sm:text-sm ${active ? "text-indigo-700" : "text-zinc-800"}`}
            >
              {g.label}
            </span>
            <span className="text-[10px] leading-snug text-zinc-400 sm:text-xs">{g.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
