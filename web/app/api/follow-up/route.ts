import { NextResponse } from "next/server";
import { readLeads, updateLeadStatus } from "@/lib/leads";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { checkReplies, classifySentiment, isImapConfigured } from "@/lib/imap";
import type { Lead, FollowUp } from "@/lib/types";

export const dynamic = "force-dynamic";

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function lastFollowUpDate(lead: Lead): string | null {
  if (!lead.follow_ups || lead.follow_ups.length === 0) return lead.sent_at || null;
  return lead.follow_ups[lead.follow_ups.length - 1].sent_at;
}

export async function GET() {
  const data = readLeads();
  const leads = data.leads;

  const sent = leads.filter((l) => l.status === "outreach-sent").length;
  const fu1 = leads.filter((l) => l.status === "follow-up-1").length;
  const fu2 = leads.filter((l) => l.status === "follow-up-2").length;
  const fu3 = leads.filter((l) => l.status === "follow-up-3").length;
  const replies = leads.filter((l) => l.status === "reply-received").length;
  const declined = leads.filter((l) => l.status === "declined").length;
  const noResponse = leads.filter((l) => l.status === "no-response").length;

  return NextResponse.json({
    email_configured: isEmailConfigured(),
    imap_configured: isImapConfigured(),
    stats: { sent, fu1, fu2, fu3, replies, declined, noResponse },
  });
}

export async function POST() {
  const data = readLeads();
  const results = {
    initial_sent: 0,
    follow_ups_sent: 0,
    replies_found: 0,
    marked_no_response: 0,
    errors: [] as string[],
  };

  // 1. Send initial outreach for approved leads
  const approvedLeads = data.leads.filter(
    (l) => l.outreach_status === "approved" && l.status === "outreach-drafted"
  );

  for (const lead of approvedLeads.slice(0, 10)) {
    const email = lead.contact_email;
    if (!email) {
      results.errors.push(`${lead.product_name}: no contact_email`);
      continue;
    }

    const subject = `Quick thought on ${lead.product_name}'s landing page`;
    const body = lead.outreach_draft || "";

    const result = await sendEmail(email, subject, body);
    if (result.success) {
      updateLeadStatus(lead.id, {
        status: "outreach-sent",
        outreach_status: "sent",
        sent_at: new Date().toISOString(),
      });
      results.initial_sent++;
    } else {
      results.errors.push(`${lead.product_name}: ${result.error}`);
    }
  }

  // 2. Follow-up 1 (3+ days after send)
  const needsFU1 = data.leads.filter(
    (l) => l.status === "outreach-sent" && l.sent_at && daysSince(l.sent_at) >= 3
  );
  for (const lead of needsFU1.slice(0, 10)) {
    const gap = lead.outreach_hero_gap || lead.top_gaps?.[0] || "your landing page";
    const body = `Hey ${lead.founder_name} — just wanted to make sure you saw my note about ${lead.product_name}. The issue with ${gap} is likely costing you signups. Happy to show you how Crowdstake fixes that in minutes. Free tier at crowdstake.com`;

    const fu: FollowUp = { number: 1, sent_at: new Date().toISOString(), content: body };
    const existingFUs = lead.follow_ups || [];

    const result = await sendEmail(lead.contact_email!, `Re: ${lead.product_name}`, body);
    if (result.success) {
      updateLeadStatus(lead.id, {
        status: "follow-up-1",
        follow_ups: [...existingFUs, fu],
      });
      results.follow_ups_sent++;
    }
  }

  // 3. Follow-up 2 (4+ days after FU1)
  const needsFU2 = data.leads.filter(
    (l) => l.status === "follow-up-1" && lastFollowUpDate(l) && daysSince(lastFollowUpDate(l)!) >= 4
  );
  for (const lead of needsFU2.slice(0, 10)) {
    const body = `One quick tip for ${lead.product_name}: try moving your CTA above the fold and making it action-oriented ("Start free" instead of "Learn more"). That alone can lift conversions 20-30%. Crowdstake does this automatically if you ever want to test it — crowdstake.com`;

    const fu: FollowUp = { number: 2, sent_at: new Date().toISOString(), content: body };
    const existingFUs = lead.follow_ups || [];

    const result = await sendEmail(lead.contact_email!, `Re: ${lead.product_name}`, body);
    if (result.success) {
      updateLeadStatus(lead.id, {
        status: "follow-up-2",
        follow_ups: [...existingFUs, fu],
      });
      results.follow_ups_sent++;
    }
  }

  // 4. Follow-up 3 / soft close (3+ days after FU2)
  const needsFU3 = data.leads.filter(
    (l) => l.status === "follow-up-2" && lastFollowUpDate(l) && daysSince(lastFollowUpDate(l)!) >= 3
  );
  for (const lead of needsFU3.slice(0, 10)) {
    const body = `Last note from me, ${lead.founder_name} — no worries if Crowdstake isn't a fit right now. The free tier ($0/month) is there whenever you're ready to level up ${lead.product_name}'s marketing. Wishing you the best with the launch!`;

    const fu: FollowUp = { number: 3, sent_at: new Date().toISOString(), content: body };
    const existingFUs = lead.follow_ups || [];

    const result = await sendEmail(lead.contact_email!, `Re: ${lead.product_name}`, body);
    if (result.success) {
      updateLeadStatus(lead.id, {
        status: "follow-up-3",
        follow_ups: [...existingFUs, fu],
      });
      results.follow_ups_sent++;
    }
  }

  // 5. Mark no-response (3+ days after FU3)
  const needsClose = data.leads.filter(
    (l) => l.status === "follow-up-3" && lastFollowUpDate(l) && daysSince(lastFollowUpDate(l)!) >= 3
  );
  for (const lead of needsClose) {
    updateLeadStatus(lead.id, { status: "no-response" });
    results.marked_no_response++;
  }

  // 6. Check for replies
  const activeEmails = data.leads
    .filter((l) =>
      ["outreach-sent", "follow-up-1", "follow-up-2", "follow-up-3"].includes(l.status) &&
      l.contact_email
    )
    .map((l) => l.contact_email!.toLowerCase());

  if (activeEmails.length > 0) {
    const replies = await checkReplies(activeEmails);
    for (const reply of replies) {
      const lead = data.leads.find(
        (l) => l.contact_email?.toLowerCase() === reply.from.toLowerCase()
      );
      if (!lead) continue;

      const sentiment = classifySentiment(reply.body);
      updateLeadStatus(lead.id, {
        status: sentiment === "declined" ? "declined" : "reply-received",
        reply: {
          received_at: reply.date,
          sentiment,
          content: reply.body.slice(0, 500),
        },
      });
      results.replies_found++;
    }
  }

  return NextResponse.json({
    message: "Follow-up cycle complete",
    results,
  });
}
