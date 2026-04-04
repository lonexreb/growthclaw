import { NextResponse } from "next/server";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import type { PipelineStage, PipelineStatus } from "@/lib/types";
import { getProjectRoot } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Pipeline state persisted to a temp file to survive HMR reloads
const STATE_FILE = path.join(getProjectRoot(), "data", ".pipeline-state.json");
const PID_FILE = path.join(getProjectRoot(), "data", ".pipeline-pid");

function readState(): PipelineStatus {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw) as PipelineStatus;
  } catch {
    return { stage: "idle", started_at: null, message: "Ready to run" };
  }
}

function writeState(state: PipelineStatus): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), "utf-8");
}

let currentProcess: ChildProcess | null = null;

function setState(stage: PipelineStage, message: string) {
  const state: PipelineStatus = {
    stage,
    started_at: readState().started_at,
    message,
  };
  writeState(state);
}

// Check if a PID is still alive
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// On module load, check if a previous run left a stale "running" state
const initialState = readState();
if (
  initialState.stage !== "idle" &&
  initialState.stage !== "done" &&
  initialState.stage !== "error"
) {
  // Check if the process is actually still running via PID file
  let stillRunning = false;
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
    stillRunning = isProcessRunning(pid);
  } catch {
    // No PID file — process is gone
  }

  if (!stillRunning) {
    // Process finished but stage wasn't updated — check if leads grew (success) or not
    writeState({
      stage: "done",
      started_at: initialState.started_at,
      message: "Pipeline complete!",
    });
  }
  // If still running, leave state as-is — it's fine
}

export async function GET() {
  return NextResponse.json(readState());
}

export async function POST() {
  const current = readState();
  if (
    currentProcess &&
    current.stage !== "idle" &&
    current.stage !== "done" &&
    current.stage !== "error"
  ) {
    return NextResponse.json(
      { error: "Pipeline already running" },
      { status: 409 }
    );
  }

  const projectRoot = getProjectRoot();

  writeState({
    stage: "scouting",
    started_at: new Date().toISOString(),
    message: "Scouting founders from Product Hunt & Reddit...",
  });

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
        cwd: projectRoot,
        env: { ...process.env },
        detached: true,
      }
    );

    // Save PID so we can detect if process is alive after HMR
    if (currentProcess.pid) {
      fs.writeFileSync(PID_FILE, String(currentProcess.pid), "utf-8");
    }

    let output = "";

    const advanceStage = (text: string) => {
      output += text;
      const lower = output.toLowerCase();
      const currentStage = readState().stage;

      // Detect stage transitions from accumulated output
      if (currentStage === "scouting") {
        if (
          lower.includes("stage 1 complete") ||
          lower.includes("stage 2") ||
          lower.includes("scoring") ||
          lower.includes("leads scored") ||
          lower.includes("visit") ||
          lower.includes("enrich") ||
          lower.includes("marketing_score") ||
          lower.includes("score_breakdown")
        ) {
          setState("scoring", "Scoring founder websites...");
        }
      }
      if (currentStage === "scoring") {
        if (
          lower.includes("stage 2 complete") ||
          lower.includes("stage 3") ||
          lower.includes("drafting") ||
          lower.includes("outreach draft") ||
          lower.includes("outreach_draft") ||
          lower.includes("personalized") ||
          lower.includes("hey!")
        ) {
          setState("drafting", "Drafting personalized outreach...");
        }
      }
      if (currentStage === "drafting" || currentStage === "scoring" || currentStage === "scouting") {
        if (
          lower.includes("stage 3 complete") ||
          lower.includes("pipeline complete") ||
          lower.includes("dashboard") ||
          lower.includes("all 3 stages") ||
          lower.includes("complete!")
        ) {
          setState("done", "Pipeline complete!");
        }
      }
    };

    currentProcess.stdout?.on("data", (data: Buffer) => {
      advanceStage(data.toString());
    });

    currentProcess.stderr?.on("data", (data: Buffer) => {
      advanceStage(data.toString());
    });

    currentProcess.on("close", (code) => {
      if (code === 0) {
        setState("done", "Pipeline complete!");
      } else if (readState().stage !== "done") {
        setState("error", `Pipeline exited with code ${code}`);
      }
      currentProcess = null;
      try { fs.unlinkSync(PID_FILE); } catch {}
    });

    currentProcess.on("error", (err) => {
      setState(
        "error",
        err.message.includes("ENOENT")
          ? "openclaw not found. Install it: brew install openclaw"
          : `Failed to start: ${err.message}`
      );
      currentProcess = null;
      try { fs.unlinkSync(PID_FILE); } catch {}
    });

    return NextResponse.json(
      { message: "Pipeline started", stage: "scouting" },
      { status: 202 }
    );
  } catch (err) {
    setState(
      "error",
      `Failed to spawn pipeline: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json(
      { error: "Failed to start pipeline" },
      { status: 500 }
    );
  }
}
