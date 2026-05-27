$apiKey = "AIzaSyB0rInIPg4S_Mp4SkU4bfq6cZ4KtemDpcQ"
$model = "gemini-3.1-flash-lite"

$body = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Xin chào"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 5

$url = "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}"

for ($i = 1; $i -le 5; $i++) {
    Write-Host "Test request $i..."
    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
        Write-Host "Success! Response: $($res.candidates[0].content.parts[0].text)" -ForegroundColor Green
    } catch {
        Write-Host "Failed!" -ForegroundColor Red
        $err = $_.Exception.Response
        if ($err) {
            $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
            $reader.BaseStream.Position = 0
            $errBody = $reader.ReadToEnd()
            Write-Host $errBody -ForegroundColor Red
        } else {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
        break
    }
}
