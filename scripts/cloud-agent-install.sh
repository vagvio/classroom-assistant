#!/usr/bin/env bash
# Cloud Agent install: durable, idempotent setup baked into the environment snapshot.
# Installs system tooling (Docker, Supabase CLI, psql), Node dependencies, and
# pre-pulls the Supabase Docker images so per-boot startup is fast.
set -euo pipefail

cd "$(dirname "$0")/.."

# --- System packages -------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
fi

sudo apt-get update -qq
sudo apt-get install -y -qq fuse-overlayfs postgresql-client

# Docker inside the Cloud Agent VM is nested; the default overlayfs snapshotter
# cannot mount, so use the fuse-overlayfs storage driver instead.
sudo mkdir -p /etc/docker
printf '%s\n' '{ "storage-driver": "fuse-overlayfs", "features": { "containerd-snapshotter": false } }' \
  | sudo tee /etc/docker/daemon.json >/dev/null

# --- Supabase CLI ----------------------------------------------------------
if ! command -v supabase >/dev/null 2>&1; then
  ARCH="$(dpkg --print-architecture)"
  curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_linux_${ARCH}.tar.gz" -o /tmp/supabase.tar.gz
  tar -xzf /tmp/supabase.tar.gz -C /tmp supabase
  sudo mv /tmp/supabase /usr/local/bin/supabase
fi

# --- Node dependencies -----------------------------------------------------
npm ci

# --- Warm the Supabase image cache into the snapshot -----------------------
# `service docker start` exits non-zero when the daemon is already running.
sudo service docker start || true
# Same-bridge container traffic is dropped by legacy iptables in this nested VM;
# stop the bridge from passing L2 traffic through iptables so containers can talk.
sudo sysctl -w net.bridge.bridge-nf-call-iptables=0 net.bridge.bridge-nf-call-ip6tables=0 || true
for _ in $(seq 1 30); do sudo docker info >/dev/null 2>&1 && break; sleep 1; done

supabase start || true
supabase stop --no-backup || true

echo "cloud-agent-install complete"
