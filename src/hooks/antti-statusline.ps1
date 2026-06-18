# Abyss Stack statusline — outputs current mode badge for Claude Code status bar.
$configDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE ".claude" }
$flagPath = Join-Path $configDir ".abyss-active"

if (-not (Test-Path $flagPath)) { exit 0 }

$mode = (Get-Content $flagPath -Raw).Trim()

switch ($mode) {
  "off"   { exit 0 }
  "on"    { Write-Output "⚡ Abyss" }
  "roast" { Write-Output "🔥 Abyss:roast" }
  "safe"  { Write-Output "🛡 Abyss:safe" }
  default { Write-Output "⚡ Abyss:$mode" }
}
