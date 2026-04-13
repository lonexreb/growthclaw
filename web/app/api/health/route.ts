import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getConfigStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const projectRoot =
    process.env.GROWTHCLAW_ROOT || path.resolve(process.cwd(), "..");
  const leadsPath = path.join(projectRoot, "data", "leads.json");

  let leadsAccessible = false;
  let leadsCount = 0;
  try {
    const raw = fs.readFileSync(leadsPath, "utf-8");
    const data = JSON.parse(raw);
    leadsAccessible = true;
    leadsCount = data.leads?.length ?? 0;
  } catch {
    leadsAccessible = false;
  }

  const services = getConfigStatus();

  return NextResponse.json({
    status: leadsAccessible ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    leads: { accessible: leadsAccessible, count: leadsCount },
    services,
  });
}
