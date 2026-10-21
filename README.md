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

---

## 🐳 Docker Quickstart (Recommended & Fastest)

EduSathi features production-optimized multi-stage Docker builds with Nginx reverse proxying, Gzip compression, and HTTP asset caching:

```bash
# Build and run the entire stack (Client + Server + DB) in background
docker compose up --build -d
```

- **Frontend App**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

Stop all containers:
```bash
docker compose down
```

Optional self-hosted PostgreSQL container:
```bash
docker compose --profile postgres up --build -d
```

---

## ⚡ High-Speed Performance Architecture

This project is engineered for speed with maximum throughput and minimum latency:
1. **Dynamic Route Splitting (`React.lazy`)**: Each role workspace (Student, Teacher, Admin) is isolated into separate on-demand JS chunks, reducing initial bundle weight from ~800KB down to **26KB** (~7KB gzipped)!
2. **Nginx Reverse Proxy & HTTP Caching**: Nginx serves static assets with `Cache-Control: public, max-age=31536000, immutable`, eliminating repeated network roundtrips.
3. **Gzip / Deflate Compression**: Express and Nginx apply automatic Gzip compression to all API JSON payloads and web assets (>1KB).
4. **SQLite WAL & Memory Optimization**: SQLite operates in **WAL** (Write-Ahead Logging) mode with `synchronous = NORMAL`, `64MB memory page cache`, `temp_store = MEMORY`, and memory-mapped I/O (`mmap_size`) for concurrent reads and writes with zero lock contention.
5. **Rollup Manual Vendor Chunking**: Vite splits dependencies into independent browser-cacheable chunks (`vendor-react`, `vendor-charts`, `vendor-icons`).

---

### Manual Development Setup (Without Docker)

#### A. Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will initialize the database schema, seed demonstration accounts, and start listening at `http://localhost:5000`.

#### B. Start Frontend Client
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
