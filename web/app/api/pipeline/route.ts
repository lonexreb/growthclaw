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

const STAGE_PROGRESS: Record<PipelineStage, number> = {
  idle: 0,
  scouting: 10,
  scoring: 40,
  drafting: 70,
  done: 100,
  error: 0,
};

const STAGE_MAX: Record<PipelineStage, number> = {
  idle: 0,
  scouting: 37,
  scoring: 67,
  drafting: 97,
  done: 100,
  error: 100,
};

function readState(): PipelineStatus {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw) as PipelineStatus;
  } catch {
    return { stage: "idle", started_at: null, message: "Ready to run", detail: "", progress: 0 };
  }
}

function writeState(state: PipelineStatus): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), "utf-8");
}

let currentProcess: ChildProcess | null = null;

function setState(
  stage: PipelineStage,
  message: string,
  detail?: string,
  progress?: number,
) {
  const prev = readState();
  const state: PipelineStatus = {
    stage,
    started_at: prev.started_at,
    message,
    detail: detail ?? prev.detail,
    progress: progress ?? STAGE_PROGRESS[stage] ?? prev.progress,
  };
  writeState(state);
}

function setDetail(detail: string) {
  const prev = readState();
  // Bump progress slightly within the current stage
  const max = STAGE_MAX[prev.stage] ?? 100;
  const bumped = Math.min(prev.progress + 3, max);
  writeState({ ...prev, detail, progress: bumped });
}

// Extract a human-readable detail from a chunk of openclaw stdout
function extractDetail(chunk: string): string | null {
  const lines = chunk.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    // URL being visited
    const urlMatch = line.match(
      /(?:navigat|visit|brows|open|go(?:ing)?\s+to|loading|fetching|fetch)\S*\s+(https?:\/\/[^\s"']+)/i,
    );
    if (urlMatch) {
      try {
        const hostname = new URL(urlMatch[1]).hostname.replace("www.", "");
        return `Visiting ${hostname}...`;
      } catch {
        /* skip */
      }
    }

    // Reddit subreddit
    const redditMatch = line.match(/r\/(\w+)/i);
    if (redditMatch) return `Browsing r/${redditMatch[1]}...`;

    // Product Hunt / Indie Hackers
    if (/product\s*hunt/i.test(line)) return "Browsing Product Hunt...";
    if (/indie\s*hackers/i.test(line)) return "Browsing Indie Hackers...";

    // Product/lead found
    const productMatch = line.match(
      /(?:found|scouted|extracted|discovered|lead)[:\s]+["']?([A-Z][A-Za-z0-9\s]{2,25})/i,
    );
    if (productMatch) return `Found ${productMatch[1].trim()}`;

    // Scoring
    const scoreMatch = line.match(
      /(?:scor|analyz|evaluat|assess)\w*\s+(?:the\s+)?(?:website|landing|page|site)?\s*(?:for\s+|of\s+)?["']?([A-Za-z][A-Za-z0-9\s]{2,25})/i,
    );
    if (scoreMatch) return `Scoring ${scoreMatch[1].trim()}...`;

    // Drafting outreach
    const draftMatch = line.match(
      /(?:draft|writ|generat)\w*\s+(?:outreach|message|email)\s*(?:for\s+)?["']?([A-Za-z][A-Za-z0-9\s]{2,25})/i,
    );
    if (draftMatch) return `Drafting outreach for ${draftMatch[1].trim()}...`;

    // Stage markers
    if (/stage 1 complete/i.test(line)) return "Scouting complete!";
    if (/stage 2 complete/i.test(line)) return "Scoring complete!";
    if (/stage 3 complete/i.test(line)) return "Outreach drafts ready!";
  }
  return null;
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
  let stillRunning = false;
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8").trim(), 10);
    stillRunning = isProcessRunning(pid);
  } catch {
    // No PID file — process is gone
  }

  if (!stillRunning) {
    writeState({
      stage: "done",
      started_at: initialState.started_at,
      message: "Pipeline complete!",
      detail: "All stages complete!",
      progress: 100,
    });
  }
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
      { status: 409 },
    );
  }

  const projectRoot = getProjectRoot();

  writeState({
    stage: "scouting",
    started_at: new Date().toISOString(),
    message: "Scouting founders from Product Hunt & Reddit...",
    detail: "Searching Reddit and Product Hunt...",
    progress: 5,
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
      },
    );

    // Save PID so we can detect if process is alive after HMR
    if (currentProcess.pid) {
      fs.writeFileSync(PID_FILE, String(currentProcess.pid), "utf-8");
    }

    let output = "";

    const advanceStage = (text: string) => {
      // Extract detail from new chunk before accumulating
      const detail = extractDetail(text);
      if (detail) {
        setDetail(detail);
      }

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
          setState("scoring", "Scoring founder websites...", "Analyzing landing pages...", 40);
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
          setState("drafting", "Drafting personalized outreach...", "Writing outreach messages...", 70);
        }
      }
      if (
        currentStage === "drafting" ||
        currentStage === "scoring" ||
        currentStage === "scouting"
      ) {
        if (
          lower.includes("stage 3 complete") ||
          lower.includes("pipeline complete") ||
          lower.includes("dashboard") ||
          lower.includes("all 3 stages") ||
          lower.includes("complete!")
        ) {
          setState("done", "Pipeline complete!", "All stages complete!", 100);
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
        setState("done", "Pipeline complete!", "All stages complete!", 100);
      } else if (readState().stage !== "done") {
        setState("error", `Pipeline exited with code ${code}`);
      }
      currentProcess = null;
      try {
        fs.unlinkSync(PID_FILE);
      } catch {}
    });

    currentProcess.on("error", (err) => {
      setState(
        "error",
        err.message.includes("ENOENT")
          ? "openclaw not found. Install it: brew install openclaw"
          : `Failed to start: ${err.message}`,
      );
      currentProcess = null;
      try {
        fs.unlinkSync(PID_FILE);
      } catch {}
    });

    return NextResponse.json(
      { message: "Pipeline started", stage: "scouting" },
      { status: 202 },
    );
  } catch (err) {
    setState(
      "error",
      `Failed to spawn pipeline: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json(
      { error: "Failed to start pipeline" },
      { status: 500 },
    );
  }
}
