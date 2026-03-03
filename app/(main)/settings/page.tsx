"use client";

import { useEffect, useRef, useState } from "react";
import { Form, Input, Select, Button, message, Spin, Avatar, Divider } from "antd";
import {
  UserOutlined,
  CameraOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  FireOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { userService, UserProfile } from "@/lib/services/user";
import { useAuth } from "@/contexts/AuthContext";

const ENGLISH_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LEARNING_GOALS = [
  { value: "fluency", label: "General Fluency" },
  { value: "business", label: "Business English" },
  { value: "travel", label: "Travel & Everyday Life" },
  { value: "exam", label: "Exam Preparation" },
  { value: "academic", label: "Academic English" },
  { value: "interview", label: "Job Interviews" },
];

const LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Azerbaijani",
  "Basque",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Burmese",
  "Catalan",
  "Chinese (Cantonese)",
  "Chinese (Mandarin)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "Estonian",
  "Farsi",
  "Filipino",
  "Finnish",
  "French",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Hausa",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Igbo",
  "Indonesian",
  "Italian",
  "Japanese",
  "Javanese",
  "Kannada",
  "Kazakh",
  "Khmer",
  "Korean",
  "Kurdish",
  "Kyrgyz",
  "Lao",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Malay",
  "Malayalam",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Oromo",
  "Pashto",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Serbian",
  "Sinhalese",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tagalog",
  "Tamil",
  "Telugu",
  "Thai",
  "Tibetan",
  "Turkish",
  "Turkmen",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Yoruba",
  "Zulu",
].map((l) => ({ value: l, label: l }));

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Congo",
  "Croatia",
  "Cuba",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Honduras",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Latvia",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Malaysia",
  "Mexico",
  "Moldova",
  "Mongolia",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Palestine",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zimbabwe",
].map((c) => ({ value: c, label: c }));

