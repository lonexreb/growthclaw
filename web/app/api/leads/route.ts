import { NextResponse } from "next/server";
import { readLeads, updateLeadStatus } from "@/lib/leads";
import { requireAuth, handleAuthError } from "@/lib/auth";
import { leadsActionSchema } from "@/lib/validation";
import { ZodError } from "zod/v4";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = readLeads();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read leads: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);

    const body = await request.json();
    const { id, action } = leadsActionSchema.parse(body);

    const updates =
      action === "approve"
        ? { outreach_status: "approved" as const }
        : { outreach_status: "skipped" as const, status: "skipped" as const };

    const lead = updateLeadStatus(id, updates);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 }
      );
    }
    return handleAuthError(err);
  }
}
