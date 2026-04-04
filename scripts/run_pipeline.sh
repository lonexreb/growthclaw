#!/usr/bin/env bash
#
# run_pipeline.sh — end-to-end GrowthClaw trigger
#
# This is THE command Shubh runs during the live demo. One invocation →
# founder-scout → enrich-qualify → outreach-draft → dashboard update.
#
# Usage:
#   scripts/run_pipeline.sh               # full run
#   scripts/run_pipeline.sh --dry-run     # skip skill execution, only refresh dashboard
#   scripts/run_pipeline.sh --demo        # demo mode: extra-loud banners, timing
#   scripts/run_pipeline.sh --skip-scout  # start at enrich (useful when leads.json is pre-seeded)
#
# Each skill is invoked via a tiny wrapper:
#   - If a `scripts/run_<skill>.sh` exists, that is used (drop-in per-skill entry point
#     the other three teammates can fill in).
#   - Otherwise falls back to `openclaw agent` with the SKILL.md path.
#   - Otherwise prints a clear STUB notice and continues — the dashboard will still refresh
#     from whatever is already in leads.json, so the demo never hard-fails.
#
# Exit codes:
#   0 = pipeline completed (including stubbed skills)
#   1 = bad usage / environment issue
#   2 = dashboard update failed
#
# Owned by: Viren (delivery layer)

set -uo pipefail  # note: NOT -e — we want to continue past stubbed skills

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---- Args --------------------------------------------------------------------
DRY_RUN=0
DEMO=0
SKIP_SCOUT=0
SKIP_ENRICH=0
SKIP_OUTREACH=0
for arg in "$@"; do
  case "$arg" in
    --dry-run)      DRY_RUN=1 ;;
    --demo)         DEMO=1 ;;
    --skip-scout)   SKIP_SCOUT=1 ;;
    --skip-enrich)  SKIP_ENRICH=1 ;;
    --skip-outreach) SKIP_OUTREACH=1 ;;
    -h|--help)
      grep -E '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

# ---- Colors (demo mode cranks them up) ---------------------------------------
if [[ -t 1 ]]; then
  BOLD=$'\e[1m'; DIM=$'\e[2m'; RED=$'\e[31m'; GRN=$'\e[32m'
  YEL=$'\e[33m'; BLU=$'\e[34m'; MAG=$'\e[35m'; CYA=$'\e[36m'; RST=$'\e[0m'
else
  BOLD=""; DIM=""; RED=""; GRN=""; YEL=""; BLU=""; MAG=""; CYA=""; RST=""
fi

banner() {
  local title="$1"
  if (( DEMO )); then
    echo
    echo "${MAG}╔══════════════════════════════════════════════════════════════╗${RST}"
    printf "${MAG}║${RST} ${BOLD}%-60s${RST} ${MAG}║${RST}\n" "$title"
    echo "${MAG}╚══════════════════════════════════════════════════════════════╝${RST}"
  else
    echo
    echo "${BOLD}${BLU}▶ $title${RST}"
  fi
}

note()  { echo "${DIM}  · $*${RST}"; }
ok()    { echo "${GRN}  ✓ $*${RST}"; }
warn()  { echo "${YEL}  ⚠ $*${RST}"; }
err()   { echo "${RED}  ✗ $*${RST}"; }

# ---- Environment check -------------------------------------------------------
banner "GrowthClaw pipeline starting"
note "root: $ROOT"
note "dry-run: $DRY_RUN · demo: $DEMO"

if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ROOT/.env.local" | grep -E '^(SLACK_|ANTHROPIC_|OPENAI_)' | xargs)
  ok "loaded .env.local"
else
  warn ".env.local not found — Slack posting will fall back to dashboard.md"
fi

if ! command -v jq >/dev/null 2>&1; then
  err "jq is required (brew install jq)"; exit 1
fi

