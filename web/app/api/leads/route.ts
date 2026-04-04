import { NextResponse } from "next/server";
import { readLeads, updateLeadStatus } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = readLeads();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to read leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { id, action } = (await request.json()) as {
      id: string;
      action: "approve" | "skip";
    };

    const updates =
      action === "approve"
        ? { outreach_status: "approved" as const }
        : { outreach_status: "skipped" as const, status: "skipped" as const };

    const lead = updateLeadStatus(id, updates);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
