$connectionString = "Server=100.123.181.94,1433;Database=PhotoStudioBooking;User Id=sa;Password=Khaidz12345;TrustServerCertificate=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $connection.Open()
    Write-Host "Connected successfully!" -ForegroundColor Green

    # 1. Query all studios
    Write-Host "--- ALL STUDIOS ---"
    $query = "SELECT studio_id, studio_name, status FROM studios"
    $cmd = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
    $reader = $cmd.ExecuteReader()
    $studios = @()
    while ($reader.Read()) {
        $id = $reader['studio_id']
        $name = $reader['studio_name']
        $status = $reader['status']
        Write-Host "StudioId: $id | StudioName: $name | Status: $status" -ForegroundColor Cyan
        $studios += $id
    }
    $reader.Close()

    # 2. Query working days of all studios
    if ($studios.Count -gt 0) {
        $idsStr = $studios -join ","
        Write-Host "`n--- Working Days for All Studios ---"
        $query2 = "SELECT working_day_id, studio_id, working_date, is_available, note FROM working_days ORDER BY working_date"
        $cmd2 = New-Object System.Data.SqlClient.SqlCommand($query2, $connection)
        $reader2 = $cmd2.ExecuteReader()
        while ($reader2.Read()) {
            Write-Host "WorkingDayId: $($reader2['working_day_id']) | StudioId: $($reader2['studio_id']) | Date: $($reader2['working_date']) | Available: $($reader2['is_available']) | Note: $($reader2['note'])" -ForegroundColor Green
        }
        $reader2.Close()

        # 3. Query slots
        Write-Host "`n--- Slots ---"
        $query3 = "SELECT ts.slot_id, ts.working_day_id, wd.studio_id, wd.working_date, ts.start_time, ts.end_time, ts.status 
                  FROM time_slots ts
                  JOIN working_days wd ON ts.working_day_id = wd.working_day_id
                  ORDER BY wd.working_date, ts.start_time"
        $cmd3 = New-Object System.Data.SqlClient.SqlCommand($query3, $connection)
        $reader3 = $cmd3.ExecuteReader()
        $count = 0
        while ($reader3.Read()) {
            if ($count -lt 50) {
                Write-Host "SlotId: $($reader3['slot_id']) | StudioId: $($reader3['studio_id']) | Date: $($reader3['working_date']) | Time: $($reader3['start_time']) - $($reader3['end_time']) | Status: $($reader3['status'])"
            }
            $count++
        }
        $reader3.Close()
        Write-Host "Total slots: $count" -ForegroundColor Green
    }

} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
} finally {
    $connection.Close()
}
