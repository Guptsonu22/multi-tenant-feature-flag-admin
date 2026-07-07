# Multi-Tenant Feature Flag Admin

A lightweight MVP for a multi-tenant feature-flag admin panel with JWT authentication, RBAC, deterministic percentage rollouts, and audit logging.

## Project Overview
This project demonstrates a production-style SaaS admin experience for managing feature flags across multiple tenants. It includes tenant-aware access, role-based permissions, and a deterministic evaluation strategy to ensure the same user always receives the same rollout result.

## Features Implemented
- JWT authentication with access and refresh tokens
- Tenant and feature-flag CRUD
- Owner/admin-only mutation routes and member/viewer read access
- Deterministic rollout evaluation using a hash of `${userId}:${flagKey}`
- Audit log capture for create, update, toggle, and delete actions
- React client with login, registration, dashboard, tenant management, and flag management

## Tech Stack
- Frontend: React + Vite
- Backend: Express + MongoDB + Mongoose
- Auth: JWT access/refresh tokens
- Rollout logic: SHA-256 hashing for consistent bucketing

## Setup Instructions
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

## Screenshots
- Login and registration screens
- Dashboard with tenant and flag summaries
- Feature flag management with toggle controls
- Audit log panel for recent flag updates

## API Documentation
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
Final project submission
```

## Notes
The application is intentionally scoped as an MVP and focuses on end-to-end authentication, tenant isolation, deterministic rollout evaluation, and audit visibility.
