# Secure env-var setter using Read-Host -AsSecureString.
# Typed values are NOT stored in PowerShell history and are zeroed after use.
# Run: powershell -ExecutionPolicy Bypass -File scripts\set-env-secure.ps1

$envPath = Join-Path $PSScriptRoot "..\.env.local"

if (-not (Test-Path $envPath)) {
  Write-Host "ERROR: .env.local not found at $envPath" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Secure .env.local setter" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Values are typed as SecureString (shown as ****)." -ForegroundColor Gray
Write-Host "Not echoed to console, not in shell history." -ForegroundColor Gray
Write-Host ""

# Read everything as SecureString
$secUrl  = Read-Host "1) VITE_SUPABASE_URL" -AsSecureString
$secAnon = Read-Host "2) VITE_SUPABASE_ANON_KEY" -AsSecureString
$secHr   = Read-Host "3) VITE_HR_PASSWORD" -AsSecureString

# Convert SecureString -> plain text in memory only
function ConvertTo-Plain([System.Security.SecureString]$s) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try   { [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null }
}

$url  = ConvertTo-Plain $secUrl
$anon = ConvertTo-Plain $secAnon
$hr   = ConvertTo-Plain $secHr

# service_role_key is intentionally omitted from MVP — not used by frontend.
# If we add Edge Functions later, prompt for it then.

# Read current file, replace ONLY the 3 keys we care about
$content = Get-Content $envPath
$content = $content | ForEach-Object {
  if     ($_ -match '^VITE_SUPABASE_URL=')      { "VITE_SUPABASE_URL=$url" }
  elseif ($_ -match '^VITE_SUPABASE_ANON_KEY=') { "VITE_SUPABASE_ANON_KEY=$anon" }
  elseif ($_ -match '^VITE_HR_PASSWORD=')       { "VITE_HR_PASSWORD=$hr" }
  elseif ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=.*$') { '# SUPABASE_SERVICE_ROLE_KEY=  (omitted — not used by frontend)' }
  else { $_ }
}

# Add VITE_HR_PASSWORD line if it doesn't exist yet
if (-not ($content -match '^VITE_HR_PASSWORD=')) {
  $content += "VITE_HR_PASSWORD=$hr"
}

$content | Set-Content $envPath -Encoding UTF8

# Zero out the plaintext strings ASAP
[System.GC]::Collect()
$url = $null; $anon = $null; $hr = $null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  .env.local updated (3 keys, 1 line scrubbed)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Lengths written (NOT values):" -ForegroundColor Gray
Write-Host "  VITE_SUPABASE_URL      - check len" -ForegroundColor DarkGray
Write-Host "  VITE_SUPABASE_ANON_KEY - check len" -ForegroundColor DarkGray
Write-Host "  VITE_HR_PASSWORD       - check len" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Restart: Ctrl+C, then npm run dev" -ForegroundColor Yellow