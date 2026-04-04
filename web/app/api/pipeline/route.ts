import { NextResponse } from "next/server";
import { spawn, type ChildProcess } from "child_process";
import type { PipelineStage, PipelineStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

let currentProcess: ChildProcess | null = null;
let pipelineState: PipelineStatus = {
  stage: "idle",
  started_at: null,
  message: "Ready to run",
};

function setState(stage: PipelineStage, message: string) {
  pipelineState = {
    stage,
    started_at: pipelineState.started_at,
    message,
  };
}

export async function GET() {
  return NextResponse.json(pipelineState);
}

export async function POST() {
  if (
    currentProcess &&
    pipelineState.stage !== "idle" &&
    pipelineState.stage !== "done" &&
    pipelineState.stage !== "error"
  ) {
    return NextResponse.json(
      { error: "Pipeline already running" },
      { status: 409 }
    );
  }

  pipelineState = {
    stage: "scouting",
    started_at: new Date().toISOString(),
    message: "Scouting founders from Product Hunt & Reddit...",
  };

  const pipelineMessage =
    "Run the GrowthClaw pipeline. Read skills/growthclaw-pipeline/SKILL.md and execute all three stages: (1) Scout 3 leads from Product Hunt, (2) Score each lead's website, (3) Draft outreach for qualified leads. Save all results to data/leads.json and update data/dashboard.md.";

  try {
    currentProcess = spawn(
      "openclaw",
      [
        "agent",
        "--agent",
        "growthclaw",
        "--local",
        "--thinking",
        "medium",
        "--timeout",
        "300",
        "--message",
        pipelineMessage,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env },
      }
    );

    let output = "";

    currentProcess.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;

      if (
        text.includes("Stage 1 complete") ||
        text.includes("Stage 1:") ||
        output.includes("leads scored")
      ) {
        if (pipelineState.stage === "scouting") {
          setState("scoring", "Scoring founder websites...");
        }
      }
      if (
        text.includes("Stage 2 complete") ||
        text.includes("Stage 2:") ||
        output.includes("outreach draft")
      ) {
        if (pipelineState.stage === "scoring") {
          setState("drafting", "Drafting personalized outreach...");
        }
      }
      if (
        text.includes("Stage 3 complete") ||
        text.includes("Pipeline complete") ||
        text.includes("pipeline complete")
      ) {
        setState("done", "Pipeline complete!");
      }
    });

    currentProcess.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      // Parse stderr too — openclaw outputs progress info here
      if (text.includes("Stage 1") || text.includes("scouted")) {
        if (pipelineState.stage === "scouting") {
          setState("scoring", "Scoring founder websites...");
        }
      }
      if (text.includes("Stage 2") || text.includes("scored")) {
        if (pipelineState.stage === "scoring") {
          setState("drafting", "Drafting personalized outreach...");
        }
      }
    });

    currentProcess.on("close", (code) => {
      if (code === 0) {
        setState("done", "Pipeline complete!");
      } else {
        setState("error", `Pipeline exited with code ${code}`);
      }
      currentProcess = null;
    });

    currentProcess.on("error", (err) => {
      setState("error", `Failed to start: ${err.message}`);
      currentProcess = null;
    });

    return NextResponse.json(
      { message: "Pipeline started", stage: "scouting" },
      { status: 202 }
    );
  } catch {
    setState("error", "Failed to spawn pipeline process");
    return NextResponse.json(
      { error: "Failed to start pipeline" },
      { status: 500 }
    );
  }
}