const TIMEZONES = [
  { value: "Pacific/Midway", label: "(UTC-11:00) Midway Island" },
  { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(UTC-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "America/Caracas", label: "(UTC-04:30) Caracas" },
  { value: "America/Halifax", label: "(UTC-04:00) Atlantic Time (Canada)" },
  { value: "America/Sao_Paulo", label: "(UTC-03:00) Brasilia" },
  { value: "America/Argentina/Buenos_Aires", label: "(UTC-03:00) Buenos Aires" },
  { value: "Atlantic/South_Georgia", label: "(UTC-02:00) Mid-Atlantic" },
  { value: "Atlantic/Azores", label: "(UTC-01:00) Azores" },
  { value: "Europe/London", label: "(UTC+00:00) London, Dublin, Lisbon" },
  { value: "Europe/Paris", label: "(UTC+01:00) Paris, Berlin, Amsterdam" },
  { value: "Europe/Rome", label: "(UTC+01:00) Rome, Vienna, Warsaw" },
  { value: "Europe/Athens", label: "(UTC+02:00) Athens, Helsinki, Kiev" },
  { value: "Asia/Istanbul", label: "(UTC+03:00) Istanbul, Moscow" },
  { value: "Asia/Tehran", label: "(UTC+03:30) Tehran" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Abu Dhabi, Dubai, Muscat" },
  { value: "Asia/Kabul", label: "(UTC+04:30) Kabul" },
  { value: "Asia/Karachi", label: "(UTC+05:00) Islamabad, Karachi" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
  { value: "Asia/Kathmandu", label: "(UTC+05:45) Kathmandu" },
  { value: "Asia/Dhaka", label: "(UTC+06:00) Dhaka, Almaty" },
  { value: "Asia/Rangoon", label: "(UTC+06:30) Yangon" },
  { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
  { value: "Asia/Shanghai", label: "(UTC+08:00) Beijing, Shanghai, Singapore" },
  { value: "Asia/Seoul", label: "(UTC+09:00) Seoul, Tokyo" },
  { value: "Australia/Adelaide", label: "(UTC+09:30) Adelaide, Darwin" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney, Melbourne, Brisbane" },
  { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland, Wellington" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userService
      .getMe()
      .then((p) => {
        setProfile(p);
        form.setFieldsValue({
          username: p.username ?? "",
          displayName: p.displayName ?? user?.name ?? "",
          bio: p.bio ?? "",
          englishLevel: p.englishLevel ?? undefined,
          nativeLanguage: p.nativeLanguage ?? undefined,
          learningGoal: p.learningGoal ?? undefined,
          country: p.country ?? undefined,
          timezone: p.timezone ?? undefined,
        });
      })
      .catch(() => messageApi.error("Failed to load profile"))
      .finally(() => setLoadingProfile(false));
  }, [form, messageApi, user]);

  const handleSave = async (values: {
    username: string;
    displayName: string;
    bio: string;
    englishLevel: "beginner" | "elementary" | "intermediate" | "advanced";
    nativeLanguage: string;
    learningGoal: string;
    country: string;
    timezone: string;
  }) => {
    setSaving(true);
    try {
      const updated = await userService.updateMe({
        username: values.username || undefined,
        displayName: values.displayName || undefined,
        bio: values.bio || undefined,
        englishLevel: values.englishLevel,
        nativeLanguage: values.nativeLanguage || undefined,
        learningGoal: values.learningGoal || undefined,
        country: values.country || undefined,
        timezone: values.timezone || undefined,
      });
      setProfile(updated);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      messageApi.error("Image must be under 5 MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await userService.uploadAvatar(file);
      setProfile(updated);
      messageApi.success("Avatar updated!");
    } catch {
      messageApi.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    setAvatarUploading(true);
    try {
      const updated = await userService.deleteAvatar();
      setProfile(updated);
      messageApi.success("Avatar removed");
    } catch {
      messageApi.error("Failed to remove avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const displayName = profile?.displayName ?? user?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      {contextHolder}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-400 no-underline hover:text-zinc-700"
          >
            <ArrowLeftOutlined /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your profile, preferences and avatar.</p>
        </div>

        {loadingProfile ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* ── Left column ─────────────────────────────────── */}
            <div className="flex flex-col gap-4 lg:w-64 lg:shrink-0">
              {/* Avatar card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Avatar
                </p>

                {/* Avatar with overlay */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {avatarUploading ? (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100">
                        <LoadingOutlined className="text-2xl text-indigo-500" />
                      </div>
                    ) : (
                      <Avatar
                        size={96}
                        src={profile?.avatarUrl ?? undefined}
                        className="bg-indigo-500 text-xl font-bold"
                      >
                        {!profile?.avatarUrl && initials}
                      </Avatar>
                    )}

                    {/* Camera overlay button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                      title="Upload photo"
                    >
                      <CameraOutlined className="text-xs" />
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="font-semibold text-zinc-800">{displayName}</p>
                    {profile?.username && (
                      <p className="text-sm text-zinc-400">@{profile.username}</p>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <Button
                      block
                      icon={<CameraOutlined />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      Upload Photo
                    </Button>
                    {profile?.avatarUrl && (
                      <Button
                        block
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteAvatar}
                        disabled={avatarUploading}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <p className="text-center text-xs text-zinc-400">JPG, PNG or GIF · max 5 MB</p>
                </div>
              </div>

              {/* Stats card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="mb-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  Stats
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                      <FireOutlined className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-lg leading-none font-bold text-zinc-900">
                        {profile?.streakDays ?? 0}
                      </p>
                      <p className="text-xs text-zinc-400">Day streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                      <VideoCameraOutlined className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-lg leading-none font-bold text-zinc-900">
                        {profile?.totalSessions ?? 0}
                      </p>
                      <p className="text-xs text-zinc-400">Sessions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
                      <ClockCircleOutlined className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-lg leading-none font-bold text-zinc-900">
                        {profile?.totalPracticeMins ?? 0}
                      </p>
                      <p className="text-xs text-zinc-400">Minutes practiced</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right column ─────────────────────────────────── */}
            <div className="flex-1">
              {/* Required fields notice */}
              {(!profile?.username || !profile?.englishLevel) && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <span className="text-base">⚠️</span>
                  <span>
                    <strong>Username</strong> and <strong>English level</strong> are required before
                    you can find speaking partners.
                  </span>
                </div>
              )}

              <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
                {/* ── Public Profile ── */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="mb-5 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                    Public Profile
                  </p>

                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
                      />
                    </Form.Item>

                    <Form.Item
                      name="displayName"
                      label={<span className="font-medium text-zinc-700">Display Name</span>}
                    >
                      <Input placeholder="Your full name" size="large" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="bio"
                    label={<span className="font-medium text-zinc-700">Bio</span>}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Tell others a little about yourself…"
                      maxLength={300}
                      showCount
                    />
                  </Form.Item>
                </div>

                <Divider className="my-0" />

                {/* ── Learning Preferences ── */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="mb-5 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                    Learning Preferences
                  </p>

                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
                      />
                    </Form.Item>

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

                    <Form.Item
                      name="nativeLanguage"
                      label={<span className="font-medium text-zinc-700">Native Language</span>}
                    >
                      <Select
                        showSearch
                        placeholder="Select your native language"
                        size="large"
                        allowClear
                        options={LANGUAGES}
                        filterOption={(input, opt) =>
                          (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      name="country"
                      label={<span className="font-medium text-zinc-700">Country</span>}
                    >
                      <Select
                        showSearch
                        placeholder="Select your country"
                        size="large"
                        allowClear
                        options={COUNTRIES}
                        filterOption={(input, opt) =>
                          (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </div>
                </div>

                <Divider className="my-0" />

                {/* ── Regional ── */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="mb-5 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                    Regional
                  </p>

                  <Form.Item
                    name="timezone"
                    label={<span className="font-medium text-zinc-700">Timezone</span>}
                  >
                    <Select
                      showSearch
                      placeholder="Select your timezone"
                      size="large"
                      allowClear
                      options={TIMEZONES}
                      filterOption={(input, opt) =>
                        (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </div>

                {/* Save button */}
                <div className="mt-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={saving}
                    className="h-12 min-w-40 rounded-xl px-8 text-[15px] font-bold shadow-lg shadow-indigo-500/25"
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
