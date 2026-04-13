"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, BarChart3, FileText, Send, MessageCircle, CreditCard, DollarSign } from "lucide-react";
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
  const sent = leads.filter((l) => l.sent_at != null).length;
  const replies = leads.filter((l) => l.reply != null).length;
  const converted = leads.filter((l) => l.converted === true).length;
  const totalMrr = leads.reduce((sum, l) => sum + (l.mrr ?? 0), 0);

  const row1 = [
    { label: "Total Leads", value: total, icon: Users, iconBg: "bg-red-50", color: "text-gc-red" },
    { label: "Qualified", value: qualified, icon: Target, iconBg: "bg-emerald-50", color: "text-gc-green" },
    { label: "Avg Score", value: `${avgScore}/10`, icon: BarChart3, iconBg: "bg-cyan-50", color: "text-gc-cyan" },
    { label: "Drafts Ready", value: draftsReady, icon: FileText, iconBg: "bg-violet-50", color: "text-gc-purple" },
  ];

  const row2 = [
    { label: "Sent", value: sent, icon: Send, iconBg: "bg-orange-50", color: "text-gc-amber" },
    { label: "Replies", value: replies, icon: MessageCircle, iconBg: "bg-blue-50", color: "text-gc-cyan" },
    { label: "Converted", value: converted, icon: CreditCard, iconBg: "bg-emerald-50", color: "text-gc-green" },
    { label: "MRR", value: totalMrr > 0 ? `$${totalMrr}` : "$0", icon: DollarSign, iconBg: "bg-green-50", color: "text-gc-green" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row1.map(({ label, value, icon: Icon, iconBg, color }) => (
          <Card key={label} className="bg-white border-gray-200/80">
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
      {(sent > 0 || replies > 0 || converted > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {row2.map(({ label, value, icon: Icon, iconBg, color }) => (
            <Card key={label} className="bg-white border-gray-200/80">
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
      )}
    </div>
  );
}
