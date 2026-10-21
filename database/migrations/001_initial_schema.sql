-- ====================================================================
-- EduSathi: AI-Powered Smart Learning Management System
-- Initial Migration: 001_initial_schema.sql
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 14+
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. Profiles Table (User details & Role-Based Access Control)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    avatar_url TEXT,
    student_id TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. Subjects Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. Courses Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. Course Teachers (Assigned teachers)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_teachers (
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (course_id, teacher_id)
);

-- --------------------------------------------------------------------
-- 5. Enrollments Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (course_id, student_id)
);

-- --------------------------------------------------------------------
-- 6. Modules Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. Lessons Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    position INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. Lesson Progress Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, lesson_id)
);

-- --------------------------------------------------------------------
-- 9. Quizzes Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT,
    max_score INTEGER DEFAULT 100,
    due_at TIMESTAMPTZ,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    results_released BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. Quiz Questions Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'single' CHECK (question_type IN ('single', 'multiple')),
    marks INTEGER DEFAULT 10,
    position INTEGER DEFAULT 1
);

-- --------------------------------------------------------------------
-- 11. Quiz Options Table (Answer choices)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_options (
    id TEXT PRIMARY KEY,
    question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    explanation TEXT
);

-- --------------------------------------------------------------------
-- 12. Quiz Attempts Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'graded'))
);

-- --------------------------------------------------------------------
-- 13. Quiz Answers Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_ids TEXT, -- JSON array of selected IDs
    is_correct BOOLEAN DEFAULT FALSE,
    score_awarded REAL DEFAULT 0
);

-- --------------------------------------------------------------------
-- 14. Assignments Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    max_score INTEGER DEFAULT 100,
    due_at TIMESTAMPTZ,
    submission_type TEXT DEFAULT 'text_or_link',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 15. Submissions Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmitted')),
    UNIQUE (assignment_id, student_id)
);

-- --------------------------------------------------------------------
-- 16. Grades Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
    graded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    score REAL NOT NULL,
    feedback TEXT,
    released_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 17. Attendance Sessions Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 18. Attendance Records Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

-- --------------------------------------------------------------------
-- 19. Announcements Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 20. Comments Table (Supports Course, Assignment, and Quiz Doubts)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 21. Notifications Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 22. Study Plans & Tasks
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    source TEXT DEFAULT 'ai_assisted',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id TEXT PRIMARY KEY,
    study_plan_id TEXT REFERENCES study_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    position INTEGER DEFAULT 1
);

-- --------------------------------------------------------------------
-- Indexes for High Performance Querying
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_comments_course ON comments(course_id);

-- --------------------------------------------------------------------
-- Supabase Row-Level Security (RLS) Policies
-- --------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read of published courses
CREATE POLICY "Public courses viewable by all" ON courses
    FOR SELECT USING (status = 'published');

-- Students read their own submissions
CREATE POLICY "Students read own submissions" ON submissions
    FOR SELECT USING (student_id = auth.uid()::text);

-- Students read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid()::text);
