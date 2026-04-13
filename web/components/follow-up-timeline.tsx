"use client";

import type { FollowUp, Reply } from "@/lib/types";

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

interface TimelineProps {
  sentAt?: string;
  followUps?: FollowUp[];
  reply?: Reply;
  status: string;
}

interface TimelineStep {
  label: string;
  date: string;
  color: string;
  active: boolean;
}

export function FollowUpTimeline({ sentAt, followUps, reply, status }: TimelineProps) {
  const steps: TimelineStep[] = [];

  if (sentAt) {
    steps.push({ label: "Sent", date: formatShortDate(sentAt), color: "bg-gc-red", active: true });
  }

  if (followUps) {
    for (const fu of followUps) {
      steps.push({
        label: `FU${fu.number}`,
        date: formatShortDate(fu.sent_at),
        color: "bg-gc-amber",
        active: true,
      });
    }
  }

  if (reply) {
    const sentimentColor =
      reply.sentiment === "interested" ? "bg-gc-green" :
      reply.sentiment === "declined" ? "bg-gc-red" : "bg-gc-purple";
    steps.push({
      label: reply.sentiment === "interested" ? "Interested" : reply.sentiment === "declined" ? "Declined" : "Question",
      date: formatShortDate(reply.received_at),
      color: sentimentColor,
      active: true,
    });
  } else if (status === "no-response") {
    steps.push({ label: "No Reply", date: "", color: "bg-gray-300", active: true });
  }

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${step.color} ${step.active ? "" : "opacity-30"}`} />
            <span className="text-[10px] text-gc-muted mt-0.5">{step.label}</span>
            {step.date && (
              <span className="text-[9px] text-gray-400">{step.date}</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 h-0.5 bg-gray-200 mx-1 -mt-4" />
          )}
        </div>
      ))}
    </div>
  );
}
