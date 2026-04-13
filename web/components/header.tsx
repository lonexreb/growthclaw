"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Play, Send, CreditCard, Heart } from "lucide-react";

type PipelineAction = "scout" | "follow-up" | "convert" | "success" | "full";

interface HeaderProps {
  onRun: (action?: PipelineAction) => void;
  isRunning: boolean;
}

export function Header({ onRun, isRunning }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
            <path d="M8 28 Q11 10 18 14 Q14 22 16 28 Z" fill="#dc2626" opacity="0.85" />
            <path d="M15 26 Q20 6 27 10 Q22 20 22 26 Z" fill="#dc2626" opacity="0.95" />
            <path d="M22 26 Q28 6 35 14 Q30 22 28 26 Z" fill="#dc2626" opacity="0.85" />
            <ellipse cx="21" cy="32" rx="16" ry="6" fill="#dc2626" opacity="0.15" />
          </svg>
          <div>
            <h1 className="text-xl font-bold text-gc-text tracking-tight">
              GrowthClaw
            </h1>
            <p className="text-xs text-gc-muted">
              Full-Cycle Autonomous Sales Engine
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRun("follow-up")}
            disabled={isRunning}
            className="text-gc-muted hover:text-gc-text"
          >
            <Send className="h-4 w-4 mr-1" />
            Follow-Ups
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRun("convert")}
            disabled={isRunning}
            className="text-gc-muted hover:text-gc-text"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Conversions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRun("success")}
            disabled={isRunning}
            className="text-gc-muted hover:text-gc-text"
          >
            <Heart className="h-4 w-4 mr-1" />
            Health
          </Button>
          <Button
            onClick={() => onRun("scout")}
            disabled={isRunning}
            className="bg-gc-red hover:bg-red-700 text-white font-medium px-5 shadow-md shadow-red-200"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Scout Leads
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
