# EduSathi: Requirements Specification

## 1. Functional Requirements

### 1.1 Authentication & User Management
- **FR-AUTH-1**: User authentication via email and password using bcrypt (10 rounds) and JWT signed with server-side secrets.
- **FR-AUTH-2**: Public self-registration strictly restricted to the `student` role to eliminate privilege escalation vectors.
- **FR-AUTH-3**: Administrative account provisioning for faculty teachers and administrators.
- **FR-AUTH-4**: Account status verification: deactivated accounts are denied access immediately.

### 1.2 Course & Lesson Management
- **FR-CRS-1**: Course creation and lifecycle management (`draft`, `published`, `archived`) restricted to assigned faculty and administrators.
- **FR-CRS-2**: Modular lesson authoring with Markdown formatted text.
- **FR-CRS-3**: Student course enrollment and progress tracking (`lesson_progress`).
- **FR-CRS-4**: Course announcements triggering automated in-app notifications.

### 1.3 Quizzes & Automated Scoring
- **FR-QZ-1**: Quiz creation supporting single-choice and multiple-choice questions.
- **FR-QZ-2**: Correct answers and pedagogical explanations hidden from students during test attempts.
- **FR-QZ-3**: Server-side scoring: the server evaluates attempts against the database answer key, preventing client-side score manipulation.
- **FR-QZ-4**: Controlled release of scores and question explanations.

### 1.4 Assignments & Gradebook
- **FR-ASG-1**: Assignment publishing with deadlines and maximum marks.
- **FR-ASG-2**: Student submission with text solutions and optional external artifact URLs.
- **FR-ASG-3**: Teacher gradebook with validation rejecting scores below 0 or above maximum points.
- **FR-ASG-4**: Real-time notification dispatched upon grade release.

### 1.5 Attendance Tracking
- **FR-ATT-1**: Course session attendance registration (`present`, `absent`, `late`).
- **FR-ATT-2**: Student 365-day attendance heatmap grid visualization (similar to GitHub contributions).
- **FR-ATT-3**: Attendance summary calculations: `percentage = (present + late) / total * 100`.

### 1.6 AI Study Assistant
- **FR-AI-1**: Contextual prompt pipeline utilizing student's enrolled courses, recent performance, and upcoming deadlines.
- **FR-AI-2**: Concept explanations, revision planning, and practice question generation.
- **FR-AI-3**: Transparent fallback to rule-based academic engine when AI provider key is not configured.

### 1.7 Academic Discussions & In-App Notifications
- **FR-COM-1**: Course and assignment doubt discussion threads.
- **FR-NTF-1**: Notification tray with unread indicator and bulk read action.

---

## 2. Non-Functional Requirements
- **NFR-SEC-1**: Role-Based Access Control (RBAC) enforced on every API route.
- **NFR-SEC-2**: Broken Object Level Authorization (BOLA) verified across all resource queries.
- **NFR-SEC-3**: Parameterized SQL queries preventing SQL Injection.
- **NFR-SEC-4**: Helmet security headers and strict CORS configuration.
- **NFR-SEC-5**: Rate limiting on sensitive endpoints (100 requests / 15 mins for auth; 30 requests / 5 mins for AI).
- **NFR-RES-1**: Fully responsive interface adapted for desktop (1280px+), tablet (768px), and mobile (360px+).
