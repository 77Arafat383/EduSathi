import { run, query } from '../repositories/db';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export async function resetAndSeedDatabase() {
  console.log('[DB] Removing previous dummy data from database...');

  const tables = [
    'student_payment_transactions',
    'student_payments',
    'teacher_salaries',
    'grades',
    'submissions',
    'comments',
    'announcements',
    'attendance_records',
    'attendance_sessions',
    'quiz_answers',
    'quiz_attempts',
    'quiz_options',
    'quiz_questions',
    'quizzes',
    'lesson_progress',
    'lessons',
    'modules',
    'course_roadmaps',
    'study_plan_tasks',
    'study_plans',
    'notifications',
    'enrollments',
    'course_teachers',
    'courses',
    'subjects',
    'password_reset_codes',
    'profiles',
  ];

  for (const table of tables) {
    try {
      await run(`DELETE FROM ${table}`);
      console.log(`[DB] Cleared table: ${table}`);
    } catch (err: any) {
      console.warn(`[DB] Notice clearing ${table}:`, err.message);
    }
  }

  console.log('[DB] Pushing fresh, clean dataset matching all database requirements...');

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const teacherHash = bcrypt.hashSync('Teacher@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  // 1. PROFILES
  // Admin: admin@edusathi.edu / Admin@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_admin_1', 'System Administrator', 'admin@edusathi.edu', adminHash, 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Central Administration']);

  // Teacher 1: dr.rahim@edusathi.edu & teacher@edusathi.edu / Teacher@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_1', 'Dr. Rahim Ahmed', 'dr.rahim@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Computer Science & Engineering']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_alias', 'Dr. Rahim Ahmed (Alias)', 'teacher@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Computer Science & Engineering']);

  // Teacher 2: prof.fatima@edusathi.edu & teacher2@edusathi.edu / Teacher@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_2', 'Prof. Fatima Rahman', 'prof.fatima@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Information Technology']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_teacher_2_alias', 'Prof. Fatima Rahman (Alias)', 'teacher2@edusathi.edu', teacherHash, 'teacher', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Information Technology']);

  // Student 1: student.arafat@edusathi.edu & student@edusathi.edu / Student@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_1', 'Arafat Rahman', 'student.arafat@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'CS-2026-001', 'Computer Science & Engineering']);

  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_1_alias', 'Arafat Rahman (Alias)', 'student@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'CS-2026-001', 'Computer Science & Engineering']);

  // Student 2: student2@edusathi.edu / Student@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_2', 'Tanvir Hossain', 'student2@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'CS-2026-002', 'Software Engineering']);

  // Student 3: student3@edusathi.edu / Student@123
  await run(`INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['usr_student_3', 'Sarah Jenkins', 'student3@edusathi.edu', studentHash, 'student', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'CS-2026-003', 'Information Technology']);

  // 2. SUBJECTS
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_cs', 'Computer Science & Engineering', 'CSE-100', 'Core software systems, architecture, and engineering principles.', 'active']);
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_ai', 'Artificial Intelligence & Machine Learning', 'AIML-200', 'Neural networks, transformer architectures, and LLM engineering.', 'active']);
  await run(`INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, ?)`,
    ['subj_dbms', 'Database Management & Systems', 'DBMS-300', 'Relational database engineering, query optimization, and SQL.', 'active']);

  // 3. COURSES
  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['crs_web_dev', 'Modern Full-Stack Web Development & Cloud Systems', 'Master React, TypeScript, Node.js, RESTful architectures, and scalable cloud deployments.', 'subj_cs', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', 15000.00]);

  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['crs_ai_eng', 'Applied AI & LLM Systems Engineering', 'Hands-on exploration of transformers, prompt engineering, context management, and AI assistants.', 'subj_ai', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600', 20000.00]);

  await run(`INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['crs_db_design', 'Relational Database Engineering with PostgreSQL', 'Deep dive into relational algebra, query optimization, indexing strategies, and database security.', 'subj_dbms', 'published', 'usr_teacher_2', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600', 18000.00]);

  // 4. COURSE TEACHERS
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_web_dev', 'usr_teacher_1']);
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_web_dev', 'usr_teacher_alias']);
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_ai_eng', 'usr_teacher_1']);
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, ['crs_db_design', 'usr_teacher_2']);

  // 5. ENROLLMENTS
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_1', 'crs_web_dev', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_2', 'crs_ai_eng', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_3', 'crs_db_design', 'usr_student_1', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_4', 'crs_web_dev', 'usr_student_2', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_5', 'crs_db_design', 'usr_student_2', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_6', 'crs_web_dev', 'usr_student_3', 'active']);

  // Alias enrollments
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_alias_1', 'crs_web_dev', 'usr_student_1_alias', 'active']);
  await run(`INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, ?)`, ['enr_alias_2', 'crs_ai_eng', 'usr_student_1_alias', 'active']);

  // 6. MODULES & LESSONS
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_1', 'crs_web_dev', 'Module 1: Client-Server Architecture & REST', 1]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_2', 'crs_web_dev', 'Module 2: State Management & React Paradigms', 2]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_3', 'crs_ai_eng', 'Module 1: Foundations of Generative AI', 1]);
  await run(`INSERT INTO modules (id, course_id, title, position) VALUES (?, ?, ?, ?)`, ['mod_4', 'crs_db_design', 'Module 1: Relational Schema & ACID Guarantees', 1]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_1', 'mod_1', 'Understanding REST APIs & HTTP Protocol',
    '# Understanding REST APIs\n\nRepresentational State Transfer (REST) is an architectural style for distributed hypermedia systems.\n\n### Core Principles:\n- **Statelessness**: Every request contains all required information.\n- **Client-Server Architecture**: Clear separation of UI and persistence.\n- **Cacheability**: Responses explicitly declare caching policies.\n- **Uniform Interface**: Resource identification via standard URIs.', 1
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_2', 'mod_1', 'Securing API Endpoints: JWT & RBAC',
    '# Securing API Endpoints\n\nSecurity is paramount in web engineering.\n\n### Role-Based Access Control (RBAC):\nUsers carry verified roles (`student`, `teacher`, `admin`), validated on every server endpoint.\n\n### Ownership Verification:\nAlways verify that the requesting user owns or has authorization to access the target resource ID.', 2
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_3', 'mod_2', 'React Context API and Hook Paradigms',
    '# React Context and Custom Hooks\n\nState management in React with clean primitives:\n- Use `useContext` for global application state like user sessions and active themes.\n- Encapsulate server communication inside custom hooks or service layers.', 1
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_4', 'mod_3', 'Prompt Engineering & System Directives',
    '# Prompt Engineering for LLMs\n\nCraft deterministic and safe system prompts:\n- Define strict instruction boundaries.\n- Provide few-shot examples for structured reasoning.\n- Request JSON output for automated ingestion.', 1
  ]);

  await run(`INSERT INTO lessons (id, module_id, title, content, position) VALUES (?, ?, ?, ?, ?)`, [
    'les_5', 'mod_4', 'PostgreSQL Indexes, Joins & Query Planning',
    '# PostgreSQL Indexing & Optimization\n\nBoost database performance with optimal indexing:\n- **B-Tree Indexes**: Standard for equality and range queries.\n- **Foreign Key Indexes**: Prevent table scans during relational joins.\n- Use `EXPLAIN ANALYZE` to inspect execution plans.', 1
  ]);

  // Lesson progress
  await run(`INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?, ?)`, ['usr_student_1', 'les_1']);
  await run(`INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?, ?)`, ['usr_student_1', 'les_2']);
  await run(`INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?, ?)`, ['usr_student_2', 'les_1']);
  await run(`INSERT INTO lesson_progress (student_id, lesson_id) VALUES (?, ?)`, ['usr_student_1_alias', 'les_1']);

  // 7. QUIZZES, QUESTIONS, OPTIONS & ATTEMPTS
  await run(`INSERT INTO quizzes (id, course_id, title, instructions, max_score, duration_minutes, due_at, status, results_released) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['qiz_web_1', 'crs_web_dev', 'Quiz 1: Web Architecture & RESTful Services', 'Answer all 4 questions. Tests fundamental HTTP semantics, idempotency, and API security.', 40, 20, '2026-11-25 23:59:59', 'published', true]);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_1', 'qiz_web_1', 'Which of the following HTTP methods are idempotent by specification?', 'multiple', 10, 1]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_1', 'qq_1', 'GET', true, 'GET is safe and idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_2', 'qq_1', 'PUT', true, 'PUT replaces the resource and is idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_3', 'qq_1', 'DELETE', true, 'DELETE is idempotent.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_1_4', 'qq_1', 'POST', false, 'POST is not idempotent.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_2', 'qiz_web_1', 'What does BOLA stand for in API security context?', 'single', 10, 2]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_1', 'qq_2', 'Broken Object Level Authorization', true, 'BOLA occurs when endpoints lack ownership authorization checks.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_2', 'qq_2', 'Binary Object Linked Access', false, 'Incorrect definition.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_2_3', 'qq_2', 'Basic Online Login Authentication', false, 'Incorrect definition.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_3', 'qiz_web_1', 'Where should sensitive database credentials and JWT secret keys be stored?', 'single', 10, 3]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_3_1', 'qq_3', 'In server-side environment variables (.env)', true, 'Server secrets must never be exposed to the client browser.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_3_2', 'qq_3', 'In client localStorage', false, 'Client storage is readable by any script; insecure.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_4', 'qiz_web_1', 'Which HTTP status code signifies an unauthenticated request?', 'single', 10, 4]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_4_1', 'qq_4', '401 Unauthorized', true, '401 indicates missing or invalid authentication credentials.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_4_2', 'qq_4', '403 Forbidden', false, '403 indicates authenticated but insufficient permissions.']);

  // Completed Attempt for student 1
  await run(`INSERT INTO quiz_attempts (id, quiz_id, student_id, started_at, submitted_at, score, max_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['qatt_1', 'qiz_web_1', 'usr_student_1', '2026-10-23 11:00:00', '2026-10-23 11:15:00', 30, 40, 'completed']);

  // Second Quiz in crs_ai_eng (Unattempted - ready for testing live quiz-taking!)
  await run(`INSERT INTO quizzes (id, course_id, title, instructions, max_score, duration_minutes, due_at, status, results_released) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['qiz_ai_1', 'crs_ai_eng', 'Quiz 1: LLM Fundamentals & Prompt Design', 'Test your knowledge on transformers, attention mechanisms, and prompt structuring.', 20, 15, '2026-11-30 23:59:59', 'published', true]);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_ai_1', 'qiz_ai_1', 'What is the role of temperature in LLM sampling?', 'single', 10, 1]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_ai_1_1', 'qq_ai_1', 'Higher temperature increases randomness and creativity', true, 'Temperature controls randomness in token selection.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_ai_1_2', 'qq_ai_1', 'Lower temperature increases hallucination rates', false, 'Lower temperature produces more deterministic results.']);

  await run(`INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['qq_ai_2', 'qiz_ai_1', 'What does RAG stand for in generative AI systems?', 'single', 10, 2]);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_ai_2_1', 'qq_ai_1', 'Retrieval-Augmented Generation', true, 'RAG retrieves external relevant context for LLM generation.']);
  await run(`INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation) VALUES (?, ?, ?, ?, ?)`, ['opt_ai_2_2', 'qq_ai_1', 'Recurrent Attention Gradient', false, 'Incorrect definition.']);

  // 8. ASSIGNMENTS, SUBMISSIONS & GRADES
  await run(`INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asg_1', 'crs_web_dev', 'Assignment 1: RESTful API Design & Relational Modeling', 'Design a scalable REST API schema and implement SQL tables with foreign key constraints and proper indexes. Submit your GitHub repository link and architectural summary.', 100, '2026-11-20 23:59:59', 'text_or_link', 'published']);

  await run(`INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['asg_2', 'crs_web_dev', 'Assignment 2: Cloud Deployment & Containerization', 'Package the Node.js application into a production Docker image and configure CI/CD pipeline deployment scripts.', 100, '2026-11-28 23:59:59', 'text_or_link', 'published']);

  // Submission 1: Graded (for student 1)
  await run(`INSERT INTO submissions (id, assignment_id, student_id, content, file_url, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sub_1', 'asg_1', 'usr_student_1', 'Implemented REST endpoints in Express with Zod validation, PostgreSQL schema migrations, and JWT authentication. GitHub: https://github.com/77Arafat383/EduSathi', 'https://edusathi.local/uploads/architecture_diagram.pdf', '2026-10-23 14:30:00', 'graded']);

  await run(`INSERT INTO grades (id, submission_id, graded_by, score, feedback, released_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ['grd_1', 'sub_1', 'usr_teacher_1', 95.0, 'Superb implementation! Verified election safety, thorough Zod validation, and clean repository structure.', '2026-10-23 16:00:00']);

  // Submission 2: Ungraded (for student 2 -> allows teacher to test grading submission in Gradebook!)
  await run(`INSERT INTO submissions (id, assignment_id, student_id, content, file_url, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sub_2', 'asg_1', 'usr_student_2', 'Completed the assignment with clean Express routing and database schema constraints. Awaiting teacher review.', null, '2026-11-08 19:45:00', 'submitted']);

  // 9. ATTENDANCE SESSIONS & RECORDS
  // 10 historical sessions + 1 active today session
  const dates = [
    '2026-10-12', '2026-10-14', '2026-10-16',
    '2026-10-19', '2026-10-21', '2026-10-23',
    '2026-10-26', '2026-10-28', '2026-10-30',
    '2026-11-02'
  ];

  for (let i = 0; i < dates.length; i++) {
    const dStr = dates[i];
    const sessId = `att_sess_${dStr}`;
    await run(`INSERT INTO attendance_sessions (id, course_id, session_date, created_by, title, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [sessId, 'crs_web_dev', dStr, 'usr_teacher_1', `Class Session: ${dStr}`, 'completed']);

    // Student 1: 9 present, 1 late (95% attendance)
    const st1Status = i === 5 ? 'late' : 'present';
    await run(`INSERT INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
      [`rec_${sessId}_st1`, sessId, 'usr_student_1', st1Status, 'usr_teacher_1']);

    // Student 2: 9 present, 1 absent (90% attendance)
    const st2Status = i === 8 ? 'absent' : 'present';
    await run(`INSERT INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
      [`rec_${sessId}_st2`, sessId, 'usr_student_2', st2Status, 'usr_teacher_1']);

    // Student 3: 6 present, 4 absent (60% attendance -> flags risk in analytics!)
    const st3Status = (i === 1 || i === 4 || i === 7 || i === 9) ? 'absent' : 'present';
    await run(`INSERT INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
      [`rec_${sessId}_st3`, sessId, 'usr_student_3', st3Status, 'usr_teacher_1']);
  }

  // Active session today
  const todayStr = new Date().toISOString().split('T')[0];
  await run(`INSERT INTO attendance_sessions (id, course_id, session_date, created_by, title, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [`att_sess_today`, 'crs_web_dev', todayStr, 'usr_teacher_1', `Class Session - Live Today`, 'completed']);
  await run(`INSERT INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
    [`rec_today_st1`, `att_sess_today`, 'usr_student_1', 'present', 'usr_teacher_1']);
  await run(`INSERT INTO attendance_records (id, session_id, student_id, status, marked_by) VALUES (?, ?, ?, ?, ?)`,
    [`rec_today_st2`, `att_sess_today`, 'usr_student_2', 'present', 'usr_teacher_1']);

  // 10. ANNOUNCEMENTS & COMMENTS
  await run(`INSERT INTO announcements (id, course_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)`,
    ['anc_1', 'crs_web_dev', 'usr_teacher_1', 'Welcome to Modern Full-Stack Web Development!', 'Please review the syllabus, setup your Node.js environment, and complete Quiz 1 before the deadline.']);

  await run(`INSERT INTO announcements (id, course_id, author_id, title, body) VALUES (?, ?, ?, ?, ?)`,
    ['anc_2', 'crs_web_dev', 'usr_teacher_1', 'Assignment 1 Submissions Open', 'Assignment 1 is now open for submissions. Ensure your GitHub repository contains clean migrations.']);

  await run(`INSERT INTO comments (id, course_id, assignment_id, author_id, body) VALUES (?, ?, ?, ?, ?)`,
    ['cmt_1', 'crs_web_dev', 'asg_1', 'usr_student_1', 'Should we include database migration scripts in the repository submission?']);
  await run(`INSERT INTO comments (id, course_id, assignment_id, author_id, parent_id, body) VALUES (?, ?, ?, ?, ?, ?)`,
    ['cmt_2', 'crs_web_dev', 'asg_1', 'usr_teacher_1', 'cmt_1', 'Yes, include all SQL migration files in the database/migrations directory.']);

  // 11. NOTIFICATIONS
  // Admin notifications
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_admin_1', 'usr_admin_1', 'salary_request', 'Faculty Salary Disbursement Request', 'Dr. Rahim Ahmed submitted a salary clearance request of ৳45,000 for October 2026.', '/admin/salaries']);
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_admin_2', 'usr_admin_1', 'new_payment', 'New Student Tuition Payment Received', 'Arafat Rahman (ID: CS-2026-001) paid ৳15,000 semester tuition clearance via bKash (Ref: TRX-99214).', '/admin/student-payments']);

  // Teacher notifications
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_teacher_1', 'usr_teacher_1', 'submission', 'New Assignment Submission', 'Tanvir Hossain submitted Assignment 1: RESTful API Design & Relational Modeling', '/teacher/gradebook']);
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_teacher_2', 'usr_teacher_1', 'salary_disbursed', 'Monthly Salary Disbursed', 'Institutional payroll for September 2026 (৳45,000) has been transferred to your bank account.', '/teacher/salary']);

  // Student notifications
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_student_1', 'usr_student_1', 'grade_released', 'Grade Released for Assignment 1', 'Dr. Rahim Ahmed evaluated your submission: 95/100 (A)', '/student/progress']);
  await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
    ['notif_student_2', 'usr_student_1', 'announcement', 'New Announcement in Web Dev', 'Assignment 1 Submissions Open', '/student/courses/crs_web_dev']);

  // 12. TEACHER SALARIES
  // 1 Paid salary for Teacher 1 (with voucher!)
  await run(`INSERT INTO teacher_salaries (id, teacher_id, course_id, amount, payment_date, pay_period, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sal_1', 'usr_teacher_1', 'crs_web_dev', 45000.00, '2026-09-30', 'September 2026', 'BEFTN / Bank Transfer', 'TRX-SEP-839201', 'paid', 'Monthly faculty payroll - Web & Cloud Systems track']);

  // 1 Pending salary for Teacher 1 (allows Admin to test "Disburse Now" button!)
  await run(`INSERT INTO teacher_salaries (id, teacher_id, course_id, amount, payment_date, pay_period, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sal_2', 'usr_teacher_1', 'crs_web_dev', 45000.00, '2026-10-31', 'October 2026', 'BEFTN / Bank Transfer', 'TRX-OCT-914820', 'pending', 'Monthly faculty payroll - Web & Cloud Systems track']);

  // 1 Paid salary for Teacher 2
  await run(`INSERT INTO teacher_salaries (id, teacher_id, course_id, amount, payment_date, pay_period, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sal_3', 'usr_teacher_2', 'crs_db_design', 50000.00, '2026-10-31', 'October 2026', 'City Bank Direct', 'TRX-OCT-914821', 'paid', 'Monthly faculty payroll - Database Design track']);

  // 13. STUDENT PAYMENTS & TRANSACTIONS
  // Student 1: Fully Paid (৳0 due)
  await run(`INSERT INTO student_payments (id, student_id, course_id, title, total_amount, paid_amount, due_amount, payment_date, due_date, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pay_1', 'usr_student_1', 'crs_web_dev', 'Fall 2026 Full-Stack Web Development Tuition', 15000.00, 15000.00, 0.00, '2026-09-05 10:30:00', '2026-09-15', 'bKash Merchant', 'INV-2026-001', 'paid', 'Full semester course tuition cleared.']);
  await run(`INSERT INTO student_payment_transactions (id, payment_id, amount, payment_method, transaction_ref, balance_due_after, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['trx_1', 'pay_1', 15000.00, 'bKash Merchant', 'BKASH-TX-99214', 0.00, 'Full tuition payment settlement']);

  // Student 2: Partial Paid (৳5,000 due -> allows testing "Settle Due" in admin and "Pay Due" in student)
  await run(`INSERT INTO student_payments (id, student_id, course_id, title, total_amount, paid_amount, due_amount, payment_date, due_date, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pay_2', 'usr_student_2', 'crs_web_dev', 'Fall 2026 Full-Stack Web Development Tuition', 15000.00, 10000.00, 5000.00, '2026-09-10 11:00:00', '2026-11-25', 'Nagad', 'INV-2026-002', 'partial', 'First installment cleared; 2nd installment of ৳5,000 due by Nov 25.']);
  await run(`INSERT INTO student_payment_transactions (id, payment_id, amount, payment_method, transaction_ref, balance_due_after, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['trx_2', 'pay_2', 10000.00, 'Nagad', 'NAGAD-TX-33109', 5000.00, 'Installment 1 payment recorded']);

  // Student 3: Fully Due (৳15,000 due -> test unpaid invoice)
  await run(`INSERT INTO student_payments (id, student_id, course_id, title, total_amount, paid_amount, due_amount, payment_date, due_date, payment_method, transaction_ref, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['pay_3', 'usr_student_3', 'crs_web_dev', 'Fall 2026 Full-Stack Web Development Tuition', 15000.00, 0.00, 15000.00, null, '2026-11-20', 'Bank Challan Pending', 'INV-2026-003', 'due', 'Semester tuition invoice issued, awaiting payment settlement.']);

  // 14. COURSE ROADMAP
  const sampleRoadmap = JSON.stringify({
    course_id: 'crs_web_dev',
    phases: [
      {
        id: 'phase_1',
        title: 'Phase 1: Frontend Engineering & UI Systems',
        description: 'React components, TypeScript typing, and Tailwind styling',
        status: 'completed',
        topics: ['Modern React Components', 'Hooks & Lifecycle', 'Tailwind Responsive Design']
      },
      {
        id: 'phase_2',
        title: 'Phase 2: Backend Architecture & RESTful APIs',
        description: 'Express, JWT Authentication, and relational schema validation',
        status: 'in_progress',
        topics: ['REST API Design', 'JWT & RBAC Security', 'PostgreSQL Relational Modeling']
      },
      {
        id: 'phase_3',
        title: 'Phase 3: Production Deployment & Cloud',
        description: 'Docker containerization and cloud hosting architecture',
        status: 'upcoming',
        topics: ['Containerization with Docker', 'CI/CD Pipelines', 'Vercel & Cloud Deployments']
      }
    ]
  });

  await run(`INSERT INTO course_roadmaps (id, course_id, created_by, roadmap_data) VALUES (?, ?, ?, ?)`,
    ['rdm_1', 'crs_web_dev', 'usr_teacher_1', sampleRoadmap]);

  // 15. STUDY PLANS
  await run(`INSERT INTO study_plans (id, student_id, goal, start_date, end_date, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['sp_1', 'usr_student_1', 'Master Full-Stack Web Architecture & Deploy Capstone Project', '2026-10-01', '2026-12-15', 'ai_assisted', 'active']);

  await run(`INSERT INTO study_plan_tasks (id, study_plan_id, title, due_at, status, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['spt_1', 'sp_1', 'Complete Quiz 1: Web Architecture & RESTful Services', '2026-11-15 23:59:59', 'completed', 1]);
  await run(`INSERT INTO study_plan_tasks (id, study_plan_id, title, due_at, status, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['spt_2', 'sp_1', 'Submit Assignment 1: RESTful API Design & Relational Modeling', '2026-11-20 23:59:59', 'completed', 2]);
  await run(`INSERT INTO study_plan_tasks (id, study_plan_id, title, due_at, status, position) VALUES (?, ?, ?, ?, ?, ?)`,
    ['spt_3', 'sp_1', 'Submit Assignment 2: Cloud Deployment & Containerization', '2026-11-28 23:59:59', 'pending', 3]);

  // Also clean SQLite file if it exists locally so both remain in sync
  const dataDir = path.resolve(__dirname, '../../data');
  const dbFile = path.join(dataDir, 'edusathi.db');
  if (fs.existsSync(dbFile)) {
    try {
      const sqDb = new Database(dbFile);
      for (const t of tables) {
        try {
          sqDb.prepare(`DELETE FROM ${t}`).run();
        } catch {}
      }
      sqDb.close();
      console.log('[DB] Local SQLite backup database also cleared.');
    } catch {}
  }

  console.log('[DB] Database reset and new data push complete!');
}

if (require.main === module) {
  resetAndSeedDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error resetting and seeding database:', err);
      process.exit(1);
    });
}

