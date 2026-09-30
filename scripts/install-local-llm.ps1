$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.local-llm'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
$ollamaRoot = Join-Path $runtimeRoot 'ollama'
if (!(Test-Path (Join-Path $ollamaRoot 'ollama.exe'))) {
  $archivePath = Join-Path $runtimeRoot 'ollama-windows-amd64.zip'
  $release = Invoke-RestMethod 'https://api.github.com/repos/ollama/ollama/releases/tags/v0.35.0'
  $asset = $release.assets | Where-Object name -eq 'ollama-windows-amd64.zip'
  if (!(Test-Path $archivePath) -or (Get-Item $archivePath).Length -ne $asset.size) {
    $downloadUrl = $asset.browser_download_url
    $partSize = [long][Math]::Ceiling($asset.size / 16)
    $totalSize = [long]$asset.size
    0..15 | ForEach-Object -Parallel {
      $index = $_
      $start = $index * $using:partSize
      $end = [Math]::Min($using:totalSize - 1, $start + $using:partSize - 1)
      $partPath = "$using:archivePath.part$index"
      if (!(Test-Path $partPath) -or (Get-Item $partPath).Length -ne ($end - $start + 1)) {
        & curl.exe --silent --show-error --fail --location --retry 3 --range "$start-$end" --output $partPath $using:downloadUrl
        if ($LASTEXITCODE -ne 0) { throw "Download part $index failed" }
      }
      if ((Get-Item $partPath).Length -ne ($end - $start + 1)) { throw "Invalid part $index" }
      Write-Output "Downloaded part $index/15"
    } -ThrottleLimit 16
    $outputStream = [IO.File]::Create($archivePath)
    try {
      foreach ($index in 0..15) {
        $partStream = [IO.File]::OpenRead("$archivePath.part$index")
        try { $partStream.CopyTo($outputStream) } finally { $partStream.Dispose() }
      }
    } finally { $outputStream.Dispose() }
  }
  if ($asset.digest -and ('sha256:' + (Get-FileHash $archivePath -Algorithm SHA256).Hash.ToLower()) -ne $asset.digest) { throw 'Ollama checksum mismatch' }
  Expand-Archive -LiteralPath $archivePath -DestinationPath $ollamaRoot -Force
}
$tunnelExe = Join-Path $runtimeRoot 'cloudflared.exe'
if (!(Test-Path $tunnelExe)) {
  & curl.exe --fail --location --retry 3 --output $tunnelExe 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
  if ($LASTEXITCODE -ne 0) { throw 'cloudflared download failed' }
}
Write-Output 'Dedicated local runtime installed in .local-llm.'
