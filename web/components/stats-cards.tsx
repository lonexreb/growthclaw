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
  const scoredLeads = leads.filter((l) => l.marketing_score != null);
  const avgScore =
    scoredLeads.length > 0
      ? (
          scoredLeads.reduce((sum, l) => sum + (l.marketing_score ?? 0), 0) /
          scoredLeads.length
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
      iconBg: "bg-red-50",
      color: "text-gc-red",
    },
    {
      label: "Qualified",
      value: qualified,
      icon: Target,
      iconBg: "bg-emerald-50",
      color: "text-gc-green",
    },
    {
      label: "Avg Score",
      value: `${avgScore}/10`,
      icon: BarChart3,
      iconBg: "bg-cyan-50",
      color: "text-gc-cyan",
    },
    {
      label: "Drafts Ready",
      value: draftsReady,
      icon: FileText,
      iconBg: "bg-violet-50",
      color: "text-gc-purple",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, iconBg, color }) => (
        <Card
          key={label}
          className="bg-white border-gray-200/80"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${iconBg} ${color}`}>
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
