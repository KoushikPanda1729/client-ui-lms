"use client";

import { useEffect, useState } from "react";
import { Form, Input, Select, Button, message, Spin } from "antd";
import { UserOutlined, GlobalOutlined, BookOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { userService, UserProfile } from "@/lib/services/user";
import { useAuth } from "@/contexts/AuthContext";

const ENGLISH_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LEARNING_GOALS = [
  { value: "fluency", label: "General Fluency" },
  { value: "business", label: "Business English" },
  { value: "travel", label: "Travel & Everyday Life" },
  { value: "exam", label: "Exam Preparation" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const { user } = useAuth();

  useEffect(() => {
    userService
      .getMe()
      .then((p) => {
        setProfile(p);
        form.setFieldsValue({
          username: p.username || "",
          displayName: p.displayName || user?.name || "",
          bio: p.bio || "",
          englishLevel: p.englishLevel || undefined,
          nativeLanguage: p.nativeLanguage || "",
          learningGoal: p.learningGoal || undefined,
          country: p.country || "",
        });
      })
      .catch(() => messageApi.error("Failed to load profile"))
      .finally(() => setLoadingProfile(false));
  }, [form, messageApi, user]);

  const handleSave = async (values: {
    username: string;
    displayName: string;
    bio: string;
    englishLevel: "beginner" | "intermediate" | "advanced";
    nativeLanguage: string;
    learningGoal: string;
    country: string;
  }) => {
    setSaving(true);
    try {
      await userService.updateMe({
        username: values.username || undefined,
        displayName: values.displayName || undefined,
        bio: values.bio || undefined,
        englishLevel: values.englishLevel,
        nativeLanguage: values.nativeLanguage || undefined,
        learningGoal: values.learningGoal || undefined,
        country: values.country || undefined,
      });
      messageApi.success("Profile saved!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save profile";
      messageApi.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10">
      {contextHolder}
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 no-underline hover:text-zinc-700"
          >
            <ArrowLeftOutlined /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Set your username and English level to start practicing with partners.
          </p>

          {/* Required badge */}
          {(!profile?.username || !profile?.englishLevel) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Username</strong> and <strong>English level</strong> are required before you
                can find speaking partners.
              </span>
            </div>
          )}
        </div>

        {loadingProfile ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
              {/* Username */}
              <Form.Item
                name="username"
                label={
                  <span className="font-medium text-zinc-700">
                    Username <span className="text-red-500">*</span>
                  </span>
                }
                rules={[
                  { required: true, message: "Username is required" },
                  { min: 3, message: "Minimum 3 characters" },
                  {
                    pattern: /^[a-zA-Z0-9_]+$/,
                    message: "Letters, numbers, underscores only",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-zinc-400" />}
                  placeholder="e.g. john_doe"
                  size="large"
                  className="rounded-xl"
                />
              </Form.Item>

              {/* Display Name */}
              <Form.Item
                name="displayName"
                label={<span className="font-medium text-zinc-700">Display Name</span>}
              >
                <Input placeholder="Your full name" size="large" className="rounded-xl" />
              </Form.Item>

              {/* English Level */}
              <Form.Item
                name="englishLevel"
                label={
                  <span className="font-medium text-zinc-700">
                    English Level <span className="text-red-500">*</span>
                  </span>
                }
                rules={[{ required: true, message: "Please select your English level" }]}
              >
                <Select
                  placeholder="Select your level"
                  size="large"
                  options={ENGLISH_LEVELS}
                  className="w-full"
                />
              </Form.Item>

              {/* Learning Goal */}
              <Form.Item
                name="learningGoal"
                label={<span className="font-medium text-zinc-700">Learning Goal</span>}
              >
                <Select
                  placeholder="What do you want to improve?"
                  size="large"
                  allowClear
                  options={LEARNING_GOALS}
                />
              </Form.Item>

              {/* Native Language */}
              <Form.Item
                name="nativeLanguage"
                label={<span className="font-medium text-zinc-700">Native Language</span>}
              >
                <Input
                  prefix={<BookOutlined className="text-zinc-400" />}
                  placeholder="e.g. Hindi, Spanish, Japanese"
                  size="large"
                  className="rounded-xl"
                />
              </Form.Item>

              {/* Country */}
              <Form.Item
                name="country"
                label={<span className="font-medium text-zinc-700">Country</span>}
              >
                <Input
                  prefix={<GlobalOutlined className="text-zinc-400" />}
                  placeholder="e.g. India"
                  size="large"
                  className="rounded-xl"
                />
              </Form.Item>

              {/* Bio */}
              <Form.Item name="bio" label={<span className="font-medium text-zinc-700">Bio</span>}>
                <Input.TextArea
                  rows={3}
                  placeholder="Tell others about yourself..."
                  className="rounded-xl"
                  maxLength={300}
                  showCount
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={saving}
                className="h-12 rounded-xl text-[15px] font-bold shadow-lg shadow-indigo-500/25"
              >
                Save Profile
              </Button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
