"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Mic,
  BarChart2,
  Building2,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Target,
  Users,
  TrendingUp,
  Play,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI Memory System",
    description:
      "The AI remembers your past answers and adapts questions to target your weak spots progressively.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Star,
    title: "STAR Scoring",
    description:
      "Every answer scored across Situation, Task, Action, Result dimensions with detailed feedback.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Mic,
    title: "Voice Mode",
    description:
      "Practice speaking your answers out loud. Transcript + waveform playback for self-review.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Building2,
    title: "Company Mode",
    description:
      "Practice with company-specific question banks for Google, Amazon, Meta, Apple, and 200+ more.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Track your score trajectory, topic coverage heatmap, and streak. See exactly where to focus.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: DollarSign,
    title: "Salary Negotiation",
    description:
      "AI recruiter roleplay to practice negotiation tactics and get a better offer in real interviews.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const steps = [
  {
    number: "01",
    title: "Set Your Target",
    description: "Choose role, company, experience level, and interview mode.",
  },
  {
    number: "02",
    title: "Practice with AI",
    description: "Answer AI-generated questions. Type or speak your answers.",
  },
  {
    number: "03",
    title: "Get Scored & Improve",
    description: "Receive STAR breakdown, detailed feedback, and track growth.",
  },
];

const plans = [
  {
    name: "Free",
    price: 0,
    interval: "forever",
    features: [
      "5 sessions per month",
      "STAR scoring",
      "Basic feedback",
      "Progress tracking",
      "Daily question",
    ],
    cta: "Get Started",
    href: "/signup",
    featured: false,
  },
  {
    name: "Pro",
    price: 19,
    interval: "month",
    features: [
      "Unlimited sessions",
      "Voice mode",
      "Company question banks",
      "Recording & playback",
      "Salary negotiation",
      "Shareable report cards",
      "Priority AI",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Team",
    price: 49,
    interval: "month",
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "Team analytics",
      "Admin dashboard",
      "Custom question banks",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/signup?plan=team",
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Brain className="h-4.5 w-4.5 text-white" size={18} />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                IntervAI
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="gradient" size="sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="indigo" className="mb-6 px-4 py-1.5 text-sm">
              <Zap size={12} className="mr-1" />
              Powered by GPT-4 · STAR Framework
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          >
            Ace Every Interview with{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              AI-Powered Practice
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Practice behavioral and technical interviews with an AI that remembers your
            answers, scores with STAR methodology, and gives actionable feedback to land
            your dream job.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/signup">
              <Button variant="gradient" size="xl" className="w-full sm:w-auto gap-2">
                Start Practicing Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto gap-2 border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <Play size={16} />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-zinc-600"
          >
            No credit card required · Free plan available
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: "50K+", label: "Interviews" },
              { value: "4.9★", label: "Rating" },
              { value: "89%", label: "Got Hired" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-100">How It Works</h2>
            <p className="mt-3 text-zinc-500">
              Start improving in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <Card className="border-zinc-800 bg-zinc-900/50 h-full">
                  <CardContent className="p-6">
                    <div className="text-4xl font-bold text-zinc-800 mb-3">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight size={20} className="text-zinc-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-100">
              Everything You Need to Succeed
            </h2>
            <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
              Built for engineering, product, and business candidates at every level
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors h-full">
                  <CardContent className="p-5">
                    <div className={`inline-flex p-2.5 rounded-lg ${feature.bg} mb-3`}>
                      <feature.icon size={20} className={feature.color} />
                    </div>
                    <h3 className="font-semibold text-zinc-100 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-zinc-100">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 text-zinc-500">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`h-full relative ${
                    plan.featured
                      ? "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
                      : "border-zinc-800"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="indigo" className="px-3 py-0.5">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-zinc-100">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold text-zinc-100">
                          {plan.price === 0 ? "Free" : `$${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-zinc-500">
                            /{plan.interval}
                          </span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2
                            size={14}
                            className={
                              plan.featured ? "text-indigo-400" : "text-green-500"
                            }
                          />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={plan.href} className="block">
                      <Button
                        variant={plan.featured ? "gradient" : "outline"}
                        className={`w-full ${
                          !plan.featured
                            ? "border-zinc-700 text-zinc-300 hover:text-zinc-100"
                            : ""
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-10"
          >
            <Brain size={40} className="text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-zinc-100 mb-3">
              Ready to ace your next interview?
            </h2>
            <p className="text-zinc-400 mb-6">
              Join thousands of candidates who improved their interview performance
              with IntervAI.
            </p>
            <Link href="/signup">
              <Button variant="gradient" size="xl" className="gap-2">
                Start for Free
                <ArrowRight size={18} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-violet-600">
              <Brain size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">IntervAI</span>
          </div>
          <p className="text-xs text-zinc-600">
            © 2025 IntervAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
