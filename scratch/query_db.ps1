$connectionString = "Server=100.123.181.94,1433;Database=PhotoStudioBooking;User Id=sa;Password=Khaidz12345;TrustServerCertificate=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $connection.Open()
    Write-Host "Connected successfully!" -ForegroundColor Green

    # Query all services to check if they are in the database
    Write-Host "--- ALL SERVICES IN DATABASE ---"
    $cmd = New-Object System.Data.SqlClient.SqlCommand("SELECT service_id, studio_id, service_name, is_active FROM services", $connection)
    $reader = $cmd.ExecuteReader()
    $count = 0
    while ($reader.Read()) {
        Write-Host "ServiceId: $($reader['service_id']) | StudioId: $($reader['studio_id']) | ServiceName: $($reader['service_name']) | Active: $($reader['is_active'])"
        $count++
    }
    $reader.Close()
    Write-Host "Total Services in DB: $count" -ForegroundColor Green

} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
} finally {
    $connection.Close()
}
