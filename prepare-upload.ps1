# PowerShell Script to Prepare Files for VPS Upload
# This script creates an "upload" folder with all necessary files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Preparing Files for VPS Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set source and destination directories
$sourceDir = $PSScriptRoot
$uploadDir = Join-Path $sourceDir "upload"

# Remove existing upload folder if it exists
if (Test-Path $uploadDir) {
    Write-Host "Removing existing upload folder..." -ForegroundColor Yellow
    Remove-Item -Path $uploadDir -Recurse -Force
}

# Create upload folder
Write-Host "Creating upload folder..." -ForegroundColor Green
New-Item -ItemType Directory -Path $uploadDir -Force | Out-Null

# Function to copy files excluding certain patterns
function Copy-ProjectFiles {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludePatterns
    )
    
    if (-not (Test-Path $Source)) {
        Write-Host "Source not found: $Source" -ForegroundColor Yellow
        return
    }
    
    # Create destination directory
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    
    # Get all items recursively
    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($Source.Length + 1)
        $destPath = Join-Path $Destination $relativePath
        
        # Check if item should be excluded
        $shouldExclude = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($relativePath -like $pattern -or $_.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if (-not $shouldExclude) {
            if ($_.PSIsContainer) {
                # Create directory
                New-Item -ItemType Directory -Path $destPath -Force | Out-Null
            } else {
                # Copy file
                $destDir = Split-Path -Parent $destPath
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
}

# Define exclusion patterns
$excludePatterns = @(
    "node_modules\*",
    "node_modules",
    ".next\*",
    ".next",
    "dist\*",
    "dist",
    "*.db",
    "*.db-journal",
    "*.db.backup",
    ".env*",
    "*.log",
    "*.bat",
    "*.ps1",
    ".git\*",
    ".git",
    ".vscode\*",
    ".vscode",
    ".idea\*",
    ".idea",
    "*.swp",
    "*.swo",
    "*~",
    ".DS_Store",
    "Thumbs.db",
    "Desktop.ini",
    "tsconfig.tsbuildinfo",
    "server-output.log",
    "logs\*",
    "logs",
    "coverage\*",
    "coverage",
    ".pnp\*",
    ".pnp",
    ".pnp.js",
    "build\*",
    "build",
    "out\*",
    "out",
    ".vercel\*",
    ".vercel",
    "next-env.d.ts"
)

Write-Host "Copying backend files..." -ForegroundColor Green
$backendSource = Join-Path $sourceDir "backend"
$backendDest = Join-Path $uploadDir "backend"
if (Test-Path $backendSource) {
    Copy-ProjectFiles -Source $backendSource -Destination $backendDest -ExcludePatterns $excludePatterns
    Write-Host "  [OK] Backend files copied" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Backend folder not found" -ForegroundColor Red
}

Write-Host "Copying frontend files..." -ForegroundColor Green
$frontendSource = Join-Path $sourceDir "frontend"
$frontendDest = Join-Path $uploadDir "frontend"
if (Test-Path $frontendSource) {
    Copy-ProjectFiles -Source $frontendSource -Destination $frontendDest -ExcludePatterns $excludePatterns
    Write-Host "  [OK] Frontend files copied" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Frontend folder not found" -ForegroundColor Red
}

Write-Host "Copying scripts folder..." -ForegroundColor Green
$scriptsSource = Join-Path $sourceDir "scripts"
$scriptsDest = Join-Path $uploadDir "scripts"
if (Test-Path $scriptsSource) {
    Copy-ProjectFiles -Source $scriptsSource -Destination $scriptsDest -ExcludePatterns $excludePatterns
    Write-Host "  [OK] Scripts folder copied" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Scripts folder not found (optional)" -ForegroundColor Yellow
}

Write-Host "Copying systemd folder..." -ForegroundColor Green
$systemdSource = Join-Path $sourceDir "systemd"
$systemdDest = Join-Path $uploadDir "systemd"
if (Test-Path $systemdSource) {
    Copy-ProjectFiles -Source $systemdSource -Destination $systemdDest -ExcludePatterns $excludePatterns
    Write-Host "  [OK] Systemd folder copied" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Systemd folder not found (optional)" -ForegroundColor Yellow
}

Write-Host "Copying root configuration files..." -ForegroundColor Green

# Root files to copy
$rootFiles = @(
    "ecosystem.config.js",
    "nginx.conf",
    "install-production.sh",
    "build-production.sh",
    ".gitignore"
)

foreach ($file in $rootFiles) {
    $sourceFile = Join-Path $sourceDir $file
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $uploadDir -Force
        Write-Host "  [OK] Copied $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Upload Folder Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Location: $uploadDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open WinSCP" -ForegroundColor White
Write-Host "2. Connect to your VPS server" -ForegroundColor White
Write-Host "3. Navigate to /opt/ on the server" -ForegroundColor White
Write-Host "4. Upload the entire 'upload' folder contents to /opt/kso/" -ForegroundColor White
Write-Host "5. After upload, SSH to server and run: sudo bash install-production.sh" -ForegroundColor White
Write-Host ""

# Count files for summary
$fileCount = (Get-ChildItem -Path $uploadDir -Recurse -File).Count
$dirCount = (Get-ChildItem -Path $uploadDir -Recurse -Directory).Count

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files: $fileCount" -ForegroundColor White
Write-Host "  Folders: $dirCount" -ForegroundColor White
Write-Host ""

