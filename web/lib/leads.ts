import fs from "fs";
import path from "path";
import { LeadsFile, Lead } from "./types";

const LEADS_PATH = path.join(process.cwd(), "..", "data", "leads.json");

export function readLeads(): LeadsFile {
  const raw = fs.readFileSync(LEADS_PATH, "utf-8");
  return JSON.parse(raw) as LeadsFile;
}

export function writeLeads(data: LeadsFile): void {
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
  data.metadata.last_updated = new Date().toISOString();
  writeLeads(data);
  return data.leads[idx];
}
