# Quick Fix Script for Teacher Student Insert Issue
# This script will help you apply the database migration

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Fix Teacher Student Insert Issue" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = ".\supabase\migrations\20251006000001_fix_teacher_student_insert.sql"

if (Test-Path $migrationFile) {
    Write-Host "✓ Migration file found" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Please choose an option:" -ForegroundColor Yellow
    Write-Host "1. Copy SQL to clipboard (paste in Supabase Dashboard)" -ForegroundColor White
    Write-Host "2. Show SQL content" -ForegroundColor White
    Write-Host "3. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice (1-3)"
    
    switch ($choice) {
        "1" {
            Get-Content $migrationFile | Set-Clipboard
            Write-Host ""
            Write-Host "✓ SQL copied to clipboard!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Go to Supabase Dashboard > SQL Editor" -ForegroundColor White
            Write-Host "2. Click 'New Query'" -ForegroundColor White
            Write-Host "3. Paste (Ctrl+V) the SQL" -ForegroundColor White
            Write-Host "4. Click 'Run' to execute" -ForegroundColor White
        }
        "2" {
            Write-Host ""
            Write-Host "SQL Migration Content:" -ForegroundColor Yellow
            Write-Host "======================" -ForegroundColor Yellow
            Get-Content $migrationFile
            Write-Host ""
            Write-Host "======================" -ForegroundColor Yellow
        }
        "3" {
            Write-Host "Exiting..." -ForegroundColor White
            exit
        }
        default {
            Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ Migration file not found!" -ForegroundColor Red
    Write-Host "Expected location: $migrationFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
