#!/usr/bin/env bash
#
# validate_leads.sh — validate and clean leads.json
#
# Checks edge cases from founder-scout SKILL.md:
#   1. Missing website_url → remove the lead
#   2. Missing founder_name → fallback to product_name
#   3. Duplicate website_url → keep first, remove dupes
#   4. Verify metadata.total_leads matches actual count
#
# Usage:
#   scripts/validate_leads.sh              # validate and report
#   scripts/validate_leads.sh --fix        # validate, fix issues, write back
#
# Requires: jq

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEADS_FILE="$ROOT/data/leads.json"
FIX_MODE=false

if [[ "${1:-}" == "--fix" ]]; then
  FIX_MODE=true
fi

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq"
  exit 1
fi

if [[ ! -f "$LEADS_FILE" ]]; then
  echo "ERROR: $LEADS_FILE not found"
  exit 1
fi

echo "=== GrowthClaw Lead Validator ==="
echo ""

TOTAL=$(jq '.leads | length' "$LEADS_FILE")
echo "Total leads in file: $TOTAL"
echo ""

# --- Check 1: Missing website_url ---
MISSING_URL=$(jq '[.leads[] | select(.website_url == null or .website_url == "")] | length' "$LEADS_FILE")
if [[ "$MISSING_URL" -gt 0 ]]; then
  echo "WARN: $MISSING_URL lead(s) missing website_url — should be removed:"
  jq -r '.leads[] | select(.website_url == null or .website_url == "") | "  - \(.id): \(.product_name)"' "$LEADS_FILE"
else
  echo "OK: All leads have website_url"
fi

# --- Check 2: Missing founder_name ---
MISSING_FOUNDER=$(jq '[.leads[] | select(.founder_name == null or .founder_name == "")] | length' "$LEADS_FILE")
if [[ "$MISSING_FOUNDER" -gt 0 ]]; then
  echo "WARN: $MISSING_FOUNDER lead(s) missing founder_name — should fallback to product_name:"
  jq -r '.leads[] | select(.founder_name == null or .founder_name == "") | "  - \(.id): \(.product_name)"' "$LEADS_FILE"
else
  echo "OK: All leads have founder_name"
fi

# --- Check 3: Duplicate website_url ---
DUPES=$(jq '[.leads[].website_url] | group_by(.) | map(select(length > 1)) | length' "$LEADS_FILE")
if [[ "$DUPES" -gt 0 ]]; then
  echo "WARN: $DUPES duplicate website_url(s) found:"
  jq -r '[.leads[].website_url] | group_by(.) | map(select(length > 1)) | .[] | "  - \(.[0]) (x\(length))"' "$LEADS_FILE"
else
  echo "OK: No duplicate website_urls"
fi

# --- Check 4: Metadata total_leads matches actual ---
META_TOTAL=$(jq '.metadata.total_leads' "$LEADS_FILE")
if [[ "$META_TOTAL" -ne "$TOTAL" ]]; then
  echo "WARN: metadata.total_leads ($META_TOTAL) != actual count ($TOTAL)"
else
  echo "OK: metadata.total_leads matches actual count ($TOTAL)"
fi

# --- Check 5: Required fields present ---
MISSING_FIELDS=0
for field in id source product_name website_url description source_url found_at status; do
  COUNT=$(jq "[.leads[] | select(.${field} == null or .${field} == \"\")] | length" "$LEADS_FILE")
  if [[ "$COUNT" -gt 0 ]]; then
    echo "WARN: $COUNT lead(s) missing required field '$field'"
    MISSING_FIELDS=$((MISSING_FIELDS + COUNT))
  fi
done
if [[ "$MISSING_FIELDS" -eq 0 ]]; then
  echo "OK: All required fields present"
fi

echo ""

# --- Fix mode ---
if [[ "$FIX_MODE" == true ]]; then
  echo "--- Applying fixes ---"

  FIXED=$(jq '
    # Fix 1: Remove leads with no website_url
    .leads |= map(select(.website_url != null and .website_url != ""))
    # Fix 2: Fallback founder_name to product_name
    | .leads |= map(
        if (.founder_name == null or .founder_name == "") then .founder_name = .product_name else . end
      )
    # Fix 3: Deduplicate by website_url (keep first occurrence)
    | .leads |= (reduce .[] as $lead ([];
        if (map(.website_url) | index($lead.website_url)) then . else . + [$lead] end
      ))
    # Fix 4: Update metadata.total_leads
    | .metadata.total_leads = (.leads | length)
    | .metadata.last_updated = (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
  ' "$LEADS_FILE")

  echo "$FIXED" > "$LEADS_FILE"

  NEW_TOTAL=$(jq '.leads | length' "$LEADS_FILE")
  REMOVED=$((TOTAL - NEW_TOTAL))

  echo "Leads after fix: $NEW_TOTAL (removed $REMOVED)"
  echo "Wrote cleaned leads to $LEADS_FILE"
else
  echo "Run with --fix to auto-repair issues"
fi

echo ""
echo "=== Validation complete ==="
