# Interactive script to set .env.local values for the campus recruitment app.
# Run with: powershell -ExecutionPolicy Bypass -File scripts\set-env.ps1
# Values are typed directly into the terminal — never sent through chat.

$envPath = Join-Path $PSScriptRoot "..\.env.local"

if (-not (Test-Path $envPath)) {
  Write-Host "ERROR: .env.local not found at $envPath" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting .env.local values" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll be prompted for 4 values. Paste each one and press Enter." -ForegroundColor Gray
Write-Host "Values stay on YOUR machine — not sent anywhere." -ForegroundColor Gray
Write-Host ""

$url   = Read-Host "1) VITE_SUPABASE_URL (e.g. https://xxx.supabase.co)"
$anon  = Read-Host "2) VITE_SUPABASE_ANON_KEY (long JWT starting with eyJ)"
$srvc  = Read-Host "3) SUPABASE_SERVICE_ROLE_KEY (another JWT, KEEP SECRET)"
$hrpwd = Read-Host "4) VITE_HR_PASSWORD (any password you'll remember for HR login)"

# Read current file and update only the 4 lines
$content = Get-Content $envPath
$updated = $content | ForEach-Object {
  if ($_ -match '^VITE_SUPABASE_URL=')        { "VITE_SUPABASE_URL=$url" }
  elseif ($_ -match '^VITE_SUPABASE_ANON_KEY=') { "VITE_SUPABASE_ANON_KEY=$anon" }
  elseif ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=') { "SUPABASE_SERVICE_ROLE_KEY=$srvc" }
  elseif ($_ -match '^VITE_HR_PASSWORD=')       { "VITE_HR_PASSWORD=$hrpwd" }
  else { $_ }
}

$updated | Set-Content $envPath -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  .env.local updated." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Values written (lengths only, not the values themselves):" -ForegroundColor Gray
Write-Host ("  VITE_SUPABASE_URL         = {0} chars" -f $url.Length)
Write-Host ("  VITE_SUPABASE_ANON_KEY    = {0} chars" -f $anon.Length)
Write-Host ("  SUPABASE_SERVICE_ROLE_KEY = {0} chars" -f $srvc.Length)
Write-Host ("  VITE_HR_PASSWORD          = {0} chars" -f $hrpwd.Length)
Write-Host ""
Write-Host "Next: restart your dev server (Ctrl+C, then npm run dev)" -ForegroundColor Yellow