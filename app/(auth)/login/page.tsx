"use client";

import React, { useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, Divider, Form, Input, message, Spin } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "@/lib/services/auth";
import { useAuth } from "@/contexts/AuthContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="mr-2">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (values: { email: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      const user = await authService.login(values.email, values.password);
      setUser(user);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid credentials";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const user = await authService.googleSignIn(idToken);
      setUser(user);
      router.replace(redirectTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Google sign-in failed";
      messageApi.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    const btn = googleBtnRef.current?.querySelector<HTMLElement>('[role="button"]');
    if (btn) {
      btn.click();
    } else {
      messageApi.error("Google Sign-In not ready, please try again");
    }
  };

  return (
    <>
      {contextHolder}

      {/* Mobile logo — only visible on small screens */}
      <div className="mb-8 text-center lg:hidden">
        <Link href="/" className="inline-flex items-center gap-2 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span className="text-xl font-bold text-zinc-900">
            Speak<span className="gradient-text">Easy</span>
          </span>
        </Link>
      </div>

      <div>
        <h1 className="mb-1 text-2xl font-bold text-zinc-900">Welcome back</h1>
        <p className="mb-7 text-sm text-zinc-500">Log in to continue your learning journey</p>

        {/* Hidden GoogleLogin button (uses popup, no third-party cookies needed) */}
        <div
          ref={googleBtnRef}
          style={{ position: "absolute", opacity: 0, height: 0, overflow: "hidden" }}
        >
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                handleGoogleSuccess(credentialResponse.credential);
              }
            }}
            onError={() => messageApi.error("Google sign-in failed")}
          />
        </div>

        {/* Google button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={triggerGoogleLogin}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        <Divider className="text-xs text-zinc-400">or</Divider>

        {/* Login form */}
        <Form
          layout="vertical"
          size="large"
          requiredMark={false}
          onFinish={handleLogin}
          initialValues={{ remember: true }}
        >
          <Form.Item
            label={<span className="text-sm font-medium text-zinc-700">Email</span>}
            name="email"
            rules={[{ required: true, type: "email", message: "Enter a valid email" }]}
          >
            <Input
              prefix={<MailOutlined className="text-zinc-400" />}
              placeholder="you@example.com"
              className="rounded-xl"
            />
          </Form.Item>
          <Form.Item
            label={<span className="text-sm font-medium text-zinc-700">Password</span>}
            name="password"
            rules={[{ required: true, message: "Enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-zinc-400" />}
              placeholder="Enter your password"
              className="rounded-xl"
            />
          </Form.Item>

          <div className="mb-5 flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox className="text-sm text-zinc-600">Remember me</Checkbox>
            </Form.Item>
            <Link
              href="#"
              className="text-sm font-medium text-indigo-600 no-underline hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            className="h-11 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25"
          >
            Log In
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 no-underline hover:text-indigo-500"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
