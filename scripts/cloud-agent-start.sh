#!/usr/bin/env bash
# Cloud Agent start: per-boot reconciliation. Brings up Docker and the Supabase
# local stack, applies the (idempotent) schema, and writes .env.local from the
# live Supabase credentials. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

# --- Docker daemon + nested-VM bridge networking fix -----------------------
# `service docker start` exits non-zero when the daemon is already running.
sudo service docker start || true
sudo sysctl -w net.bridge.bridge-nf-call-iptables=0 net.bridge.bridge-nf-call-ip6tables=0 || true

for _ in $(seq 1 30); do sudo docker info >/dev/null 2>&1 && break; sleep 1; done
sudo chmod 666 /var/run/docker.sock || true

# --- Supabase local stack (idempotent) -------------------------------------
supabase start

# --- Apply schema (schema.sql is fully idempotent) -------------------------
DB_URL="$(supabase status -o env | sed -n 's/^DB_URL="\(.*\)"$/\1/p')"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql >/dev/null

# --- Generate .env.local from live Supabase credentials --------------------
STATUS="$(supabase status -o env)"
API_URL="$(printf '%s\n' "$STATUS" | sed -n 's/^API_URL="\(.*\)"$/\1/p')"
PUBLISHABLE_KEY="$(printf '%s\n' "$STATUS" | sed -n 's/^PUBLISHABLE_KEY="\(.*\)"$/\1/p')"
ANON_KEY="$(printf '%s\n' "$STATUS" | sed -n 's/^ANON_KEY="\(.*\)"$/\1/p')"

cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY:-$ANON_KEY}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

echo "cloud-agent-start complete: Supabase up, schema applied, .env.local written"
