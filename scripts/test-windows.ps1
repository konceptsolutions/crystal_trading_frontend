# Windows Testing Script for KSO Production Setup
# Tests the setup on Windows before deployment

$ErrorActionPreference = "Continue"
$errors = 0
$warnings = 0

function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:errors++
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    $script:warnings++
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Test Node.js
function Test-NodeJS {
    Write-Header "Testing Node.js"
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node -v
        Write-Success "Node.js is installed: $nodeVersion"
        
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($majorVersion -ge 18) {
            Write-Success "Node.js version is 18 or higher"
        } else {
            Write-Error "Node.js version is too old (need 18+)"
        }
    } else {
        Write-Error "Node.js is not installed"
    }
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = npm -v
        Write-Success "npm is installed: $npmVersion"
    } else {
        Write-Error "npm is not installed"
    }
}

# Test file existence
function Test-FileExists {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        Write-Success "$Description exists: $FilePath"
        return $true
    } else {
        Write-Error "$Description missing: $FilePath"
        return $false
    }
}

# Test required files
function Test-RequiredFiles {
    Write-Header "Testing Required Files"
    
    $files = @(
        @{Path="install-production.sh"; Desc="Installation script"},
        @{Path=".env.production.example"; Desc="Environment template"},
        @{Path="nginx.conf"; Desc="Nginx config"},
        @{Path="ecosystem.config.js"; Desc="PM2 config"},
        @{Path="backend/package.json"; Desc="Backend package.json"},
        @{Path="backend/tsconfig.json"; Desc="Backend tsconfig"},
        @{Path="backend/prisma/schema.prisma"; Desc="Backend Prisma schema"},
        @{Path="backend/src/server.ts"; Desc="Backend server"},
        @{Path="frontend/package.json"; Desc="Frontend package.json"},
        @{Path="frontend/next.config.js"; Desc="Frontend Next.js config"},
        @{Path="frontend/tsconfig.json"; Desc="Frontend tsconfig"},
        @{Path="scripts/deploy.sh"; Desc="Deploy script"},
        @{Path="scripts/backup-database.sh"; Desc="Backup script"},
        @{Path="scripts/monitor.sh"; Desc="Monitor script"},
        @{Path="scripts/prepare-production.sh"; Desc="Prepare script"}
    )
    
    foreach ($file in $files) {
        Test-FileExists -FilePath $file.Path -Description $file.Desc
    }
}

# Test package.json validity
function Test-PackageJson {
    Write-Header "Testing Package.json Files"
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        # Backend
        if (Test-Path "backend/package.json") {
            try {
                $null = node -e "JSON.parse(require('fs').readFileSync('backend/package.json', 'utf8'))"
                Write-Success "backend/package.json is valid JSON"
                
                $content = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
                if ($content.scripts.build) {
                    Write-Success "backend/package.json has build script"
                } else {
                    Write-Error "backend/package.json missing build script"
                }
                
                if ($content.scripts.start) {
                    Write-Success "backend/package.json has start script"
                } else {
                    Write-Error "backend/package.json missing start script"
                }
            } catch {
                Write-Error "backend/package.json has invalid JSON: $_"
            }
        }
        
        # Frontend
        if (Test-Path "frontend/package.json") {
            try {
                $null = node -e "JSON.parse(require('fs').readFileSync('frontend/package.json', 'utf8'))"
                Write-Success "frontend/package.json is valid JSON"
                
                $content = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
                if ($content.scripts.build) {
                    Write-Success "frontend/package.json has build script"
                } else {
                    Write-Error "frontend/package.json missing build script"
                }
                
                if ($content.scripts.start) {
                    Write-Success "frontend/package.json has start script"
                } else {
                    Write-Error "frontend/package.json missing start script"
                }
            } catch {
                Write-Error "frontend/package.json has invalid JSON: $_"
            }
        }
    } else {
        Write-Warning "Node.js not found, skipping JSON validation"
    }
}

# Test Prisma schemas
function Test-PrismaSchemas {
    Write-Header "Testing Prisma Schemas"
    
    if (Test-Path "backend/prisma/schema.prisma") {
        Write-Success "backend/prisma/schema.prisma exists"
        
        $content = Get-Content "backend/prisma/schema.prisma" -Raw
        if ($content -match 'provider\s*=\s*"sqlite"') {
            Write-Warning "Backend schema is SQLite (will be converted to PostgreSQL during installation)"
        } elseif ($content -match 'provider\s*=\s*"postgresql"') {
            Write-Success "Backend schema is already PostgreSQL"
        } else {
            Write-Warning "Backend schema provider not detected"
        }
    } else {
        Write-Error "backend/prisma/schema.prisma not found"
    }
}

# Test configuration files
function Test-ConfigFiles {
    Write-Header "Testing Configuration Files"
    
    # Ecosystem config
    if (Test-Path "ecosystem.config.js") {
        Write-Success "ecosystem.config.js exists"
        
        if (Get-Command node -ErrorAction SilentlyContinue) {
            try {
                $null = node -c ecosystem.config.js
                Write-Success "ecosystem.config.js syntax is valid"
            } catch {
                Write-Error "ecosystem.config.js has syntax errors"
            }
        }
    } else {
        Write-Error "ecosystem.config.js not found"
    }
    
    # Nginx config
    if (Test-Path "nginx.conf") {
        Write-Success "nginx.conf exists"
        $content = Get-Content "nginx.conf" -Raw
        if ($content -match "upstream backend") {
            Write-Success "nginx.conf has backend upstream"
        } else {
            Write-Warning "nginx.conf missing backend upstream"
        }
    } else {
        Write-Error "nginx.conf not found"
    }
    
    # Environment example
    if (Test-Path ".env.production.example") {
        Write-Success ".env.production.example exists"
        $content = Get-Content ".env.production.example" -Raw
        if ($content -match "DATABASE_URL") {
            Write-Success ".env.production.example has DATABASE_URL"
        } else {
            Write-Warning ".env.production.example missing DATABASE_URL"
        }
    } else {
        Write-Error ".env.production.example not found"
    }
}

# Check Docker files are removed
function Test-NoDocker {
    Write-Header "Checking Docker Files Removed"
    
    $dockerFiles = @(
        "docker-compose.yml",
        "backend/Dockerfile",
        "frontend/Dockerfile",
        ".dockerignore",
        "backend/.dockerignore",
        "frontend/.dockerignore"
    )
    
    foreach ($file in $dockerFiles) {
        if (Test-Path $file) {
            Write-Error "Docker file still exists: $file (should be removed)"
        } else {
            Write-Success "Docker file removed: $file"
        }
    }
}

# Main
Write-Header "KSO Production Setup Validation (Windows)"
Write-Host ""

Test-NodeJS
Write-Host ""

Test-RequiredFiles
Write-Host ""

Test-PackageJson
Write-Host ""

Test-PrismaSchemas
Write-Host ""

Test-ConfigFiles
Write-Host ""

Test-NoDocker
Write-Host ""

# Summary
Write-Header "Validation Summary"
Write-Host "Errors: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "Warnings: $warnings" -ForegroundColor $(if ($warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($errors -eq 0) {
    Write-Success "All critical validations passed!"
    if ($warnings -gt 0) {
        Write-Warning "There are $warnings warnings to review"
    }
    exit 0
} else {
    Write-Error "Validation failed with $errors errors"
    exit 1
}

