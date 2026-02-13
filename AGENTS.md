# AGENTS.md

## Project Overview

Dental Clinic CRM - A comprehensive practice management system with React frontend and NestJS backend.

## Quick Start Scripts

Use these convenient startup scripts to run the project:

### Windows (PowerShell - Recommended)
```powershell
.\start.ps1 setup    # First time setup
.\start.ps1 db       # Setup database
.\start.ps1          # Start both servers
```

### Windows (CMD)
```cmd
start.bat setup
start.bat db
start.bat
```

### Linux/macOS (Bash)
```bash
chmod +x start.sh
./start.sh setup
./start.sh db
./start.sh
```

### Available Script Commands
- `dev` or `start` - Start both backend and frontend (default)
- `backend` or `be` - Start only backend
- `frontend` or `fe` - Start only frontend
- `setup` or `install` - Initial project setup
- `db` or `database` - Setup database (migrations)
- `seed` - Seed database with sample data
- `studio` - Open Prisma Studio
- `clean` - Clean all node_modules
- `check` - Check prerequisites

## Build Commands

```bash
# Root level (runs all workspaces)
npm run build          # Build all workspaces
npm run lint           # Lint all workspaces
npm run test           # Test all workspaces

# Frontend only
cd frontend && npm run dev        # Start dev server (Vite)
cd frontend && npm run build      # Production build
cd frontend && npm run lint       # ESLint check
cd frontend && npm run preview    # Preview production build

# Backend only
cd backend && npm run build              # NestJS build
cd backend && npm run start:dev          # Start with watch mode
cd backend && npm run start:prod         # Production start
cd backend && npm run lint               # ESLint with auto-fix
cd backend && npm run test               # Run all tests (Jest)
cd backend && npm run test:watch         # Watch mode
cd backend && npm run test:e2e           # End-to-end tests

# Running Single Tests
cd backend && npm test -- patients.service.spec.ts
cd backend && npm test -- -t "should create patient"

# Database commands (backend)
cd backend && npm run prisma:generate    # Generate Prisma client
cd backend && npm run prisma:migrate     # Run migrations
cd backend && npm run prisma:seed        # Seed database
cd backend && npm run prisma:studio      # Open Prisma Studio
```

## Code Style Guidelines

### General

- TypeScript with strict mode enabled
- 4 spaces indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays
- Max line length: 100 characters (soft limit)

### Imports

- Group imports: external libs first, then internal modules
- Use path aliases:
  - Frontend: `@/*` maps to `src/*`
  - Backend: `@common/*`, `@modules/*` maps to respective folders
- Prefer named imports for utilities

### Naming Conventions

- **PascalCase**: Components, classes, interfaces, types, enums, DTOs
- **camelCase**: Variables, functions, methods, hooks, files (except components)
- **UPPER_SNAKE_CASE**: Constants, environment variables
- Backend: `*.service.ts`, `*.controller.ts`, `*.dto.ts`, `*.module.ts`, `*.guard.ts`
- Frontend components: `*.tsx` with matching component name

### Types & Interfaces

```typescript
// Prefer interfaces for object shapes
interface PatientDto {
  id: string;
  name: string;
}

// Use type for unions, intersections, aliases
type Status = 'active' | 'inactive';
```

### Frontend (React)

- Functional components with default exports for pages/components
- Use React hooks (useState, useEffect, useMemo, useCallback)
- State management: Zustand for global state, React Query for server state
- Forms: React Hook Form + Zod validation
- Icons: Lucide React
- Styling: TailwindCSS with custom utility classes:
  - `btn-primary`, `btn-secondary` for buttons
  - `card` for containers
  - `input-field` for form inputs
  - `badge`, `badge-neutral` for status indicators
- Dark mode: Use `dark:` prefix classes
- i18n: All user-facing text must use `useTranslation()` hook

### Backend (NestJS)

- Controllers: Use decorators (@Get, @Post, @Body, @Param)
- Services: Injectable classes with business logic
- DTOs: Use class-validator decorators + Swagger @ApiProperty
- Error handling: NestJS built-in exceptions (NotFoundException, BadRequestException)
- Guards for authentication (@UseGuards(AuthGuard('jwt')))
- Prisma for database access
- API prefix: `/api/v1`
- Swagger docs available at `/api/docs`

### Error Handling

**Backend:**
```typescript
if (!patient) throw new NotFoundException('Patient not found');
```

**Frontend:**
```typescript
onError: (err: any) => toast.error(err.response?.data?.message || 'Error message')
```

### Git Conventions

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commits: Present tense, imperative mood (e.g., "Add patient search")

### Testing

- Backend: Jest with ts-jest
- Test files: `*.spec.ts` alongside source files
- E2E tests: `test/` folder with `*.e2e-spec.ts` pattern
- Coverage: Stored in `coverage/` directory

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand, React Router, Socket.io-client
- **Backend**: NestJS 10, TypeScript, Prisma, PostgreSQL, JWT Auth, Socket.io, Jest
- **Shared**: Zod validation, date-fns

## Environment Variables

Backend requires `.env` with:
- `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`
