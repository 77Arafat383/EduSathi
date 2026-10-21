# EduSathi: AI-Powered Smart Learning Management System

EduSathi is a full-stack, AI-powered educational platform designed to streamline course delivery, interactive assessments, automated grading, 365-day attendance heatmaps, academic analytics, and contextual AI study assistance.

---

## 🚀 Key Features

- **Role-Based Workspaces**:
  - **Student Portal**: Course modules reader, interactive MCQ quizzes, assignment submission, 365-day attendance heatmap grid, and AI study assistant.
  - **Teacher Studio**: Course creation, quiz builder (single & multi-answer), gradebook evaluation with pedagogical feedback, and daily attendance registers.
  - **Administrator Console**: User provisioning, role governance, subject catalog, and platform reporting.
- **Server-Side Assessment Scoring**: Client-tamper proof scoring where answer keys are protected on the server.
- **Yearly Attendance Heatmap Grid**: Visualizes 365 days of student attendance with interactive status tracking (Present, Late, Absent).
- **Curriculum-Grounded AI Study Assistant**: Integrates Google Gemini with contextual prompts using the student's active courses and deadlines, with transparent rule-based fallback.
- **Enterprise-Grade Security**: Parameterized queries, BOLA checks, bcrypt hashing (10 rounds), JWT authentication, rate limiting, and Helmet headers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, Express-Rate-Limit |
| **Database** | PostgreSQL (Supabase ready) / Local SQLite zero-config fallback |
| **AI Integration** | Google Gemini 1.5 Flash API with curriculum-grounded fallback engine |
| **Testing** | Vitest, Supertest |

---

## ⚡ Instant Demonstration Accounts

EduSathi comes pre-seeded with realistic demonstration accounts. You can also use the **1-Click Demo Buttons** on the Login Page to switch personas instantly:

| Role | Email | Password | Pre-seeded Activity |
|---|---|---|---|
| **Student** | `student.arafat@edusathi.edu` | `Student@123` | Enrolled in 3 courses, completed lessons, attendance history |
| **Teacher** | `dr.rahim@edusathi.edu` | `Teacher@123` | Course instructor for Web Dev & AI Engineering |
| **Admin** | `admin@edusathi.edu` | `Admin@123` | System oversight & user governance |

---

## 📦 Installation & Local Setup

### Prerequisites
- Node.js v18+ (tested on Node.js v22 LTS)
- npm v9+

### 1. Clone & Configure
```bash
git clone https://github.com/77Arafat383/EduSathi.git
cd EduSathi
cp .env.example .env
```

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will initialize the database schema, seed demonstration accounts, and start listening at `http://localhost:5000`.

### 3. Start Frontend Client
In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend test suite covering authentication, RBAC authorization, BOLA resource protection, assessment scoring, and attendance calculation:

```bash
cd server
npm test
```

Result: **10 passed (100%)** in ~765ms.

---

## 🗄️ Database Migrations (Supabase & PostgreSQL)

- **Schema Migration**: `database/migrations/001_initial_schema.sql` (contains all 22 tables, constraints, foreign keys, indexes, and Supabase RLS policies).
- **Seed Script**: `database/seed/001_seed_data.sql`.
- **Schema Documentation**: `database/schema-notes.md`.

To connect to cloud Supabase PostgreSQL, simply set `DATABASE_URL` in your `.env` file. Leaving `DATABASE_URL` blank uses the built-in zero-config local database.

---

## 📂 Project Structure

```
EduSathi/
├── client/                     # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── app/                # Router & Auth Providers
│   │   ├── components/         # Common, Layout, & Heatmap components
│   │   ├── layouts/            # Dashboard & Public layouts
│   │   ├── pages/              # Student, Teacher, Admin, & Public pages
│   │   ├── lib/api.ts          # Centralized API client
│   │   └── types/              # Type definitions
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Environment configuration
│   │   ├── controllers/        # Domain business logic
│   │   ├── middleware/         # Auth, RBAC, Validation, Error handling
│   │   ├── repositories/       # Database query abstraction
│   │   ├── routes/             # RESTful endpoints
│   │   └── validators/         # Zod schemas
│   ├── tests/                  # Automated Vitest test suite
│   └── package.json
│
├── database/                   # Migrations, seed scripts, schema notes
├── docs/                       # Project, API, Architecture & Security audit docs
└── README.md
```

---

## 🛡️ Security Audit
A post-development security audit has been performed and documented in [`docs/security-audit.md`](docs/security-audit.md), verifying Broken Object Level Authorization (BOLA), parameterization against SQL Injection, privilege escalation safeguards, and server-side scoring boundaries.
