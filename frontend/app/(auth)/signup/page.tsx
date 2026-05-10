"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Brain, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";
import { parseApiError } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const benefits = [
  "5 free sessions every month",
  "STAR scoring on every answer",
  "Progress tracking & analytics",
  "Daily interview question",
];

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signup } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data.name, data.email, data.password);
      toast.success("Account created! Let's get started 🎉");
      router.push("/dashboard");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Benefits panel */}
          <div className="hidden lg:flex flex-col justify-center p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <Brain size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">IntervAI</span>
            </div>

            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              Start your interview journey
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Join thousands of candidates who improved their interview performance.
            </p>

            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-8">
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <Brain size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">IntervAI</span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zinc-100">Create account</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Free to start, no credit card needed
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  {...register("name")}
                  className={errors.name ? "border-red-500/50" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className={errors.email ? "border-red-500/50" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`pr-10 ${errors.password ? "border-red-500/50" : ""}`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength bars */}
                {password && (
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength
                            ? passwordStrength === 1
                              ? "bg-red-500"
                              : passwordStrength === 2
                              ? "bg-orange-500"
                              : passwordStrength === 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            : "bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500/50" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full gap-2"
                loading={isSubmitting}
              >
                Create Account
                <ArrowRight size={16} />
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-3 text-center text-xs text-zinc-700">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
