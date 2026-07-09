#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

unit_status="PASS"
integration_status="PASS"
e2e_status="PASS"

echo "=== MCS Web — full test run ==="
echo ""

echo "[1/3] Unit tests (Vitest)"
if npm run test:unit; then
  echo "  → unit: PASS"
else
  unit_status="FAIL"
  echo "  → unit: FAIL"
fi
echo ""

echo "[2/3] Integration tests (Vitest)"
if npm run test:integration; then
  echo "  → integration: PASS"
else
  integration_status="FAIL"
  echo "  → integration: FAIL"
fi
echo ""

echo "[3/3] E2E tests (Playwright)"
if npm run test:e2e; then
  echo "  → e2e: PASS"
else
  e2e_status="FAIL"
  echo "  → e2e: FAIL"
fi
echo ""

echo "=== Test report ==="
printf "  %-14s %s\n" "Unit" "$unit_status"
printf "  %-14s %s\n" "Integration" "$integration_status"
printf "  %-14s %s\n" "E2E" "$e2e_status"
echo ""

if [[ "$unit_status" == "FAIL" || "$integration_status" == "FAIL" || "$e2e_status" == "FAIL" ]]; then
  echo "Overall: FAIL"
  exit 1
fi

echo "Overall: PASS"
exit 0
