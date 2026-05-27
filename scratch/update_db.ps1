$connectionString = "Server=100.123.181.94,1433;Database=PhotoStudioBooking;User Id=sa;Password=Khaidz12345;TrustServerCertificate=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $connection.Open()
    Write-Host "Connected successfully!" -ForegroundColor Green

    # 1. Update Service 3 to have "ngoại cảnh" and "cưới" in its name
    $query1 = "UPDATE services SET service_name = N'Chụp Ảnh Cưới Ngoại Cảnh Đà Lạt Mộng Mơ' WHERE service_id = 3"
    $cmd1 = New-Object System.Data.SqlClient.SqlCommand($query1, $connection)
    $rows1 = $cmd1.ExecuteNonQuery()
    Write-Host "Updated Service 3 name. Rows affected: $rows1" -ForegroundColor Green

    # 2. Update Service 43 and 53 to have "ngoại cảnh" in their name
    $query2 = "UPDATE services SET service_name = N'Chụp Ngoại Cảnh Cặp Đôi Sunset Bãi Biển Mỹ Khê' WHERE service_id IN (43, 53)"
    $cmd2 = New-Object System.Data.SqlClient.SqlCommand($query2, $connection)
    $rows2 = $cmd2.ExecuteNonQuery()
    Write-Host "Updated Services 43 & 53 name. Rows affected: $rows2" -ForegroundColor Green

} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
} finally {
    $connection.Close()
}
