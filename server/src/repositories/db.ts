import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { config } from '../config';

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

const isPostgres = Boolean(config.databaseUrl);

if (isPostgres) {
  pgPool = new Pool({
    connectionString: config.databaseUrl,
  });
  console.log('[DB] Configured for PostgreSQL / Supabase.');
} else {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbFile = path.join(dataDir, 'edusathi.db');
  sqliteDb = new Database(dbFile);
  // High-performance Pragmas
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('synchronous = NORMAL');
  sqliteDb.pragma('cache_size = -64000'); // 64MB memory page cache
  sqliteDb.pragma('temp_store = MEMORY');
  sqliteDb.pragma('mmap_size = 30000000000'); // Memory-mapped I/O
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`[DB] Using optimized local SQLite database at: ${dbFile}`);
}

export async function query<T = any>(sqlStr: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    // Convert ? to $1, $2, etc. for Postgres
    let pIdx = 1;
    const pgSql = sqlStr.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sqlStr);
    return stmt.all(...params) as T[];
  }
  return [];
}

export async function getOne<T = any>(sqlStr: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sqlStr, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function run(sqlStr: string, params: any[] = []): Promise<{ changes: number }> {
  if (isPostgres && pgPool) {
    let pIdx = 1;
    const pgSql = sqlStr.replace(/\?/g, () => `$${pIdx++}`);
    const res = await pgPool.query(pgSql, params);
    return { changes: res.rowCount || 0 };
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(sqlStr);
    const info = stmt.run(...params);
    return { changes: info.changes };
  }
  return { changes: 0 };
}

export async function initDb(): Promise<void> {
  console.log('[DB] Initializing database schema...');

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      avatar_url TEXT,
      student_id TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
      created_by TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      banner_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS course_teachers (
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (course_id, teacher_id)
    )`,

    `CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (course_id, student_id)
    )`,

    `CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      position INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      position INTEGER DEFAULT 1,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS lesson_progress (
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, lesson_id)
    )`,

    `CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      instructions TEXT,
      max_score INTEGER DEFAULT 100,
      due_at DATETIME,
      status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
      results_released BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'single' CHECK (question_type IN ('single', 'multiple')),
      marks INTEGER DEFAULT 10,
      position INTEGER DEFAULT 1
    )`,

    `CREATE TABLE IF NOT EXISTS quiz_options (
      id TEXT PRIMARY KEY,
      question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT 0,
      explanation TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'graded'))
    )`,

    `CREATE TABLE IF NOT EXISTS quiz_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_option_ids TEXT,
      is_correct BOOLEAN DEFAULT 0,
      score_awarded REAL DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      max_score INTEGER DEFAULT 100,
      due_at DATETIME,
      submission_type TEXT DEFAULT 'text_or_link',
      status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      file_url TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmitted')),
      UNIQUE (assignment_id, student_id)
    )`,

    `CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
      graded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      score REAL NOT NULL,
      feedback TEXT,
      released_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      created_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      title TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
      marked_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (session_id, student_id)
    )`,

    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      author_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
      quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
      author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      goal TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      source TEXT DEFAULT 'ai_assisted',
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS study_plan_tasks (
      id TEXT PRIMARY KEY,
      study_plan_id TEXT REFERENCES study_plans(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_at DATETIME,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
      position INTEGER DEFAULT 1
    )`
  ];

  for (const stmt of schemaStatements) {
    await run(stmt);
  }

  // Seed default demonstration records if not already populated
  await seedDefaults();
  console.log('[DB] Schema and seed verification complete.');
}

