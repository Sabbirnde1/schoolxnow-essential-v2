# Quick Apply Script - Automatically applies the teacher student fix migration
# This script copies the SQL and opens Supabase dashboard for you

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Teacher Student Fix - Auto Apply" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = ".\supabase\migrations\20251006000003_definitive_teacher_fix.sql"

if (Test-Path $migrationFile) {
    Write-Host "✓ Migration file found" -ForegroundColor Green
    Write-Host ""
    
    # Copy SQL to clipboard
    Get-Content $migrationFile | Set-Clipboard
    Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
    # Display what to do
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Opening Supabase Dashboard..." -ForegroundColor White
    Write-Host "2. Go to: SQL Editor" -ForegroundColor White
    Write-Host "3. Click: New Query" -ForegroundColor White
    Write-Host "4. Press: Ctrl+V to paste" -ForegroundColor White
    Write-Host "5. Click: Run ▶️" -ForegroundColor White
    Write-Host ""
    
    # Ask if they want to open browser
    $open = Read-Host "Open Supabase Dashboard in browser? (Y/N)"
    
    if ($open -eq "Y" -or $open -eq "y") {
        # Try to find Supabase project URL from .env or config
        if (Test-Path ".env") {
            $envContent = Get-Content ".env" -Raw
            if ($envContent -match "VITE_SUPABASE_URL=(.+)") {
                $supabaseUrl = $matches[1].Trim()
                $projectRef = $supabaseUrl -replace "https://", "" -replace ".supabase.co", "" -replace "/.*", ""
                $dashboardUrl = "https://supabase.com/dashboard/project/$projectRef/sql/new"
                
                Write-Host ""
                Write-Host "Opening: $dashboardUrl" -ForegroundColor Cyan
                Start-Process $dashboardUrl
            } else {
                Write-Host "Opening Supabase Dashboard..." -ForegroundColor Cyan
                Start-Process "https://supabase.com/dashboard"
            }
        } else {
            Write-Host "Opening Supabase Dashboard..." -ForegroundColor Cyan
            Start-Process "https://supabase.com/dashboard"
        }
    }
    
    Write-Host ""
    Write-Host "📋 Migration Summary:" -ForegroundColor Yellow
    Write-Host "- Drops old restrictive policies" -ForegroundColor White
    Write-Host "- Adds 8 new policies" -ForegroundColor White
    Write-Host "- Includes 'teacher' role in INSERT/UPDATE/SELECT" -ForegroundColor White
    Write-Host "- Teachers can now add students ✅" -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host "✗ Migration file not found!" -ForegroundColor Red
    Write-Host "Expected: $migrationFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
