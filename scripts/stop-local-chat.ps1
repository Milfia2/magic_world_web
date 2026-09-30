$ErrorActionPreference = 'Stop'
$runtimeRoot = Join-Path (Split-Path -Parent $PSScriptRoot) '.local-llm'
$processFile = Join-Path $runtimeRoot 'processes.json'
if (!(Test-Path $processFile)) { return }
foreach ($record in @(Get-Content -Raw $processFile | ConvertFrom-Json)) {
  $process = Get-Process -Id $record.id -ErrorAction SilentlyContinue
  if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$record.started).ToUniversalTime().Ticks) {
    Stop-Process -Id $process.Id
    Write-Output "Stopped $($record.name)."
  }
}
