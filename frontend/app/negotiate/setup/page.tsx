"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, ChevronRight, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { negotiationApi } from "@/lib/api";
import { NegotiationSetup } from "@/types";
import { formatCurrency, parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Equity/RSUs",
  "Signing bonus",
  "Remote work",
  "Health insurance",
  "401k matching",
  "Flexible PTO",
  "Annual bonus",
  "Education budget",
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Flexible recruiter, good outcome likely" },
  { value: "medium", label: "Medium", desc: "Typical negotiation, balanced" },
  { value: "hard", label: "Hard", desc: "Tough recruiter, firm budget" },
];

export default function NegotiationSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);

  const [setup, setSetup] = useState<NegotiationSetup>({
    role: "",
    company: "",
    currentSalary: 100000,
    targetSalary: 130000,
    currency: "USD",
    benefits: [],
    experience: 5,
    difficulty: "medium",
  });

  const update = (key: keyof NegotiationSetup, value: unknown) =>
    setSetup((prev) => ({ ...prev, [key]: value }));

  const toggleBenefit = (benefit: string) => {
    const updated = selectedBenefits.includes(benefit)
      ? selectedBenefits.filter((b) => b !== benefit)
      : [...selectedBenefits, benefit];
    setSelectedBenefits(updated);
    update("benefits", updated);
  };

  const handleCreate = async () => {
    if (!setup.role || !setup.company) {
      toast.error("Please fill in role and company");
      return;
    }

    setIsLoading(true);
    try {
      const response = await negotiationApi.create(setup as unknown as Record<string, unknown>);
      const session = response.data.data || response.data;
      router.push(`/negotiate/session/${session.id}`);
    } catch (error) {
      toast.error(parseApiError(error));
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  <DollarSign size={22} className="text-green-400" />
                  Salary Negotiation
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Practice negotiating with an AI recruiter
                </p>
              </div>

              <div className="space-y-5">
                {/* Role & Company */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <Briefcase size={14} className="text-indigo-400" />
                      Position Details
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Role *</Label>
                        <Input
                          placeholder="Software Engineer"
                          value={setup.role}
                          onChange={(e) => update("role", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company *</Label>
                        <Input
                          placeholder="Google"
                          value={setup.company}
                          onChange={(e) => update("company", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          min={0}
                          max={40}
                          value={setup.experience}
                          onChange={(e) => update("experience", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Currency</Label>
                        <Select
                          value={setup.currency}
                          onValueChange={(v) => update("currency", v)}
                        >
                          <SelectTrigger className="border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary targets */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-5">
                    <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                      <DollarSign size={14} className="text-green-400" />
                      Salary Range
                    </h2>

                    {/* Current salary */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Current/Initial Offer</Label>
                        <span className="text-sm font-bold text-zinc-300">
                          {formatCurrency(setup.currentSalary, setup.currency)}
                        </span>
                      </div>
                      <Slider
                        min={30000}
                        max={500000}
                        step={5000}
                        value={[setup.currentSalary]}
                        onValueChange={(v) => update("currentSalary", v[0])}
                      />
                    </div>

                    {/* Target salary */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Your Target Salary</Label>
                        <span className="text-sm font-bold text-green-400">
                          {formatCurrency(setup.targetSalary, setup.currency)}
                        </span>
                      </div>
                      <Slider
                        min={30000}
                        max={600000}
                        step={5000}
                        value={[setup.targetSalary]}
                        onValueChange={(v) => update("targetSalary", v[0])}
                      />
                      <p className="text-xs text-zinc-600">
                        Increase:{" "}
                        {(
                          ((setup.targetSalary - setup.currentSalary) /
                            setup.currentSalary) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Benefits to Negotiate
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {BENEFITS.map((benefit) => (
                        <button
                          key={benefit}
                          onClick={() => toggleBenefit(benefit)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs border transition-colors",
                            selectedBenefits.includes(benefit)
                              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                              : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                          )}
                        >
                          {benefit}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Difficulty */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      Recruiter Difficulty
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map(({ value, label, desc }) => (
                        <button
                          key={value}
                          onClick={() => update("difficulty", value)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all",
                            setup.difficulty === value
                              ? "border-indigo-500 bg-indigo-500/10"
                              : "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <p className="text-sm font-medium text-zinc-200">{label}</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleCreate}
                  disabled={!setup.role || !setup.company || isLoading}
                  loading={isLoading}
                  variant="gradient"
                  size="xl"
                  className="w-full gap-2"
                >
                  Start Negotiation
                  <ChevronRight size={18} />
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
