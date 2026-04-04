#!/usr/bin/env bash
#
# post_lead_to_slack.sh — posts a single lead to #all-growthclaw via webhook
#
# Usage:
#   scripts/post_lead_to_slack.sh <lead_id>
#     Reads lead with matching .id from data/leads.json and posts it.
#
#   cat lead.json | scripts/post_lead_to_slack.sh -
#     Reads a single-lead JSON object from stdin and posts it.
#
# Contract: the lead object must follow the schema in skills/outreach-draft/SKILL.md
# (product_name, founder_name, website_url, source, score, top_gaps, outreach_draft).
#
# Exit codes:
#   0 = posted OK
#   1 = bad usage / missing dependency
#   2 = lead not found in leads.json
#   3 = Slack returned non-ok
#   4 = webhook URL not set

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEADS="${ROOT}/data/leads.json"
ENV_FILE="${ROOT}/.env.local"

# ---- Load webhook URL from .env.local ----------------------------------------
if [[ -z "${SLACK_WEBHOOK_URL:-}" && -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | grep -E '^SLACK_(WEBHOOK_URL|CHANNEL)=' | xargs)
fi

if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo "post_lead_to_slack: SLACK_WEBHOOK_URL not set (check .env.local)" >&2
  exit 4
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "post_lead_to_slack: jq is required" >&2
  exit 1
fi

# ---- Resolve the lead --------------------------------------------------------
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <lead_id>  OR  cat lead.json | $0 -" >&2
  exit 1
fi

if [[ "$1" == "-" ]]; then
  LEAD_JSON="$(cat)"
else
  LEAD_ID="$1"
  LEAD_JSON=$(jq --arg id "$LEAD_ID" '.leads[] | select(.id == $id)' "$LEADS")
  if [[ -z "$LEAD_JSON" || "$LEAD_JSON" == "null" ]]; then
    echo "post_lead_to_slack: no lead with id=$LEAD_ID in $LEADS" >&2
    exit 2
  fi
fi

# ---- Build Block Kit payload from the lead ----------------------------------
# Matches the Slack Message Format section in skills/outreach-draft/SKILL.md.
PAYLOAD=$(echo "$LEAD_JSON" | jq '
  . as $lead
  | ($lead.score // 0) as $score
  | (
      if $score <= 3 then "high priority"
      elif $score <= 6 then "good fit"
      elif $score <= 8 then "soft pitch"
      else "skip"
      end
    ) as $tier
  | (($lead.top_gaps // []) | map("• " + .) | join("\n")) as $gaps_block
  | ($lead.outreach_draft // "_(no draft yet — this is a scouting-stage notification)_") as $draft
  | ($lead.outreach_pitch_point // "—") as $pitch
  | {
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: ("🚨 New Lead — " + ($lead.product_name // "Unknown")), emoji: true }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: ("*Founder:*\n" + ($lead.founder_name // "—")) },
            { type: "mrkdwn", text: ("*Score:*\n*" + ($score | tostring) + "/10* — " + $tier) },
            { type: "mrkdwn", text: ("*Website:*\n<" + ($lead.website_url // "#") + "|" + (($lead.website_url // "—") | sub("^https?://"; ""))  + ">") },
            { type: "mrkdwn", text: ("*Source:*\n" + ($lead.source // "—")) }
          ]
        },
        (if ($gaps_block | length) > 0 then
          { type: "section", text: { type: "mrkdwn", text: ("*Top Gaps:*\n" + $gaps_block) } }
         else empty end),
        {
          type: "section",
          text: { type: "mrkdwn", text: ("*Draft Outreach:*\n> " + ($draft | gsub("\n"; "\n> "))) }
        },
        {
          type: "context",
          elements: [
            { type: "mrkdwn", text: ("_Pitch angle: " + $pitch + "_ · :white_check_mark: approve · :x: skip · :pencil2: edit") }
          ]
        }
      ]
    }
')

# ---- POST to Slack -----------------------------------------------------------
RESPONSE=$(curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL")

if [[ "$RESPONSE" != "ok" ]]; then
  echo "post_lead_to_slack: Slack returned: $RESPONSE" >&2
  exit 3
fi

PRODUCT=$(echo "$LEAD_JSON" | jq -r '.product_name // "?"')
echo "post_lead_to_slack: posted ${PRODUCT} → #all-growthclaw"
