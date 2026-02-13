#!/usr/bin/env python3
"""
Dental Clinic CRM - Cross-Platform Startup Script
Usage: python start.py [command]

Commands:
  dev       Start both backend and frontend (default)
  backend   Start only backend
  frontend  Start only frontend
  setup     Initial project setup
  db        Setup database
  clean     Clean node_modules
"""

import sys
import os
import subprocess
import platform
from pathlib import Path

# Colors for terminal output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

# Disable colors on Windows if not supported
if platform.system() == 'Windows' and not os.environ.get('TERM'):
    for attr in dir(Colors):
        if not attr.startswith('_'):
            setattr(Colors, attr, '')

def print_header():
    print(f"{Colors.CYAN}{Colors.BOLD}")
    print("=" * 50)
    print("  Dental Clinic CRM - Startup Script")
    print("=" * 50)
    print(f"{Colors.END}\n")

def print_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.END} {msg}")

def print_success(msg):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.END} {msg}")

def print_warning(msg):
    print(f"{Colors.YELLOW}[WARNING]{Colors.END} {msg}")

def print_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.END} {msg}")

def run_command(cmd, cwd=None):
    """Run a shell command"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {cmd}")
        if e.stderr:
            print(e.stderr)
        return False

def check_node():
    """Check if Node.js is installed and is version 18+"""
    try:
        result = subprocess.run(['node', '-v'], capture_output=True, text=True, check=True)
        version = result.stdout.strip().lstrip('v')
        major = int(version.split('.')[0])
        if major < 18:
            print_error(f"Node.js version 18+ required. Current: {version}")
            return False
        print_success(f"Node.js v{version} detected")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("Node.js is not installed. Please install Node.js 18+ first.")
        return False

def check_npm():
    """Check if npm is installed"""
    try:
        result = subprocess.run(['npm', '-v'], capture_output=True, text=True, check=True)
        print_success(f"npm v{result.stdout.strip()} detected")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("npm is not installed")
        return False

def get_project_dirs():
    """Get project directory paths"""
    root = Path(__file__).parent
    return {
        'root': root,
        'backend': root / 'backend',
        'frontend': root / 'frontend'
    }

def setup_environment():
    """Setup environment files"""
    dirs = get_project_dirs()
    env_file = dirs['backend'] / '.env'
    env_example = dirs['backend'] / '.env.example'
    
    if not env_file.exists():
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print_success("Created backend/.env from .env.example")
            print_warning("Please edit backend/.env with your database credentials")
        else:
            print_error(".env.example not found in backend directory")
    else:
        print_info("backend/.env already exists")

def install_dependencies():
    """Install all dependencies"""
    dirs = get_project_dirs()
    
    print_info("Installing dependencies...")
    
    if not (dirs['root'] / 'node_modules').exists():
        print_info("Installing root dependencies...")
        if not run_command('npm install', dirs['root']):
            return False
    
    if not (dirs['backend'] / 'node_modules').exists():
        print_info("Installing backend dependencies...")
        if not run_command('npm install', dirs['backend']):
            return False
    
    if not (dirs['frontend'] / 'node_modules').exists():
        print_info("Installing frontend dependencies...")
        if not run_command('npm install', dirs['frontend']):
            return False
    
    print_success("All dependencies installed")
    return True

def setup_database():
    """Setup database with Prisma"""
    dirs = get_project_dirs()
    print_info("Setting up database...")
    
    print_info("Generating Prisma client...")
    if not run_command('npm run prisma:generate', dirs['backend']):
        return False
    
    print_info("Running migrations...")
    if not run_command('npm run prisma:migrate', dirs['backend']):
        return False
    
    print_success("Database setup complete")
    return True

def start_backend():
    """Start the backend server"""
    dirs = get_project_dirs()
    print_info("Starting backend server on http://localhost:3000")
    run_command('npm run start:dev', dirs['backend'])

def start_frontend():
    """Start the frontend dev server"""
    dirs = get_project_dirs()
    print_info("Starting frontend dev server on http://localhost:5173")
    run_command('npm run dev', dirs['frontend'])

def start_both():
    """Start both servers using concurrently"""
    dirs = get_project_dirs()
    print_info("Starting both backend and frontend...")
    
    # Check if concurrently is installed
    concurrently_path = dirs['root'] / 'node_modules' / '.bin' / 'concurrently'
    if platform.system() == 'Windows':
        concurrently_path = concurrently_path.with_suffix('.cmd')
    
    if not concurrently_path.exists():
        print_info("Installing concurrently...")
        if not run_command('npm install --save-dev concurrently', dirs['root']):
            return
    
    run_command('npm run dev', dirs['root'])

def clean_modules():
    """Clean all node_modules"""
    dirs = get_project_dirs()
    print_warning("Cleaning node_modules...")
    
    import shutil
    for path in [
        dirs['root'] / 'node_modules',
        dirs['backend'] / 'node_modules',
        dirs['frontend'] / 'node_modules',
        dirs['backend'] / 'dist',
        dirs['frontend'] / 'dist'
    ]:
        if path.exists():
            print_info(f"Removing {path}")
            shutil.rmtree(path, ignore_errors=True)
    
    print_success("All node_modules cleaned")

def full_setup():
    """Run full setup"""
    print_header()
    
    if not check_node():
        return
    if not check_npm():
        return
    
    install_dependencies()
    setup_environment()
    
    print_success("Setup complete! Edit backend/.env with your database credentials, then run: python start.py db")

def show_usage():
    """Show usage information"""
    print("Usage: python start.py [command]")
    print("\nCommands:")
    print("  dev       Start both backend and frontend (default)")
    print("  backend   Start only backend")
    print("  frontend  Start only frontend")
    print("  setup     Initial project setup")
    print("  db        Setup database (run migrations)")
    print("  seed      Seed database with sample data")
    print("  studio    Open Prisma Studio")
    print("  clean     Clean all node_modules")
    print("  check     Check prerequisites")
    print("\nExamples:")
    print("  python start.py          # Start both servers")
    print("  python start.py setup    # First time setup")
    print("  python start.py db       # Setup database")

def main():
    print_header()
    
    # Get command argument
    command = sys.argv[1] if len(sys.argv) > 1 else 'dev'
    
    # Route to appropriate function
    if command in ['dev', 'start']:
        if check_node() and check_npm():
            start_both()
    elif command in ['backend', 'be']:
        if check_node() and check_npm():
            start_backend()
    elif command in ['frontend', 'fe']:
        if check_node() and check_npm():
            start_frontend()
    elif command in ['setup', 'install']:
        full_setup()
    elif command in ['db', 'database']:
        setup_database()
    elif command == 'seed':
        dirs = get_project_dirs()
        print_info("Seeding database...")
        run_command('npm run prisma:seed', dirs['backend'])
    elif command == 'studio':
        dirs = get_project_dirs()
        print_info("Opening Prisma Studio...")
        run_command('npm run prisma:studio', dirs['backend'])
    elif command == 'clean':
        clean_modules()
    elif command == 'check':
        if check_node() and check_npm():
            print_success("All checks passed!")
    elif command in ['help', '--help', '-h']:
        show_usage()
    else:
        print_error(f"Unknown command: {command}")
        show_usage()
        sys.exit(1)

if __name__ == '__main__':
    main()
