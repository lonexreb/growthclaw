import fs from "fs";
import path from "path";
import lockfile from "proper-lockfile";
import { LeadsFile, Lead } from "./types";

// Resolve project root: go up from web/ (process.cwd()) to growthclaw/
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const LEADS_PATH = path.join(PROJECT_ROOT, "data", "leads.json");
const LEADS_TMP = LEADS_PATH + ".tmp";
const LOCK_OPTS = { retries: { retries: 5, minTimeout: 50, maxTimeout: 500 } };

export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

export function readLeads(): LeadsFile {
  const raw = fs.readFileSync(LEADS_PATH, "utf-8");
  return JSON.parse(raw) as LeadsFile;
}

function writeLeadsAtomic(data: LeadsFile): void {
  data.metadata.total_leads = data.leads.length;
  data.metadata.last_updated = new Date().toISOString();
  // Write to temp file then atomic rename — prevents partial reads
  fs.writeFileSync(LEADS_TMP, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(LEADS_TMP, LEADS_PATH);
}

/**
 * Acquire a file lock, read leads.json, apply a mutation function,
 * write back atomically, and release the lock.
 */
export function withLeadsLock(
  mutate: (data: LeadsFile) => LeadsFile
): LeadsFile {
  const release = lockfile.lockSync(LEADS_PATH, LOCK_OPTS);
  try {
    const data = readLeads();
    const updated = mutate(data);
    writeLeadsAtomic(updated);
    return updated;
  } finally {
    release();
  }
}

/**
 * Update a single lead by ID. Acquires lock, reads once, writes once.
 */
export function updateLeadStatus(
  leadId: string,
  updates: Partial<Lead>
): Lead | null {
  let result: Lead | null = null;
  withLeadsLock((data) => {
    const idx = data.leads.findIndex((l) => l.id === leadId);
    if (idx === -1) return data;
    data.leads[idx] = { ...data.leads[idx], ...updates };
    result = data.leads[idx];
    return data;
  });
  return result;
}

/**
 * Batch update multiple leads. Reads once, modifies all, writes once.
 * Avoids N+1 file I/O when processing leads in a loop.
 */
export function batchUpdateLeads(
  updates: Array<{ id: string; changes: Partial<Lead> }>
): void {
  withLeadsLock((data) => {
    for (const { id, changes } of updates) {
      const idx = data.leads.findIndex((l) => l.id === id);
      if (idx !== -1) {
        data.leads[idx] = { ...data.leads[idx], ...changes };
      }
    }
    return data;
  });
}

// Re-export writeLeads with lock for direct callers
export function writeLeads(data: LeadsFile): void {
  const release = lockfile.lockSync(LEADS_PATH, LOCK_OPTS);
  try {
    writeLeadsAtomic(data);
  } finally {
    release();
  }
}
