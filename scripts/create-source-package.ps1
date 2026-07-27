param(
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$projectName = Split-Path $projectRoot -Leaf
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path (Split-Path $projectRoot -Parent) "$projectName-source-$timestamp.zip"
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "listekutusu-source-$([Guid]::NewGuid().ToString('N'))"
$stagingProject = Join-Path $stagingRoot $projectName

$sourceDirectories = @("app", "lib", "public", "scripts", "tests")
$sourceFiles = @(
  ".env.example",
  ".eslintrc.json",
  ".gitignore",
  "DESIGN_SYSTEM.md",
  "LISTEKUTUSU_GUNCEL_ANALIZ_VE_YOL_HARITASI_2026-07-18.md",
  "middleware.ts",
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "playwright.config.ts",
  "postcss.config.js",
  "README.md",
  "RELEASE_CHECKLIST.md",
  "SOURCE_PACKAGE.md",
  "tailwind.config.ts",
  "tsconfig.json"
)

try {
  New-Item -ItemType Directory -Path $stagingProject -Force | Out-Null

  foreach ($directory in $sourceDirectories) {
    $source = Join-Path $projectRoot $directory
    if (Test-Path -LiteralPath $source) {
      Copy-Item -LiteralPath $source -Destination $stagingProject -Recurse -Force
    }
  }

  $prismaDestination = Join-Path $stagingProject "prisma"
  New-Item -ItemType Directory -Path $prismaDestination -Force | Out-Null
  $prismaSchema = Join-Path $projectRoot "prisma\schema.prisma"
  if (Test-Path -LiteralPath $prismaSchema) {
    Copy-Item -LiteralPath $prismaSchema -Destination $prismaDestination -Force
  }
  $prismaMigrations = Join-Path $projectRoot "prisma\migrations"
  if (Test-Path -LiteralPath $prismaMigrations) {
    Copy-Item -LiteralPath $prismaMigrations -Destination $prismaDestination -Recurse -Force
  }

  foreach ($file in $sourceFiles) {
    $source = Join-Path $projectRoot $file
    if (Test-Path -LiteralPath $source) {
      Copy-Item -LiteralPath $source -Destination $stagingProject -Force
    }
  }

  $forbidden = @(
    ".env",
    "node_modules",
    ".next",
    "backups",
    "playwright-report",
    "test-results"
  )

  foreach ($name in $forbidden) {
    if (Test-Path -LiteralPath (Join-Path $stagingProject $name)) {
      throw "Kaynak pakette yasakli oge bulundu: $name"
    }
  }

  $outputDirectory = Split-Path $resolvedOutput -Parent
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  if (Test-Path -LiteralPath $resolvedOutput) {
    Remove-Item -LiteralPath $resolvedOutput -Force
  }

  Compress-Archive -LiteralPath $stagingProject -DestinationPath $resolvedOutput -CompressionLevel Optimal
  Write-Host "Kaynak paketi olusturuldu: $resolvedOutput"
} finally {
  $resolvedStaging = [System.IO.Path]::GetFullPath($stagingRoot)
  $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolvedStaging.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
      (Test-Path -LiteralPath $resolvedStaging)) {
    Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
  }
}
