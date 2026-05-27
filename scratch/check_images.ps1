$urls = @(
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=600"
)

Write-Host "Checking Unsplash Image URLs..."
$allOk = $true

foreach ($url in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10
        if ($res.StatusCode -eq 200) {
            Write-Host "OK: $url" -ForegroundColor Green
        } else {
            Write-Host "FAILED ($($res.StatusCode)): $url" -ForegroundColor Red
            $allOk = $false
        }
    } catch {
        Write-Host "ERROR: $url - Message: $_" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    Write-Host "`nAll images are valid and fully active!" -ForegroundColor Green
} else {
    Write-Host "`nSome images are broken or not loading." -ForegroundColor Yellow
}
