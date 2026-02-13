#!/bin/bash

# Dental Clinic CRM - Start Script
# Usage: ./start.sh [command]
# Commands:
#   dev       - Start both backend and frontend (default)
#   backend   - Start only backend
#   frontend  - Start only frontend
#   setup     - Initial project setup
#   db        - Setup database
#   clean     - Clean node_modules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Dental Clinic CRM - Startup Script${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm $(npm -v) detected"
}

# Check if PostgreSQL is running (optional)
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q; then
            print_success "PostgreSQL is running"
        else
            print_warning "PostgreSQL is not running. Please start PostgreSQL first."
        fi
    else
        print_warning "Could not check PostgreSQL status. Make sure it's running."
    fi
}

# Setup environment files
setup_env() {
    print_info "Setting up environment files..."
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_success "Created backend/.env from .env.example"
            print_warning "Please edit backend/.env with your database credentials"
        else
            print_error ".env.example not found in backend directory"
        fi
    else
        print_info "backend/.env already exists"
    fi
}

# Install dependencies
install_deps() {
    print_info "Installing dependencies..."
    
    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        print_info "Installing root dependencies..."
        cd "$ROOT_DIR" && npm install
    fi
    
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        print_info "Installing backend dependencies..."
        cd "$BACKEND_DIR" && npm install
    fi
    
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_info "Installing frontend dependencies..."
        cd "$FRONTEND_DIR" && npm install
    fi
    
    print_success "All dependencies installed"
}

# Setup database
db_setup() {
    print_info "Setting up database..."
    cd "$BACKEND_DIR"
    
    print_info "Generating Prisma client..."
    npm run prisma:generate
    
    print_info "Running migrations..."
    npm run prisma:migrate
    
    print_success "Database setup complete"
}

# Start backend
start_backend() {
    print_info "Starting backend server..."
    cd "$BACKEND_DIR"
    npm run start:dev
}

# Start frontend
start_frontend() {
    print_info "Starting frontend dev server..."
    cd "$FRONTEND_DIR"
    npm run dev
}

# Start both (using concurrently if available)
start_both() {
    print_info "Starting both backend and frontend..."
    
    # Check if concurrently is installed
    if ! npm list -g concurrently &> /dev/null && ! [ -f "$ROOT_DIR/node_modules/.bin/concurrently" ]; then
        print_info "Installing concurrently..."
        cd "$ROOT_DIR" && npm install --save-dev concurrently
    fi
    
    cd "$ROOT_DIR"
    npm run dev
}

# Clean node_modules
clean_modules() {
    print_warning "Cleaning node_modules..."
    rm -rf "$ROOT_DIR/node_modules"
    rm -rf "$BACKEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/node_modules"
    rm -rf "$BACKEND_DIR/dist"
    rm -rf "$FRONTEND_DIR/dist"
    print_success "All node_modules cleaned"
}

# Full setup
full_setup() {
    print_header
    check_node
    check_npm
    install_deps
    setup_env
    check_postgres
    print_success "Setup complete! Edit backend/.env with your database credentials, then run: ./start.sh db"
}

# Show usage
show_usage() {
    echo "Usage: ./start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev       Start both backend and frontend (default)"
    echo "  backend   Start only backend"
    echo "  frontend  Start only frontend"
    echo "  setup     Initial project setup"
    echo "  db        Setup database (run migrations)"
    echo "  seed      Seed database with sample data"
    echo "  studio    Open Prisma Studio"
    echo "  clean     Clean all node_modules"
    echo "  check     Check prerequisites"
    echo ""
    echo "Examples:"
    echo "  ./start.sh          # Start both servers"
    echo "  ./start.sh setup    # First time setup"
    echo "  ./start.sh db       # Setup database"
}

# Main script
main() {
    print_header
    
    case "${1:-dev}" in
        dev|start)
            check_node
            check_npm
            start_both
            ;;
        backend|be)
            check_node
            check_npm
            start_backend
            ;;
        frontend|fe)
            check_node
            check_npm
            start_frontend
            ;;
        setup|install)
            full_setup
            ;;
        db|database)
            db_setup
            ;;
        seed)
            print_info "Seeding database..."
            cd "$BACKEND_DIR" && npm run prisma:seed
            ;;
        studio)
            print_info "Opening Prisma Studio..."
            cd "$BACKEND_DIR" && npm run prisma:studio
            ;;
        clean)
            clean_modules
            ;;
        check)
            check_node
            check_npm
            check_postgres
            print_success "All checks passed!"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
