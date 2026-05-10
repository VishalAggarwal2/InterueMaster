"use client";

import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NegotiationOutcomeReport } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { getColorByScore } from "@/lib/utils";

interface OutcomeReportProps {
  report: NegotiationOutcomeReport;
  currency?: string;
}

function OutcomeIcon({ outcome }: { outcome: NegotiationOutcomeReport["outcome"] }) {
  switch (outcome) {
    case "accepted":
      return <CheckCircle2 className="text-green-400" size={20} />;
    case "rejected":
      return <XCircle className="text-red-400" size={20} />;
    default:
      return <AlertCircle className="text-yellow-400" size={20} />;
  }
}

export default function OutcomeReport({ report, currency = "USD" }: OutcomeReportProps) {
  const improvement = report.finalOffer - report.initialOffer;
  const improvementPct = ((improvement / report.initialOffer) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Outcome header */}
      <Card className="border-zinc-800">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <OutcomeIcon outcome={report.outcome} />
            <div>
              <h2 className="text-lg font-bold text-zinc-100 capitalize">
                Offer {report.outcome}
              </h2>
              <p className="text-sm text-zinc-500">
                Score: {" "}
                <span
                  className="font-semibold"
                  style={{ color: getColorByScore(report.score) }}
                >
                  {report.score}/100
                </span>
              </p>
            </div>
          </div>

          {/* Salary comparison */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-1">Initial</p>
              <p className="text-sm font-bold text-zinc-300">
                {formatCurrency(report.initialOffer, currency)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-500 mb-1">Final</p>
              <p className="text-sm font-bold text-green-400">
                {formatCurrency(report.finalOffer, currency)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-xs text-indigo-400 mb-1">Your Target</p>
              <p className="text-sm font-bold text-indigo-300">
                {formatCurrency(report.targetSalary, currency)}
              </p>
            </div>
          </div>

          {/* Improvement */}
          {improvement > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-green-400">
              <TrendingUp size={14} />
              <span className="text-sm font-medium">
                Improved by {formatCurrency(improvement, currency)} (+{improvementPct}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tactics used */}
      {report.tactics && report.tactics.length > 0 && (
        <Card className="border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-300">
              Tactics Used
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {report.tactics.map((t) => (
                <Badge key={t} variant="indigo" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      <Card className="border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-zinc-300">
            AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-zinc-400 leading-relaxed">{report.feedback}</p>

          {report.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">
                Strengths
              </p>
              <ul className="space-y-1">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-green-500">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1.5">
                Improvements
              </p>
              <ul className="space-y-1">
                {report.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-yellow-500">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
