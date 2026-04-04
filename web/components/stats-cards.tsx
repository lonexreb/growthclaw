"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, BarChart3, FileText } from "lucide-react";
import type { Lead } from "@/lib/types";

export function StatsCards({ leads }: { leads: Lead[] }) {
  const total = leads.length;
  const qualified = leads.filter(
    (l) =>
      l.status === "qualified" ||
      l.status === "outreach-drafted" ||
      l.status === "qualified-low"
  ).length;
  const avgScore =
    total > 0
      ? (
          leads.reduce((sum, l) => sum + l.marketing_score, 0) / total
        ).toFixed(1)
      : "—";
  const draftsReady = leads.filter(
    (l) => l.outreach_status === "drafted"
  ).length;

  const stats = [
    {
      label: "Total Leads",
      value: total,
      icon: Users,
      color: "text-gc-accent",
    },
    {
      label: "Qualified",
      value: qualified,
      icon: Target,
      color: "text-emerald-400",
    },
    {
      label: "Avg Score",
      value: `${avgScore}/10`,
      icon: BarChart3,
      color: "text-gc-cyan",
    },
    {
      label: "Drafts Ready",
      value: draftsReady,
      icon: FileText,
      color: "text-gc-purple",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card
          key={label}
          className="bg-gc-bg-secondary/50 border-gc-muted/10"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className={`p-2.5 rounded-lg bg-gc-bg ${color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gc-text">{value}</p>
              <p className="text-xs text-gc-muted">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
