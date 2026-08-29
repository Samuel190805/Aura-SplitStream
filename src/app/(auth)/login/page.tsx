"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrorMsg("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 relative">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-apple-blue/15 dark:bg-apple-blue/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <Card variant="glass" className="w-full max-w-md p-8 sm:p-10 shadow-apple dark:shadow-apple-dark">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-apple-blue mx-auto flex items-center justify-center text-white shadow-apple mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Sign in to SplitStream.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
            Access your processed jobs, stems, and media archive.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-neutral-400" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-neutral-400" />}
            required
          />

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2 shadow-apple">
            Sign In <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-200/60 dark:border-white/5 text-center text-xs text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-apple-blue font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </Card>
    </div>
  );
}