async function seedDefaults(): Promise<void> {
  const existingAdmin = await getOne<{ id: string }>('SELECT id FROM profiles WHERE email = ?', ['admin@edusathi.edu']);
  if (existingAdmin) {
    return;
  }

  console.log('[DB] Seeding demonstration data...');

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const teacherHash = bcrypt.hashSync('Teacher@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  // Profiles
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_admin_1', 'System Administrator', 'admin@edusathi.edu', adminHash, 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Administration']);
  
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_1', 'Dr. Rahim Ahmed', 'dr.rahim@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Computer Science & Engineering']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_2', 'Prof. Fatima Rahman', 'prof.fatima@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Information Technology']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_1', 'Arafat Rahman', 'student.arafat@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'CS-2024-001', 'Computer Science & Engineering']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_2', 'Tanvir Hossain', 'student.nstu@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'CS-2024-002', 'Software Engineering']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_3', 'Sarah Jenkins', 'student.sarah@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'CS-2024-003', 'Information Technology']);

  // Subjects
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_cs', 'Computer Science & Engineering', 'CSE-100', 'Core software systems and architecture.', 'active']);
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_ai', 'Artificial Intelligence & Machine Learning', 'AIML-200', 'Neural networks and LLM agent design.', 'active']);
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_dbms', 'Database Management & Systems', 'DBMS-300', 'Relational database engineering and SQL.', 'active']);

  // Courses
  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['crs_web_dev', 'Modern Full-Stack Web Development & Cloud Systems', 'Master React, TypeScript, Node.js, RESTful architectures, and scalable cloud deployments.', 'subj_cs', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600']);
  
  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['crs_ai_eng', 'Applied AI & LLM Systems Engineering', 'Hands-on exploration of transformers, prompt engineering, context management, and AI assistants.', 'subj_ai', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600']);

  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['crs_db_design', 'Relational Database Engineering with PostgreSQL', 'Deep dive into relational algebra, query optimization, indexing strategies, and database security.', 'subj_dbms', 'published', 'usr_teacher_2', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600']);

  // Course Teachers
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_web_dev', 'usr_teacher_1']);
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_ai_eng', 'usr_teacher_1']);
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_db_design', 'usr_teacher_2']);

  // Enrollments
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_1', 'crs_web_dev', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_2', 'crs_ai_eng', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_3', 'crs_db_design', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_4', 'crs_web_dev', 'usr_student_2', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_5', 'crs_db_design', 'usr_student_2', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_6', 'crs_web_dev', 'usr_student_3', 'active']);

  // Modules & Lessons
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_1', 'crs_web_dev', 'Module 1: Modern Client-Server Architecture', 1]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_2', 'crs_web_dev', 'Module 2: State Management & Component Lifecycle', 2]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_3', 'crs_ai_eng', 'Module 1: Foundations of Generative AI', 1]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_4', 'crs_db_design', 'Module 1: Relational Schema & ACID Guarantees', 1]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_1', 'mod_1', 'Understanding REST APIs & HTTP Protocol',
    '# Understanding REST APIs\n\nRepresentational State Transfer (REST) is an architectural style for distributed hypermedia systems.\n\n### Core Principles:\n- **Statelessness**: Every request contains all required information.\n- **Client-Server Architecture**: Separation of UI and data concerns.\n- **Cacheability**: Responses explicitly indicate if they can be cached.\n- **Uniform Interface**: Resource identification via URIs.', 1
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_2', 'mod_1', 'Securing API Endpoints: JWT & RBAC',
    '# Securing API Endpoints\n\nSecurity is fundamental in enterprise web development.\n\n### Role-Based Access Control (RBAC):\nUsers are assigned roles (`student`, `teacher`, `admin`), and the server strictly validates each role for every API request.\n\n### BOLA (Broken Object Level Authorization):\nAlways check if the requesting user owns or has permission to view the specific resource ID.', 2
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_3', 'mod_2', 'React Context API and Hook Paradigms',
    '# React Context and Custom Hooks\n\nManage state cleanly with built-in React primitives.\n- Use `useContext` for global application state like user authentication and theme preferences.\n- Always encapsulate API calls inside custom hooks or dedicated service wrappers.', 1
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_4', 'mod_3', 'Prompt Engineering & System Directives',
    '# Prompt Engineering for LLMs\n\nCraft deterministic and safe system prompts.\n- Define clear boundaries.\n- Provide few-shot examples.\n- Request JSON formatted output for automated parser ingestion.', 1
  ]);

  // Mark lesson 1 complete for student 1
  await run(`INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?, ?)`, ['usr_student_1', 'les_1']);

  // Quizzes & Questions
  await run(`INSERT INTO quizzes (id, course_id, title, instructions, max_score, due_at, status, results_released) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['qiz_web_1', 'crs_web_dev', 'Quiz 1: Web Architecture & RESTful Services', 'Answer all questions. Multiple-choice questions test core concepts.', 40, '2026-11-15 23:59:59', 'published', 1]);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_1', 'qiz_web_1', 'Which of the following HTTP methods are idempotent by definition?', 'multiple', 10, 1]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_1', 'qq_1', 'GET', 1, 'GET is safe and idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_2', 'qq_1', 'PUT', 1, 'PUT is idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_3', 'qq_1', 'DELETE', 1, 'DELETE is idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_4', 'qq_1', 'POST', 0, 'POST creates a new resource and is not idempotent.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_2', 'qiz_web_1', 'What does BOLA stand for in API security context?', 'single', 10, 2]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_1', 'qq_2', 'Broken Object Level Authorization', 1, 'BOLA occurs when endpoints lack ownership verification.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_2', 'qq_2', 'Binary Object Linked Access', 0, 'Incorrect definition.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_3', 'qq_2', 'Basic Online Login Authentication', 0, 'Incorrect definition.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_3', 'qiz_web_1', 'Where should sensitive database credentials and AI API keys be stored?', 'single', 10, 3]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_3_1', 'qq_3', 'In server-side environment variables (.env)', 1, 'Privileged secrets must never be exposed to the browser.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_3_2', 'qq_3', 'In client localStorage', 0, 'Accessible to client scripts; unsafe.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_4', 'qiz_web_1', 'Which status code indicates an unauthenticated request?', 'single', 10, 4]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_4_1', 'qq_4', '401 Unauthorized', 1, '401 indicates missing or invalid authentication credentials.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_4_2', 'qq_4', '403 Forbidden', 0, '403 indicates authenticated but forbidden.']);

  // Assignments & Submissions & Grades
  await run(`INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asg_1', 'crs_web_dev', 'Assignment 1: RESTful API Design & Relational Modeling', 'Design a scalable REST API schema and implement SQL tables with foreign key constraints and proper indexes. Submit your GitHub repository link and architectural summary.', 100, '2026-11-20 23:59:59', 'text_or_link', 'published']);

  await run(`INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asg_2', 'crs_ai_eng', 'Assignment 1: Prompt Template & RAG Pipeline Design', 'Develop an AI study prompt pipeline with safety guardrails and deterministic fallback mechanisms.', 100, '2026-11-28 23:59:59', 'text_or_link', 'published']);

  await run(`INSERT INTO submissions (id, assignment_id, student_id, content, file_url, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sub_1', 'asg_1', 'usr_student_1', 'Implemented REST endpoints in Express with Zod validation, PostgreSQL schema migrations, and JWT authentication. GitHub: https://github.com/77Arafat383/EduSathi', 'https://edusathi.local/uploads/architecture_diagram.pdf', '2026-10-18 14:30:00', 'graded']);

  await run(`INSERT INTO grades (id, submission_id, graded_by, score, feedback, released_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ['grd_1', 'sub_1', 'usr_teacher_1', 95.0, 'Outstanding architecture, rigorous validation with Zod, and clear separation of concerns! Keep up the great work.', '2026-10-19 10:15:00']);

  // Attendance Sessions & Records - populate realistic year-long activity for the student attendance heatmap
  console.log('[DB] Seeding attendance history for yearly attendance grid...');
  const now = new Date();
  for (let i = 0; i < 90; i++) {
    // Generate dates backwards across previous months
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay();
    // Monday (1), Wednesday (3), Friday (5) classes
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      const dateStr = d.toISOString().split('T')[0];
      const sessionId = `att_sess_${dateStr}`;
      await run(`INSERT OR IGNORE INTO attendance_sessions (id, course_id, session_date, created_by, title, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, 'crs_web_dev', dateStr, 'usr_teacher_1', `Class Session ${dateStr}`, 'completed']);
      
      // Attendance status: 90% present, 5% late, 5% absent
      let status = 'present';
      if (i % 15 === 0) status = 'absent';
      else if (i % 7 === 0) status = 'late';

      await run(`INSERT OR IGNORE INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
        [`rec_${sessionId}_std1`, sessionId, 'usr_student_1', status, 'usr_teacher_1']);
      await run(`INSERT OR IGNORE INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
        [`rec_${sessionId}_std2`, sessionId, 'usr_student_2', 'present', 'usr_teacher_1']);
    }
  }

  // Announcements & Notifications
  await run(`INSERT INTO announcements (id, course_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)`,
    ['anc_1', 'crs_web_dev', 'usr_teacher_1', 'Welcome to Modern Full-Stack Web Development!', 'Please review the syllabus, setup your Node.js environment, and complete Quiz 1 before the deadline.']);

  await run(`INSERT INTO announcements (id, course_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)`,
    ['anc_2', 'crs_web_dev', 'usr_teacher_1', 'Assignment 1 Submissions Now Open', 'Assignment 1 has been posted. You can submit your repository link or written text directly through the student portal.']);

  // Comments for doubts
  await run(`INSERT INTO comments (id, course_id, assignment_id, author_id, body) VALUES (?, ?, ?, ?, ?)`,
    ['cmt_1', 'crs_web_dev', 'asg_1', 'usr_student_1', 'Should we include database migration scripts in the repository submission?']);
  await run(`INSERT INTO comments (id, course_id, assignment_id, author_id, parent_id, body) VALUES (?, ?, ?, ?, ?, ?)`,
    ['cmt_2', 'crs_web_dev', 'asg_1', 'usr_teacher_1', 'cmt_1', 'Yes, include all SQL migration files in the database/migrations directory.']);

  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_1', 'usr_student_1', 'grade_released', 'Grade Released for Assignment 1', 'Dr. Rahim Ahmed evaluated your submission: 95/100', '/student/assignments/asg_1']);

  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_2', 'usr_student_1', 'announcement', 'New Announcement in Web Dev', 'Assignment 1 Submissions Now Open', '/student/courses/crs_web_dev']);
  
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_3', 'usr_teacher_1', 'submission', 'New Assignment Submission', 'Arafat Rahman submitted Assignment 1', '/teacher/gradebook']);

  console.log('[DB] Synthetic demonstration data successfully seeded.');
}
