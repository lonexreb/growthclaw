import fs from "fs";
import path from "path";
import { LeadsFile, Lead } from "./types";

// Resolve project root reliably: go up from web/ to growthclaw/
// Works whether started from web/ (pnpm dev) or project root (next dev --dir web)
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const LEADS_PATH = path.join(PROJECT_ROOT, "data", "leads.json");

export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

export function readLeads(): LeadsFile {
  try {
    const raw = fs.readFileSync(LEADS_PATH, "utf-8");
    return JSON.parse(raw) as LeadsFile;
  } catch (err) {
    // Retry with parse error handling — agent may be mid-write
    try {
      const raw = fs.readFileSync(LEADS_PATH, "utf-8");
      return JSON.parse(raw) as LeadsFile;
    } catch {
      throw new Error(
        `Failed to read leads.json at ${LEADS_PATH}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

export function writeLeads(data: LeadsFile): void {
  data.metadata.total_leads = data.leads.length;
  data.metadata.last_updated = new Date().toISOString();
  fs.writeFileSync(LEADS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function updateLeadStatus(
  leadId: string,
  updates: Partial<Lead>
): Lead | null {
  const data = readLeads();
  const idx = data.leads.findIndex((l) => l.id === leadId);
  if (idx === -1) return null;
  data.leads[idx] = { ...data.leads[idx], ...updates };
  writeLeads(data);
  return data.leads[idx];
}
