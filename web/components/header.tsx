"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
}

export function Header({ onRun, isRunning }: HeaderProps) {
  return (
    <header className="w-full bg-gc-bg border-b border-gc-muted/10 px-6 py-4">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
            <path
              d="M8 28 Q11 10 18 14 Q14 22 16 28 Z"
              fill="#ff6b35"
              opacity="0.9"
            />
            <path
              d="M15 26 Q20 6 27 10 Q22 20 22 26 Z"
              fill="#ff6b35"
              opacity="0.95"
            />
            <path
              d="M22 26 Q28 6 35 14 Q30 22 28 26 Z"
              fill="#ff6b35"
              opacity="0.9"
            />
            <ellipse cx="21" cy="32" rx="16" ry="6" fill="#ff6b35" opacity="0.2" />
          </svg>
          <div>
            <h1 className="text-xl font-bold text-gc-text tracking-tight">
              GrowthClaw
            </h1>
            <p className="text-xs text-gc-muted">
              Autonomous Founder-Scouting Engine
            </p>
          </div>
        </div>

        {/* Run button */}
        <Button
          onClick={onRun}
          disabled={isRunning}
          className="bg-gc-accent hover:bg-gc-accent/90 text-white font-medium px-5"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Pipeline
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
