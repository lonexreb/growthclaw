---
name: follow-up-meeting
description: Sends approved outreach via email/LinkedIn, runs a 3-touch follow-up sequence over 10 days, handles replies, and routes interested founders to Crowdstake signup or Calendly demo booking.
---

# Skill 4: Follow-Up & Meeting

## Trigger
Run daily on leads in `data/leads.json` where `outreach_status` is `"approved"` or status is `"outreach-sent"`, `"follow-up-1"`, or `"follow-up-2"`.

## Step-by-Step Instructions

### Step 1: Find Contact Email

For each lead with `outreach_status: "approved"` that hasn't been sent yet (`status` is still `"outreach-drafted"`):

1. Visit the lead's `website_url` using the browser
2. Look for a contact email, founder email, or mailto link on the page
3. Check common locations: footer, about page, contact page, team page
4. If no email on website, check their Reddit/PH profile for contact info
5. If no email found anywhere, try to construct from pattern: `firstname@domain.com` or `hello@domain.com`
6. Store in `contact_email` field. If truly no email findable, set `contact_method: "linkedin"` and note the LinkedIn URL if visible

### Step 2: Send Initial Outreach

For leads with `outreach_status: "approved"` and a `contact_email`:

1. Compose the email:
   - **From:** Use the configured SMTP sender (from `$SMTP_USER` env var)
   - **Subject:** Keep it short, personal, no spam words. Format: "Quick thought on [product_name]'s landing page"
   - **Body:** Use the `outreach_draft` from the lead record (already approved by human)
   - **Footer:** Include physical address and unsubscribe line (CAN-SPAM compliance):
     ```
     —
     Crowdstake AI | Austin, TX
     Reply "stop" to unsubscribe from future emails.
     ```
2. Send via SMTP (use `$SMTP_HOST`, `$SMTP_PORT`, `$SMTP_USER`, `$SMTP_PASS`)
3. Update lead:
   - `status` → `"outreach-sent"`
   - `sent_at` → current ISO timestamp
   - `contact_email` → the email used
   - `contact_method` → `"email"`

### Step 3: Follow-Up Sequence

For leads with `status: "outreach-sent"` or `"follow-up-1"` or `"follow-up-2"`, check if it's time for the next follow-up:

**Follow-up 1 (Day 3 after send):**
- Check: `sent_at` was 3+ days ago AND no reply received
- Message: Short, reference the specific gap. Example:
  > "Hey [name] — just wanted to make sure you saw my note about [product_name]. The [hero_gap] on your landing page is likely costing you signups. Happy to show you how Crowdstake fixes that in minutes. Free tier at crowdstake.com"
- Update: `status` → `"follow-up-1"`, append to `follow_ups` array

**Follow-up 2 (Day 7 after send):**
- Check: first follow-up was 4+ days ago AND no reply
- Message: Value-add, not another pitch. Give a specific actionable tip:
  > "One quick tip for [product_name]: try moving your CTA above the fold and making it action-oriented ('Start free' instead of 'Learn more'). That alone can lift conversions 20-30%. Crowdstake does this automatically if you ever want to test it."
- Update: `status` → `"follow-up-2"`, append to `follow_ups` array

**Follow-up 3 / Soft Close (Day 10 after send):**
- Check: second follow-up was 3+ days ago AND no reply
- Message: Graceful exit:
  > "Last note from me, [name] — no worries if Crowdstake isn't a fit right now. The free tier ($0/month) is there whenever you're ready to level up [product_name]'s marketing. Wishing you the best with the launch!"
- Update: `status` → `"follow-up-3"`, append to `follow_ups` array
- After follow-up 3 with no reply: `status` → `"no-response"` (sequence complete)

### Step 4: Reply Detection

For all leads with active sequences (status `"outreach-sent"` through `"follow-up-3"`):

1. Check inbox (IMAP) for replies matching the lead's `contact_email`
2. If reply found, classify sentiment using LLM:
   - **Interested:** Contains words like "sounds good", "tell me more", "let's chat", "sign up", positive tone
   - **Declined:** Contains "not interested", "unsubscribe", "stop", "no thanks"
   - **Question:** Asks about features, pricing, how it works
3. Update lead based on classification:
   - Interested → `status: "reply-received"`, `reply.sentiment: "interested"`. Post to Slack: "Reply from [founder] — INTERESTED. Route to signup/meeting."
   - Declined → `status: "declined"`, `reply.sentiment: "declined"`. STOP all follow-ups immediately. Post to Slack: "Reply from [founder] — declined. Sequence stopped."
   - Question → `status: "reply-received"`, `reply.sentiment: "question"`. Post to Slack: "Reply from [founder] — has questions. Human response needed."

### Step 5: Meeting/Signup Routing

For leads with `reply.sentiment: "interested"`:

1. **PLG path (preferred for indie makers):**
   - Send reply: "Awesome! Here's the free tier — you can have a landing page live in 10 minutes: crowdstake.com. No credit card needed."
   - Update: `status` → `"trial-started"`

2. **Meeting path (for leads who want a walkthrough):**
   - Send reply with Calendly link: "Happy to walk you through it! Grab a time here: [CALENDLY_LINK]"
   - Update: `status` → `"meeting-booked"`, `meeting_url` → the Calendly link

## Output Schema

Fields added to each lead record:
```json
{
  "contact_email": "founder@example.com",
  "contact_method": "email",
  "sent_at": "2026-04-07T10:00:00Z",
  "follow_ups": [
    { "number": 1, "sent_at": "2026-04-10T10:00:00Z", "content": "..." },
    { "number": 2, "sent_at": "2026-04-14T10:00:00Z", "content": "..." },
    { "number": 3, "sent_at": "2026-04-17T10:00:00Z", "content": "..." }
  ],
  "reply": {
    "received_at": "2026-04-11T14:30:00Z",
    "sentiment": "interested",
    "content": "Sounds great, I'd love to try it..."
  },
  "meeting_url": "https://calendly.com/crowdstake/demo",
  "status": "outreach-sent"
}
```

## Compliance Rules (Hard Constraints)

- **CAN-SPAM:** Every email must include physical address + working unsubscribe
- **One sequence per founder:** Never re-contact after decline or sequence completion
- **Immediate stop on "stop"/"unsubscribe":** If reply contains opt-out language, halt ALL messages instantly
- **LinkedIn limits:** Max 15 connection requests/day, 40 messages/day
- **Email warmup:** New sending domains need 4+ weeks of warmup before cold outreach
- **Rate limit:** Max 10 new sends per run

## Edge Cases

- No email found → set `contact_method: "manual"`, alert Slack for human to find contact
- Email bounces → set `status: "error"`, `error_reason: "email-bounced"`, stop sequence
- Out-of-office reply → ignore, continue sequence as scheduled
- Reply in different language → classify as "question", route to human
