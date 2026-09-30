param([switch]$Tunnel)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.local-llm'
$ollamaExe = Join-Path $runtimeRoot 'ollama\ollama.exe'
if (!(Test-Path $ollamaExe)) { throw 'Run scripts/install-local-llm.ps1 first.' }
$env:OLLAMA_HOST = '127.0.0.1:11435'
$env:OLLAMA_MODELS = Join-Path $runtimeRoot 'models'
$env:OLLAMA_CONTEXT_LENGTH = '8192'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_KEEP_ALIVE = '10m'
New-Item -ItemType Directory -Force -Path $env:OLLAMA_MODELS | Out-Null
$processFile = Join-Path $runtimeRoot 'processes.json'
$tracked = @()
if (Test-Path $processFile) { $tracked = @(Get-Content -Raw $processFile | ConvertFrom-Json) }
function Start-Tracked($exe, $arguments, $name) {
  $record = $script:tracked | Where-Object name -eq $name | Select-Object -Last 1
  if ($record) {
    $existing = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    if ($existing -and $existing.StartTime.ToUniversalTime().Ticks -eq ([datetime]$record.started).ToUniversalTime().Ticks) { return }
  }
  $process = Start-Process -FilePath $exe -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeRoot "$name.out.log") -RedirectStandardError (Join-Path $runtimeRoot "$name.err.log")
  if ($process.WaitForExit(1000)) { throw "$name exited during startup. Check .local-llm/$name.err.log; the port may already be in use." }
  $script:tracked = @($script:tracked | Where-Object name -ne $name) + @{ name=$name; id=$process.Id; started=$process.StartTime.ToUniversalTime().ToString('o') }
  ConvertTo-Json -InputObject @($script:tracked) | Set-Content -LiteralPath $processFile -Encoding utf8
}
Start-Tracked $ollamaExe 'serve' 'ollama'
$nodeExe = (Get-Command node -ErrorAction Stop).Source
Start-Tracked $nodeExe ('"' + (Join-Path $projectRoot 'local-chat\server.mjs') + '"') 'gateway'
if ($Tunnel) {
  $tokenFile = Join-Path $runtimeRoot 'tunnel-token.txt'
  if (!(Test-Path $tokenFile)) { throw 'Save the Cloudflare named tunnel token to .local-llm/tunnel-token.txt first.' }
  Start-Tracked (Join-Path $runtimeRoot 'cloudflared.exe') ('tunnel --no-autoupdate run --token-file "' + $tokenFile + '"') 'tunnel'
}
Write-Output 'Local model: 127.0.0.1:11435; chat gateway: 127.0.0.1:8787.'
Write-Output 'Connection password: .local-llm/config.json. Logs: .local-llm/*.log.'
