-- ====================================================================
-- EduSathi LMS - Comprehensive Synthetic Seed Data
-- Passwords:
-- Admin:    Admin@123
-- Teachers: Teacher@123
-- Students: Student@123
-- (Bcrypt hashes generated with 10 salt rounds)
-- ====================================================================

-- 1. Profiles
INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department)
VALUES
('usr_admin_1', 'System Administrator', 'admin@edusathi.edu', '$2b$10$wTfZ7eY5v5.3fC3d9E0n9u7xZlT0Y7.jE0jN1s5B9.i3g1.9T0Y7e', 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, 'Administration'),
('usr_teacher_1', 'Dr. Rahim Ahmed', 'dr.rahim@edusathi.edu', '$2b$10$k1rE3s4d5f6g7h8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c', 'teacher', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NULL, 'Computer Science & Engineering'),
('usr_teacher_2', 'Prof. Fatima Rahman', 'prof.fatima@edusathi.edu', '$2b$10$k1rE3s4d5f6g7h8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c', 'teacher', 'active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', NULL, 'Information Technology'),
('usr_student_1', 'Arafat Rahman', 'student.arafat@edusathi.edu', '$2b$10$s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s', 'student', 'active', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 'CS-2024-001', 'Computer Science & Engineering'),
('usr_student_2', 'Tanvir Hossain', 'student.nstu@edusathi.edu', '$2b$10$s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s', 'student', 'active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'CS-2024-002', 'Software Engineering'),
('usr_student_3', 'Sarah Jenkins', 'student.sarah@edusathi.edu', '$2b$10$s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s', 'student', 'active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'CS-2024-003', 'Information Technology')
ON CONFLICT (id) DO NOTHING;

-- 2. Subjects
INSERT INTO subjects (id, name, code, description, status)
VALUES
('subj_cs', 'Computer Science & Engineering', 'CSE-100', 'Foundations of computer systems, algorithms, and full-stack software development.', 'active'),
('subj_ai', 'Artificial Intelligence & Machine Learning', 'AIML-200', 'Machine learning principles, neural networks, and generative AI systems.', 'active'),
('subj_dbms', 'Database Management & Systems', 'DBMS-300', 'Relational database models, SQL, transactions, indexing, and high availability.', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Courses
INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url)
VALUES
('crs_web_dev', 'Modern Full-Stack Web Development & Cloud Systems', 'Master React, TypeScript, Node.js, RESTful architectures, and scalable cloud deployments.', 'subj_cs', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'),
('crs_ai_eng', 'Applied AI & LLM Systems Engineering', 'Hands-on exploration of transformers, prompt engineering, context management, and AI assistants.', 'subj_ai', 'published', 'usr_teacher_1', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600'),
('crs_db_design', 'Relational Database Engineering with PostgreSQL', 'Deep dive into relational algebra, query optimization, indexing strategies, and database security.', 'subj_dbms', 'published', 'usr_teacher_2', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600')
ON CONFLICT (id) DO NOTHING;

-- 4. Course Teachers
INSERT INTO course_teachers (course_id, teacher_id)
VALUES
('crs_web_dev', 'usr_teacher_1'),
('crs_ai_eng', 'usr_teacher_1'),
('crs_db_design', 'usr_teacher_2')
ON CONFLICT (course_id, teacher_id) DO NOTHING;

-- 5. Enrollments
INSERT INTO enrollments (id, course_id, student_id, status)
VALUES
('enr_1', 'crs_web_dev', 'usr_student_1', 'active'),
('enr_2', 'crs_ai_eng', 'usr_student_1', 'active'),
('enr_3', 'crs_db_design', 'usr_student_1', 'active'),
('enr_4', 'crs_web_dev', 'usr_student_2', 'active'),
('enr_5', 'crs_db_design', 'usr_student_2', 'active'),
('enr_6', 'crs_web_dev', 'usr_student_3', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. Modules
INSERT INTO modules (id, course_id, title, position)
VALUES
('mod_1', 'crs_web_dev', 'Module 1: Modern Client-Server Architecture', 1),
('mod_2', 'crs_web_dev', 'Module 2: State Management & Component Lifecycle', 2),
('mod_3', 'crs_ai_eng', 'Module 1: Foundations of Generative AI', 1),
('mod_4', 'crs_db_design', 'Module 1: Relational Schema & ACID Guarantees', 1)
ON CONFLICT (id) DO NOTHING;

-- 7. Lessons
INSERT INTO lessons (id, module_id, title, content, position)
VALUES
('les_1', 'mod_1', 'Understanding REST APIs & HTTP Protocol', '### Overview of HTTP & REST\n\nRepresentational State Transfer (REST) is an architectural style for distributed hypermedia systems.\n\nKey Concepts:\n- **Statelessness**: Every request contains all necessary credentials and context.\n- **Client-Server Separation**: The user interface concerns are decoupled from the data storage concerns.\n- **Idempotency**: GET, PUT, and DELETE methods produce identical side-effects upon repeated execution.', 1),
('les_2', 'mod_1', 'Securing API Endpoints: JWT & RBAC', '### Authentication and Authorization\n\nSecurity is paramount in web applications. Role-Based Access Control (RBAC) ensures users execute operations only within authorized scopes.\n\n- **JWT Verification**: Decoded server-side with cryptographic secrets.\n- **BOLA Protection**: Verifying ownership for every resource query.', 2),
('les_3', 'mod_2', 'React Context API and Hook Paradigms', '### React Hooks Deep Dive\n\nUnderstand `useState`, `useEffect`, `useMemo`, and custom hooks for scalable application state.', 1),
('les_4', 'mod_3', 'Prompt Engineering & System Directives', '### Prompt Design Patterns\n\nMaster role prompts, few-shot examples, system bounds, and output formatting with JSON constraints.', 1)
ON CONFLICT (id) DO NOTHING;

-- 8. Lesson Progress
INSERT INTO lesson_progress (student_id, lesson_id, completed_at)
VALUES
('usr_student_1', 'les_1', NOW() - INTERVAL '3 days'),
('usr_student_1', 'les_2', NOW() - INTERVAL '1 day')
ON CONFLICT (student_id, lesson_id) DO NOTHING;

-- 9. Quizzes
INSERT INTO quizzes (id, course_id, title, instructions, max_score, due_at, status, results_released)
VALUES
('qiz_web_1', 'crs_web_dev', 'Quiz 1: Web Architecture & RESTful Services', 'Answer all 4 questions. Multiple-choice questions have either single or multiple correct answers.', 40, NOW() + INTERVAL '5 days', 'published', TRUE),
('qiz_ai_1', 'crs_ai_eng', 'Quiz 1: LLM Principles & Context Windows', 'Test your understanding of model context limits, tokenization, and temperature settings.', 30, NOW() + INTERVAL '7 days', 'published', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 10. Quiz Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, position)
VALUES
('qq_1', 'qiz_web_1', 'Which of the following HTTP methods are idempotent by definition?', 'multiple', 10, 1),
('qq_2', 'qiz_web_1', 'What does BOLA stand for in API security context?', 'single', 10, 2),
('qq_3', 'qiz_web_1', 'Where should sensitive database credentials and AI API keys be stored?', 'single', 10, 3),
('qq_4', 'qiz_web_1', 'Which status code indicates an unauthenticated request?', 'single', 10, 4)
ON CONFLICT (id) DO NOTHING;

-- 11. Quiz Options
INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation)
VALUES
('opt_1_1', 'qq_1', 'GET', TRUE, 'GET is safe and idempotent.'),
('opt_1_2', 'qq_1', 'PUT', TRUE, 'PUT replaces a resource and is idempotent.'),
('opt_1_3', 'qq_1', 'DELETE', TRUE, 'DELETE is idempotent (repeated calls produce the same state).'),
('opt_1_4', 'qq_1', 'POST', FALSE, 'POST creates a new resource each time and is not idempotent.'),
('opt_2_1', 'qq_2', 'Broken Object Level Authorization', TRUE, 'BOLA occurs when an API endpoint does not verify resource ownership.'),
('opt_2_2', 'qq_2', 'Binary Object Linked Access', FALSE, 'Incorrect definition.'),
('opt_2_3', 'qq_2', 'Basic Online Login Authentication', FALSE, 'Incorrect definition.'),
('opt_3_1', 'qq_3', 'In server-side environment variables (.env)', TRUE, 'Privileged secrets must never be exposed to the browser bundle.'),
('opt_3_2', 'qq_3', 'In client localStorage', FALSE, 'Dangerous; accessible by client scripts.'),
('opt_3_3', 'qq_3', 'In public GitHub repositories', FALSE, 'Severe security vulnerability.'),
('opt_4_1', 'qq_4', '401 Unauthorized', TRUE, '401 indicates missing or invalid credentials.'),
('opt_4_2', 'qq_4', '403 Forbidden', FALSE, '403 indicates authenticated but insufficient permissions.'),
('opt_4_3', 'qq_4', '404 Not Found', FALSE, '404 indicates resource not found.')
ON CONFLICT (id) DO NOTHING;

-- 12. Assignments
INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status)
VALUES
('asg_1', 'crs_web_dev', 'Assignment 1: RESTful API Design & Relational Modeling', 'Design a scalable REST API schema and implement SQL tables with foreign key constraints and proper indexes. Submit your GitHub repository link and architectural summary.', 100, NOW() + INTERVAL '3 days', 'text_or_link', 'published'),
('asg_2', 'crs_ai_eng', 'Assignment 1: Prompt Template & RAG Pipeline Design', 'Develop an AI study prompt pipeline with safety guardrails and deterministic fallback mechanisms.', 100, NOW() + INTERVAL '10 days', 'text_or_link', 'published')
ON CONFLICT (id) DO NOTHING;

-- 13. Submissions
INSERT INTO submissions (id, assignment_id, student_id, content, file_url, submitted_at, status)
VALUES
('sub_1', 'asg_1', 'usr_student_1', 'Implemented REST endpoints in Express with Zod validation, PostgreSQL schema migrations, and JWT authentication. GitHub: https://github.com/77Arafat383/EduSathi', 'https://edusathi.local/uploads/architecture_diagram.pdf', NOW() - INTERVAL '2 days', 'graded'),
('sub_2', 'asg_1', 'usr_student_2', 'Completed the assignment with complete relational schema, foreign key constraints, and unit tests.', NULL, NOW() - INTERVAL '1 day', 'submitted')
ON CONFLICT (id) DO NOTHING;

-- 14. Grades
INSERT INTO grades (id, submission_id, graded_by, score, feedback, released_at)
VALUES
('grd_1', 'sub_1', 'usr_teacher_1', 95.0, 'Outstanding architecture, rigorous validation with Zod, and clear separation of concerns! Keep up the great work.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 15. Announcements
INSERT INTO announcements (id, course_id, author_id, title, body, published_at)
VALUES
('anc_1', 'crs_web_dev', 'usr_teacher_1', 'Welcome to Modern Full-Stack Web Development!', 'Please review the syllabus, setup your Node.js environment, and complete Quiz 1 before Sunday midnight.', NOW() - INTERVAL '4 days'),
('anc_2', 'crs_web_dev', 'usr_teacher_1', 'Assignment 1 Submissions Now Open', 'Assignment 1 has been posted. You can submit your repository link or written text directly through the student portal.', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 16. Notifications
INSERT INTO notifications (id, recipient_id, type, title, message, link, read_at)
VALUES
('notif_1', 'usr_student_1', 'grade_released', 'Grade Released for Assignment 1', 'Dr. Rahim Ahmed graded your submission: 95/100', '/student/assignments/asg_1', NULL),
('notif_2', 'usr_student_1', 'announcement', 'New Announcement in Web Dev', 'Assignment 1 Submissions Now Open', '/student/courses/crs_web_dev', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
