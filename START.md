# Quick Start Guide

This guide will help you get the Dental Clinic CRM up and running quickly.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 13+** - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Quick Start

### Option 1: Using the Start Script (Recommended)

We provide several startup scripts for different platforms:

#### Windows (PowerShell - Recommended)
```powershell
# First time setup
.\start.ps1 setup

# Setup database
.\start.ps1 db

# Start both backend and frontend
.\start.ps1
```

#### Windows (CMD)
```cmd
# First time setup
start.bat setup

# Setup database
start.bat db

# Start both servers
start.bat
```

#### Linux/macOS (Bash)
```bash
# Make script executable
chmod +x start.sh

# First time setup
./start.sh setup

# Setup database
./start.sh db

# Start both servers
./start.sh
```

### Option 2: Using npm commands

```bash
# Install dependencies and setup
npm run setup

# Setup database
npm run db:setup

# Start both servers
npm run dev
```

## Available Commands

### Start Commands
- `npm run dev` or `./start.sh` - Start both backend and frontend
- `npm run dev:backend` or `./start.sh backend` - Start only backend
- `npm run dev:frontend` or `./start.sh frontend` - Start only frontend

### Setup Commands
- `npm run setup` or `./start.sh setup` - Initial project setup
- `npm run setup:env` - Create .env file from .env.example
- `npm run db:setup` or `./start.sh db` - Setup database (generate client + run migrations)
- `npm run db:seed` or `./start.sh seed` - Seed database with sample data
- `npm run db:studio` or `./start.sh studio` - Open Prisma Studio (database GUI)

### Maintenance Commands
- `npm run clean` or `./start.sh clean` - Clean all node_modules
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run test` - Run tests

## Manual Setup (Without Scripts)

If you prefer to set up manually:

### 1. Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd frontend && npm install
```

### 2. Configure Environment
```bash
# Copy environment file
cd backend
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Edit .env with your database credentials
```

### 3. Setup Database
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed with sample data
npm run prisma:seed
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Default URLs

After starting the servers:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/v1
- **API Documentation:** http://localhost:3000/api/docs (Swagger UI)
- **Database GUI (Prisma Studio):** Run `npm run db:studio` then open http://localhost:5555

## Environment Variables

Create a `backend/.env` file with these variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dental_clinic_db?schema=public"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

## Troubleshooting

### Port Already in Use
If port 3000 (backend) or 5173 (frontend) is in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: The Vite dev server will automatically find another port

### Database Connection Error
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `backend/.env`
- Make sure the database exists: `createdb dental_clinic_db`

### Missing Dependencies
If you see module not found errors:
```bash
npm run clean  # Clean node_modules
npm run setup  # Reinstall everything
```

### Windows Script Execution Policy
If PowerShell won't run the script:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Production Deployment

```bash
# Build for production
npm run build

# Start production servers
cd backend && npm run start:prod
cd frontend && npm run preview
```

## Need Help?

- Check the `AGENTS.md` file for detailed project documentation
- API documentation is available at `/api/docs` when the backend is running
- Review the code in `backend/src/` and `frontend/src/` for implementation details
