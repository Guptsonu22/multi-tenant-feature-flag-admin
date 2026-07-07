# Multi-Tenant Feature Flag Admin

A lightweight MVP for a multi-tenant feature-flag admin panel with JWT authentication, RBAC, deterministic percentage rollouts, and audit logging.

## What is included
- JWT auth with access and refresh tokens
- Tenant and feature-flag CRUD
- Owner/admin-only mutation routes and member/viewer read access
- Deterministic rollout evaluation using a hash of `${userId}:${flagKey}`
- Audit log capture for create/update/toggle/delete actions
- React client with login, registration, dashboard, tenant management, and flag management

## Architecture
- Frontend: React + Vite
- Backend: Express + MongoDB + Mongoose
- Auth: JWT access/refresh tokens
- Rollout logic: SHA-256 hashing for consistent bucket assignment

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

## Testing
```bash
cd server
node --test tests/flagEvaluation.test.js
```

## Notes
The application is intentionally scoped as an MVP and focuses on end-to-end authentication, tenant isolation, deterministic rollout evaluation, and audit visibility.
