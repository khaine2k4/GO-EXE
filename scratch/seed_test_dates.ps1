$connectionString = "Server=100.123.181.94,1433;Database=PhotoStudioBooking;User Id=sa;Password=Khaidz12345;TrustServerCertificate=True;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
try {
    $connection.Open()
    Write-Host "Connected successfully!" -ForegroundColor Green

    $studioId = 1 # Hùng Camera & Studio

    # Clean up existing test days if any
    Write-Host "Cleaning up existing working days for May 27-31, 2026..."
    $cleanupSlots = "DELETE FROM time_slots WHERE working_day_id IN (
                         SELECT working_day_id FROM working_days 
                         WHERE studio_id = $studioId 
                         AND working_date IN ('2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31')
                     )"
    $cmdCleanupSlots = New-Object System.Data.SqlClient.SqlCommand($cleanupSlots, $connection)
    $cmdCleanupSlots.ExecuteNonQuery()

    $cleanupDays = "DELETE FROM working_days 
                    WHERE studio_id = $studioId 
                    AND working_date IN ('2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31')"
    $cmdCleanupDays = New-Object System.Data.SqlClient.SqlCommand($cleanupDays, $connection)
    $cmdCleanupDays.ExecuteNonQuery()
    Write-Host "Cleanup completed!" -ForegroundColor Green

    # Function to insert working day and return its ID
    function Insert-WorkingDay($date, $isAvailable, $note) {
        $query = "INSERT INTO working_days (studio_id, working_date, is_available, note, created_at) 
                  OUTPUT INSERTED.working_day_id
                  VALUES ($studioId, '$date', $isAvailable, N'$note', GETUTCDATE())"
        $cmd = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
        return $cmd.ExecuteScalar()
    }

    # Function to insert slot
    function Insert-Slot($dayId, $start, $end, $status) {
        $query = "INSERT INTO time_slots (working_day_id, start_time, end_time, status) 
                  VALUES ($dayId, '$start', '$end', '$status')"
        $cmd = New-Object System.Data.SqlClient.SqlCommand($query, $connection)
        $cmd.ExecuteNonQuery() | Out-Null
    }

    # 1. May 27th: Unavailable (isAvailable = 0)
    Write-Host "Inserting May 27th (Unavailable)..."
    $dayId27 = Insert-WorkingDay "2026-05-27" 0 "Studio nghỉ phép"
    Write-Host "Inserted Day 27 ID: $dayId27" -ForegroundColor Green

    # 2. May 28th: Fully booked (isAvailable = 1, slots are BOOKED/CLOSED)
    Write-Host "Inserting May 28th (Fully booked)..."
    $dayId28 = Insert-WorkingDay "2026-05-28" 1 "Đầy lịch test"
    Insert-Slot $dayId28 "08:00:00" "10:00:00" "BOOKED"
    Insert-Slot $dayId28 "10:00:00" "12:00:00" "CLOSED"
    Write-Host "Inserted Day 28 ID: $dayId28" -ForegroundColor Green

    # 3. May 29th: Available (isAvailable = 1, has OPEN slot)
    Write-Host "Inserting May 29th (Available)..."
    $dayId29 = Insert-WorkingDay "2026-05-29" 1 "Có slot trống"
    Insert-Slot $dayId29 "08:00:00" "10:00:00" "OPEN"
    Insert-Slot $dayId29 "10:00:00" "12:00:00" "BOOKED"
    Write-Host "Inserted Day 29 ID: $dayId29" -ForegroundColor Green

    # 4. May 30th: Closed Slots (isAvailable = 1, slots are CLOSED)
    Write-Host "Inserting May 30th (Slots closed)..."
    $dayId30 = Insert-WorkingDay "2026-05-30" 1 "Slot bị khóa hết"
    Insert-Slot $dayId30 "14:00:00" "16:00:00" "CLOSED"
    Write-Host "Inserted Day 30 ID: $dayId30" -ForegroundColor Green

    # 5. May 31st: Fully Open (isAvailable = 1, all slots OPEN)
    Write-Host "Inserting May 31st (Fully open)..."
    $dayId31 = Insert-WorkingDay "2026-05-31" 1 "Ngày mở tự do"
    Insert-Slot $dayId31 "09:00:00" "11:00:00" "OPEN"
    Insert-Slot $dayId31 "14:00:00" "16:00:00" "OPEN"
    Write-Host "Inserted Day 31 ID: $dayId31" -ForegroundColor Green

    Write-Host "`nAll test cases successfully seeded for Hùng Camera & Studio!" -ForegroundColor Green

} catch {
    Write-Host "Failed: $_" -ForegroundColor Red
} finally {
    $connection.Close()
}
