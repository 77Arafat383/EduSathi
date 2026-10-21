# EduSathi: Architecture & Request Lifecycle

## 1. Architectural Model
EduSathi implements a decoupled, client-server relational architecture:

```
[ Browser Client ]
  - React 18, Vite, TypeScript
  - Tailwind CSS + Lucide Icons + Recharts
  - ProtectedRoute & RoleGuard client routing
          │
          │ HTTPS REST Requests (Bearer Token)
          ▼
[ Express API Server (Node.js & TypeScript) ]
  ├── Security Middleware (Helmet, CORS, Express-Rate-Limit)
  ├── Authentication & RBAC Middleware (JWT, Profile Verification)
  ├── Request Validation Layer (Zod Schemas)
  ├── Domain Controllers & Services
  └── Universal Database Abstraction Layer
          │
          ├──► PostgreSQL / Supabase (Production)
          │    └── Relational Schema, Indexes & Row-Level Security
          ├──► SQLite (Local Zero-Config Fallback & Automated Testing)
          │
          └──► AI Provider (Google Gemini API / Contextual Fallback Engine)
```

## 2. Request Lifecycle Example: Quiz Attempt Submission

1. **Client Action**: The enrolled student submits their selected options from `/student/quizzes/:quizId`.
2. **Transport**: `POST /api/quizzes/:quizId/attempts` is invoked with `Authorization: Bearer <jwt>`.
3. **Authentication Middleware**: Verifies token signature, extracts user ID, and checks `status = 'active'` in database.
4. **Authorization Middleware**: Verifies `req.user.role === 'student'`.
5. **Validation Middleware**: Zod validates the structure of `answers` array.
6. **Controller Logic**:
   - Fetches the question records and correct answer keys directly from the database.
   - Evaluates each answer server-side without trusting client claims.
   - Calculates total score awarded and percentage.
   - Stores the parent `quiz_attempts` record.
   - Stores individual `quiz_answers` records.
7. **Response**: Returns calculated score, maximum score, percentage, and released feedback.
