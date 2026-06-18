import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const lock = JSON.parse(await readFile(join(repoRoot, "package-lock.json"), "utf8"));

const releaseRoot = join(repoRoot, "release");
const releaseName = `${pkg.name}-v${pkg.version}-windows`;
const stage = join(releaseRoot, releaseName);
const app = join(stage, "app");
const zipPath = join(releaseRoot, `${releaseName}.zip`);

await rm(stage, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(app, { recursive: true });

for (const entry of ["dist", "prompts", "package.json", "package-lock.json", "LICENSE", "NOTICE", "README.md"]) {
  await cp(join(repoRoot, entry), join(app, entry), { recursive: true });
}

await copyProductionNodeModules();
await writeFile(join(stage, "install.ps1"), installScript(pkg), "utf8");
await writeFile(join(stage, "uninstall.ps1"), uninstallScript(), "utf8");
await writeFile(join(stage, "README-WINDOWS.md"), releaseReadme(pkg), "utf8");
await writeFile(join(app, "uninstall.ps1"), uninstallScript(), "utf8");

execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `$items = Get-ChildItem -LiteralPath '${stage.replaceAll("'", "''")}'; Compress-Archive -LiteralPath $items.FullName -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force; if (-not (Test-Path -LiteralPath '${zipPath.replaceAll("'", "''")}')) { throw 'Archive was not created.' }`
  ],
  { stdio: "inherit" }
);

console.log(`Windows release created: ${zipPath}`);

async function copyProductionNodeModules() {
  const packages = lock.packages ?? {};
  const prodEntries = Object.entries(packages)
    .filter(([key, value]) => key.startsWith("node_modules/") && value?.dev !== true)
    .map(([key]) => key);

  const copied = new Set();
  for (const key of prodEntries) {
    const parts = key.split("/");
    const packageRoot = parts[1]?.startsWith("@") ? parts.slice(0, 3).join("/") : parts.slice(0, 2).join("/");
    if (!packageRoot || copied.has(packageRoot)) continue;
    copied.add(packageRoot);

    const source = join(repoRoot, packageRoot);
    if (!existsSync(source)) {
      throw new Error(`Production dependency missing from node_modules: ${packageRoot}`);
    }
    await cp(source, join(app, packageRoot), {
      recursive: true,
      filter: (src) => basename(src) !== ".cache"
    });
  }
}

function installScript(packageJson) {
  const binNames = Object.keys(packageJson.bin ?? {});
  const shimLines = binNames.map((name) => {
    const target = packageJson.bin[name].replace("./", "").replaceAll("/", "\\");
    return [
      `$${toVar(name)} = @'`,
      "@echo off",
      `node "%~dp0..\\${target}" %*`,
      "'@",
      `Set-Content -LiteralPath (Join-Path $BinDir "${name}.cmd") -Value $${toVar(name)} -Encoding ASCII`
    ].join("\n");
  }).join("\n\n");

  return `param(
  [string]$InstallDir = "$env:LOCALAPPDATA\\AbyssStack",
  [switch]$NoPath
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required. Install Node.js 22 LTS or newer, then rerun install.ps1."
}

$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppSource = Join-Path $SourceDir "app"
$BinDir = Join-Path $InstallDir "bin"

if (-not (Test-Path -LiteralPath $AppSource)) {
  throw "Missing app payload next to install.ps1."
}

if (Test-Path -LiteralPath $InstallDir) {
  Remove-Item -LiteralPath $InstallDir -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item -Path (Join-Path $AppSource "*") -Destination $InstallDir -Recurse -Force
New-Item -ItemType Directory -Path $BinDir -Force | Out-Null

${shimLines}

if (-not $NoPath) {
  $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $Parts = @()
  if ($UserPath) {
    $Parts = $UserPath -split ";" | Where-Object { $_ }
  }
  if ($Parts -notcontains $BinDir) {
    $NewPath = (@($Parts) + $BinDir) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
  }
}

Write-Host "Abyss Stack installed to $InstallDir"
Write-Host "Commands installed: ${binNames.join(", ")}"
Write-Host "Open a new terminal, then run: abyssstack --help"
`;
}

function uninstallScript() {
  return `param(
  [string]$InstallDir = "$env:LOCALAPPDATA\\AbyssStack"
)

$ErrorActionPreference = "Stop"
$BinDir = Join-Path $InstallDir "bin"
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($UserPath) {
  $NewPath = (($UserPath -split ";") | Where-Object { $_ -and $_ -ne $BinDir }) -join ";"
  [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
}

if (Test-Path -LiteralPath $InstallDir) {
  Remove-Item -LiteralPath $InstallDir -Recurse -Force
}

Write-Host "Abyss Stack removed from $InstallDir"
Write-Host "Open a new terminal so PATH changes take effect."
`;
}

function releaseReadme(packageJson) {
  return `# Abyss Stack Windows Release

Version: ${packageJson.version}

## Requirements

- Windows PowerShell
- Node.js 22 LTS or newer

## Install

From the extracted release folder:

\`\`\`powershell
powershell -ExecutionPolicy Bypass -File .\\install.ps1
\`\`\`

The installer copies the app to \`$env:LOCALAPPDATA\\AbyssStack\`, creates command shims, and adds the shim folder to the user PATH.

Open a new terminal after installation.

## Commands

- \`abyss\`
- \`abyssstack\`
- \`antti\`
- \`antti-mcp\`
- \`antti-mcp-http\`

## Smoke Test

\`\`\`powershell
abyss --mode diagnose "Power BI definitions live in Excel before go-live"
abyss depress "going forward we will leverage synergies"
abyss thunderdome
\`\`\`

## Uninstall

\`\`\`powershell
powershell -ExecutionPolicy Bypass -File .\\uninstall.ps1
\`\`\`
`;
}

function toVar(name) {
  return name.replaceAll("-", "_").replaceAll(".", "_");
}
