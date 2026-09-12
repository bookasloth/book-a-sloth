# blog-autopost.ps1 — headless daily blog publisher (Book A Sloth)
# Run by Windows Task Scheduler. Ensures a clean repo on main, then hands the
# whole pipeline to Claude Code headless via the /blog-autopost skill.
#
#   powershell -ExecutionPolicy Bypass -File scripts\blog-autopost.ps1 -Mode marketing
#   powershell -ExecutionPolicy Bypass -File scripts\blog-autopost.ps1 -Mode recap
#
# Fully autonomous: --dangerously-skip-permissions lets the run merge blog-only
# PRs and seed both DBs without prompts. The /blog-autopost quality gate + the
# blog-only-diff scope check are the guardrails (see .claude/skills/blog-autopost).

param(
  [ValidateSet('marketing','recap')]
  [string]$Mode = 'marketing'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot   # repo root (scripts/ -> ..)
Set-Location $repo

$log = Join-Path $repo 'scratch\blog-autopost-runner.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
function Log($m) { "$([DateTime]::Now.ToString('s'))  $m" | Tee-Object -FilePath $log -Append }

Log "=== run start: mode=$Mode ==="

# Refuse to run on a dirty tree — an in-progress edit would get swept into the PR.
$dirty = git status --porcelain
if ($dirty) { Log "ABORT: working tree not clean"; exit 1 }

# Start from fresh main so the optimizer branches from current origin/main.
git fetch origin --quiet
git checkout main --quiet
git reset --hard origin/main --quiet
Log "on main @ $(git rev-parse --short HEAD)"

# Hand off to Claude headless. The skill does select -> optimize -> gate ->
# scope-check -> merge -> seed both DBs -> archive.
$prompt = "/blog-autopost $Mode"
claude -p $prompt --dangerously-skip-permissions 2>&1 | Tee-Object -FilePath $log -Append
$code = $LASTEXITCODE
Log "=== run end: exit=$code ==="
exit $code
