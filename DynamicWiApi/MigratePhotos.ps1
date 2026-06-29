# Migration script to move photos from wwwroot to backend root epn-photos folder
# Run this from the DynamicWiApi directory

$ErrorActionPreference = "Stop"

# Configuration
$OldPhotosPath = "wwwroot\epn-photos"
$NewPhotosPath = "epn-photos"

Write-Host "Starting photo migration..." -ForegroundColor Green

# Check if old photos directory exists
if (-not (Test-Path $OldPhotosPath)) {
    Write-Host "No existing photos found at $OldPhotosPath" -ForegroundColor Yellow
    Write-Host "Migration complete (nothing to migrate)" -ForegroundColor Green
    exit 0
}

# Create new directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $NewPhotosPath | Out-Null
Write-Host "Created new photos directory: $NewPhotosPath" -ForegroundColor Cyan

# Count files
$files = Get-ChildItem -Path $OldPhotosPath -File
Write-Host "Found $($files.Count) photos to migrate" -ForegroundColor Cyan

# Move files
$migratedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $destination = Join-Path $NewPhotosPath $file.Name
    
    if (Test-Path $destination) {
        Write-Host "Skipping $($file.Name) - already exists in destination" -ForegroundColor Yellow
        $skippedCount++
    } else {
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "Moved $($file.Name)" -ForegroundColor Green
        $migratedCount++
    }
}

Write-Host "Migration complete!" -ForegroundColor Green
Write-Host "Migrated: $migratedCount files" -ForegroundColor Green
Write-Host "Skipped: $skippedCount files" -ForegroundColor Yellow

# Optionally remove old directory if empty
if ((Get-ChildItem -Path $OldPhotosPath -File).Count -eq 0) {
    Write-Host "Removing empty old directory: $OldPhotosPath" -ForegroundColor Cyan
    Remove-Item -Path $OldPhotosPath -Force
} else {
    Write-Host "Old directory not empty, keeping: $OldPhotosPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "IMPORTANT: The frontend will continue to access photos at /epn-photos/filename" -ForegroundColor Cyan
Write-Host "The server now serves these files from the backend root epn-photos folder." -ForegroundColor Cyan
Write-Host "No frontend changes required!" -ForegroundColor Green