mkdir -p "$ROOT/data"
[[ -f "$ROOT/data/leads.json" ]] || echo '{"metadata":{"project":"growthclaw","version":"1.0","last_updated":null,"total_leads":0},"leads":[]}' > "$ROOT/data/leads.json"

# ---- Skill runner ------------------------------------------------------------
# Prefer scripts/run_<skill>.sh (each teammate's entry point).
# Fall back to openclaw agent with the SKILL.md file.
# Fall back to a stub notice.
run_skill() {
  local name="$1"
  local skill_path="skills/${name}/SKILL.md"
  local wrapper="scripts/run_${name//-/_}.sh"

  local start_ts=$SECONDS

  if (( DRY_RUN )); then
    note "DRY-RUN: skipping $name"
    return 0
  fi

  if [[ -x "$wrapper" ]]; then
    note "invoking $wrapper"
    if bash "$wrapper"; then
      ok "$name completed in $((SECONDS - start_ts))s (via wrapper)"
      return 0
    else
      err "$name wrapper exited non-zero — continuing pipeline"
      return 0
    fi
  fi

  if command -v openclaw >/dev/null 2>&1 && [[ -f "$skill_path" ]]; then
    note "invoking: openclaw agent -m 'run $name skill'"
    if openclaw agent -m "run the $name skill from $skill_path" 2>&1 | sed 's/^/    /'; then
      ok "$name completed in $((SECONDS - start_ts))s (via openclaw)"
      return 0
    else
      warn "openclaw invocation failed or not yet wired — treating as stub"
    fi
  fi

  warn "$name: STUB (no wrapper, no openclaw entry point). Skipping execution — dashboard will still refresh from existing leads.json."
  return 0
}

# ---- Pipeline stages ---------------------------------------------------------
PIPELINE_START=$SECONDS

if (( ! SKIP_SCOUT )); then
  banner "Stage 1/3 — Founder Scout"
  note "Browses Product Hunt, Indie Hackers, Reddit for new launches"
  run_skill "founder-scout"
else
  warn "skipping founder-scout (--skip-scout)"
fi

if (( ! SKIP_ENRICH )); then
  banner "Stage 2/3 — Enrich & Qualify"
  note "Visits each lead's website, scores marketing gaps, assigns priority tier"
  run_skill "enrich-qualify"
else
  warn "skipping enrich-qualify (--skip-enrich)"
fi

if (( ! SKIP_OUTREACH )); then
  banner "Stage 3/3 — Outreach Draft"
  note "Generates personalized messages, posts qualified leads to #all-growthclaw"
  run_skill "outreach-draft"
else
  warn "skipping outreach-draft (--skip-outreach)"
fi

# ---- Dashboard refresh -------------------------------------------------------
banner "Dashboard refresh"
if bash "$ROOT/scripts/update_dashboard.sh"; then
  ok "dashboard regenerated at data/dashboard.md"
else
  err "dashboard update failed"
  exit 2
fi

# ---- Summary -----------------------------------------------------------------
ELAPSED=$((SECONDS - PIPELINE_START))
SCOUTED=$(jq '[.leads[]] | length' "$ROOT/data/leads.json")
DRAFTED=$(jq '[.leads[] | select(.status == "outreach-drafted")] | length' "$ROOT/data/leads.json")
SKIPPED=$(jq '[.leads[] | select(.status == "skipped")] | length' "$ROOT/data/leads.json")

banner "Pipeline complete"
echo "${BOLD}  Total leads in store:${RST}   ${CYA}$SCOUTED${RST}"
echo "${BOLD}  Outreach drafted:${RST}       ${GRN}$DRAFTED${RST}"
echo "${BOLD}  Skipped (score ≥ 9):${RST}    ${DIM}$SKIPPED${RST}"
echo "${BOLD}  Wall time:${RST}              ${ELAPSED}s"
echo
note "Dashboard: data/dashboard.md"
note "Slack:     #all-growthclaw"
echo
