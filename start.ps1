# Dental Clinic CRM - Start Script for PowerShell
# Usage: .\start.ps1 [command]
# Commands:
#   dev       - Start both backend and frontend (default)
#   backend   - Start only backend
#   frontend  - Start only frontend
#   setup     - Initial project setup
#   db        - Setup database
#   clean     - Clean node_modules

param(
    [Parameter(Position=0)]
    [string]$Command = "dev"
)

# Colors for output
function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Blue }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "[ERROR] $message" -ForegroundColor Red }
function Write-Header($message) { Write-Host "`n========================================`n  $message`n========================================`n" -ForegroundColor Cyan }

# Project directories
$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"

function Show-Usage {
    Write-Host "Usage: .\start.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  dev       Start both backend and frontend (default)"
    Write-Host "  backend   Start only backend"
    Write-Host "  frontend  Start only frontend"
    Write-Host "  setup     Initial project setup"
    Write-Host "  db        Setup database (run migrations)"
    Write-Host "  seed      Seed database with sample data"
    Write-Host "  studio    Open Prisma Studio"
    Write-Host "  clean     Clean all node_modules"
    Write-Host "  check     Check prerequisites"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start.ps1          # Start both servers"
    Write-Host "  .\start.ps1 setup    # First time setup"
    Write-Host "  .\start.ps1 db       # Setup database"
}

function Test-Node {
    try {
        $nodeVersion = node -v
        $versionNumber = $nodeVersion.Substring(1).Split('.')[0]
        if ([int]$versionNumber -lt 18) {
            Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
            exit 1
        }
        Write-Success "Node.js $nodeVersion detected"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    }
}

function Test-Npm {
    try {
        $npmVersion = npm -v
        Write-Success "npm $npmVersion detected"
    }
    catch {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
}

function Setup-Environment {
    Write-Info "Setting up environment files..."
    
    $envFile = Join-Path $BACKEND_DIR ".env"
    $envExample = Join-Path $BACKEND_DIR ".env.example"
    
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envExample) {
            Copy-Item $envExample $envFile
            Write-Success "Created backend\.env from .env.example"
            Write-Warning "Please edit backend\.env with your database credentials"
        }
        else {
            Write-Error ".env.example not found in backend directory"
        }
    }
    else {
        Write-Info "backend\.env already exists"
    }
}

function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    Set-Location $ROOT_DIR
    if (-not (Test-Path (Join-Path $ROOT_DIR "node_modules"))) {
        Write-Info "Installing root dependencies..."
        npm install
    }
    
    if (-not (Test-Path (Join-Path $BACKEND_DIR "node_modules"))) {
        Write-Info "Installing backend dependencies..."
        Set-Location $BACKEND_DIR
        npm install
    }
    
    if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
        Write-Info "Installing frontend dependencies..."
        Set-Location $FRONTEND_DIR
        npm install
    }
    
    Set-Location $ROOT_DIR
    Write-Success "All dependencies installed"
}

function Setup-Database {
    Write-Info "Setting up database..."
    Set-Location $BACKEND_DIR
    
    Write-Info "Generating Prisma client..."
    npm run prisma:generate
    
    Write-Info "Running migrations..."
    npm run prisma:migrate
    
    Set-Location $ROOT_DIR
    Write-Success "Database setup complete"
}

function Start-Backend {
    Write-Info "Starting backend server..."
    Set-Location $BACKEND_DIR
    npm run start:dev
}

function Start-Frontend {
    Write-Info "Starting frontend dev server..."
    Set-Location $FRONTEND_DIR
    npm run dev
}

function Start-Both {
    Write-Info "Starting both backend and frontend..."
    Set-Location $ROOT_DIR
    npm run dev
}

function Clean-Modules {
    Write-Warning "Cleaning node_modules..."
    Remove-Item -Recurse -Force (Join-Path $ROOT_DIR "node_modules") -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force (Join-Path $BACKEND_DIR "node_modules") -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force (Join-Path $FRONTEND_DIR "node_modules") -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force (Join-Path $BACKEND_DIR "dist") -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force (Join-Path $FRONTEND_DIR "dist") -ErrorAction SilentlyContinue
    Write-Success "All node_modules cleaned"
}

function Full-Setup {
    Write-Header "Dental Clinic CRM - Setup"
    Test-Node
    Test-Npm
    Install-Dependencies
    Setup-Environment
    Write-Success "Setup complete! Edit backend/.env with your database credentials, then run: .\start.ps1 db"
}

# Main switch
Write-Header "Dental Clinic CRM - Startup Script"

switch ($Command.ToLower()) {
    "dev" { 
        Test-Node
        Test-Npm
        Start-Both 
    }
    "start" { 
        Test-Node
        Test-Npm
        Start-Both 
    }
    "backend" { 
        Test-Node
        Test-Npm
        Start-Backend 
    }
    "be" { 
        Test-Node
        Test-Npm
        Start-Backend 
    }
    "frontend" { 
        Test-Node
        Test-Npm
        Start-Frontend 
    }
    "fe" { 
        Test-Node
        Test-Npm
        Start-Frontend 
    }
    "setup" { 
        Full-Setup 
    }
    "install" { 
        Full-Setup 
    }
    "db" { 
        Setup-Database 
    }
    "database" { 
        Setup-Database 
    }
    "seed" {
        Write-Info "Seeding database..."
        Set-Location $BACKEND_DIR
        npm run prisma:seed
    }
    "studio" {
        Write-Info "Opening Prisma Studio..."
        Set-Location $BACKEND_DIR
        npm run prisma:studio
    }
    "clean" { 
        Clean-Modules 
    }
    "check" { 
        Test-Node
        Test-Npm
        Write-Success "All checks passed!"
    }
    "help" { 
        Show-Usage 
    }
    "--help" { 
        Show-Usage 
    }
    "-h" { 
        Show-Usage 
    }
    default { 
        Write-Error "Unknown command: $Command"
        Show-Usage
        exit 1
    }
}
