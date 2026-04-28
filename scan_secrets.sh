#!/usr/bin/env bash
# ============================================================
# scan_secrets.sh — Pre-Commit Secret Scanner
#
# Findet versehentlich committete Secrets BEVOR sie auf GitHub
# landen. Optional als git pre-commit hook installierbar.
#
# Verwendung:
#   bash scan_secrets.sh                  # scant aktuellen Stand
#   bash scan_secrets.sh --staged         # nur staged files (für git hook)
#
# Installation als git hook:
#   ln -s ../../scan_secrets.sh .git/hooks/pre-commit
#   chmod +x scan_secrets.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# --- Patterns ---
# Format: NAME|REGEX|DESCRIPTION
PATTERNS=(
  'SUPABASE_SERVICE_ROLE|eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+role[\\\"]*:[\\\"]*service_role|Supabase service_role JWT — DARF NIEMALS INS FRONTEND'
  'STRIPE_SECRET|sk_(live|test)_[A-Za-z0-9]{20,}|Stripe Secret Key'
  'OPENAI_KEY|sk-[A-Za-z0-9]{20,}|OpenAI API Key'
  'ANTHROPIC_KEY|sk-ant-[A-Za-z0-9_-]{20,}|Anthropic API Key'
  'AWS_ACCESS|AKIA[A-Z0-9]{16}|AWS Access Key ID'
  'AWS_SECRET|aws[_-]?secret[_-]?access[_-]?key[\\\"]*[:=][\\\"]* *[A-Za-z0-9/+=]{40}|AWS Secret Access Key'
  'GITHUB_TOKEN|gh[pousr]_[A-Za-z0-9]{30,}|GitHub Token'
  'GOOGLE_API|AIza[A-Za-z0-9_-]{35}|Google API Key'
  'PRIVATE_KEY|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|Private Key'
  'JWT_SECRET|jwt[_-]?secret[\\\"]*[:=][\\\"]* *[A-Za-z0-9_-]{20,}|JWT Signing Secret'
  'SLACK_TOKEN|xox[baprs]-[A-Za-z0-9-]{10,}|Slack Token'
  'TWILIO_AUTH|SK[A-Za-z0-9]{32}|Twilio Auth Token'
  'SENDGRID_KEY|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}|SendGrid API Key'
  'GENERIC_PASSWORD|password[\\\"]*[:=][\\\"]* *[A-Za-z0-9!@#$%^&*]{8,}[\\\"]*|Hardcoded password — verdächtig'
)

# --- Welche Files scannen? ---
if [[ "${1:-}" == "--staged" ]]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(html|js|jsx|ts|tsx|json|env|yml|yaml|md|sh)$' || true)
  MODE="staged"
else
  FILES=$(find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" \) \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./dist/*" \
    -not -path "./build/node_modules/*" 2>/dev/null || true)
  MODE="all files"
fi

if [[ -z "$FILES" ]]; then
  echo -e "${GREEN}[scan-secrets] Keine zu scannenden Files.${NC}"
  exit 0
fi

echo -e "${GREEN}[scan-secrets]${NC} Scanne $MODE..."

FOUND=0
for entry in "${PATTERNS[@]}"; do
  IFS='|' read -r name regex desc <<< "$entry"
  for f in $FILES; do
    [[ ! -f "$f" ]] && continue
    # Suchen
    matches=$(grep -nP "$regex" "$f" 2>/dev/null || true)
    if [[ -n "$matches" ]]; then
      # Whitelist: anon-Key in config.js ist OK
      if [[ "$f" == *"config.js" ]] && [[ "$name" == "SUPABASE_SERVICE_ROLE" ]]; then
        # Nochmal prüfen — anon ist OK, service_role nicht
        if echo "$matches" | grep -q '"role":"service_role"'; then
          : # weitermachen → blocken
        else
          continue # ist nur anon → OK
        fi
      fi
      echo -e "${RED}[FUND]${NC} ${name} in ${f}"
      echo -e "       ${YELLOW}${desc}${NC}"
      echo "$matches" | head -3 | sed 's/^/       /'
      echo ""
      FOUND=$((FOUND+1))
    fi
  done
done

if [[ $FOUND -gt 0 ]]; then
  echo -e "${RED}[scan-secrets] $FOUND Fund(e). Commit gestoppt.${NC}"
  echo -e "${YELLOW}Wenn ein Fund OK ist (false positive), schreib es klar als Kommentar in den Commit oder nutze 'git commit --no-verify'.${NC}"
  exit 1
fi

echo -e "${GREEN}[scan-secrets] Keine Secrets gefunden. ✓${NC}"
exit 0
