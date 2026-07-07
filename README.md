# Multi-Tenant Feature Flag Admin

A lightweight MVP for a multi-tenant feature-flag admin panel with JWT authentication, RBAC, deterministic percentage rollouts, and audit logging.

## Project
A production-style SaaS-style admin experience for managing feature flags across multiple tenants. It includes tenant-aware access, role-based permissions, and deterministic rollout evaluation.

## Tech Stack
- Frontend: React + Vite
- Backend: Express + MongoDB + Mongoose
- Auth: JWT access/refresh tokens
- Rollout logic: SHA-256 hashing for consistent bucketing

## Folder Structure
```text
client/         # React frontend
server/         # Express backend
server/src/controllers/  # Auth, tenant, and flag controllers
server/src/models/        # MongoDB schemas
server/src/routes/        # API routes
server/src/utils/         # rollout evaluation helper
server/tests/             # evaluation tests
```

## Setup
### 1. Clone the repository
```bash
git clone https://github.com/Guptsonu22/multi-tenant-feature-flag-admin.git
cd multi-tenant-feature-flag-admin
```

### 2. Install dependencies
```bash
cd server
npm install
cd ../client
npm install
```

### 3. Environment variables
Create a .env file in the server folder.

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/feature-flag-admin
JWT_SECRET=replace-with-a-strong-secret
```

### 4. Run the app
```bash
cd server
npm run dev
```

In a second terminal:
```bash
cd client
npm run dev
```

## API Routes
### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh

### Tenants
- POST /api/tenants
- GET /api/tenants
- PUT /api/tenants/:id
- DELETE /api/tenants/:id

### Feature Flags
- POST /api/flags
- GET /api/flags
- PUT /api/flags/:id
- DELETE /api/flags/:id
- PATCH /api/flags/:id/toggle
- POST /api/flags/evaluate

## Screenshots
- Login and registration screens
- Dashboard with tenant and flag summaries
- Feature flag management table and toggle controls
- Audit log panel for recent flag changes

## Future Improvements
- Add targeted rollout rules by user attribute
- Add webhook support for flag changes
- Add scheduled flag flips
- Add invite-based multi-user tenant onboarding

## Testing
```bash
cd server
node --test tests/flagEvaluation.test.js
```

## Commit History
```text
Initial backend setup
Completed authentication module
Implemented tenant CRUD
Completed feature flag CRUD
Added role based authorization
Created frontend authentication
Implemented dashboard
Connected frontend with backend APIs
Fix registration API proxy issue
Enhance tenant and flag management UI
Finalize project documentation
```
