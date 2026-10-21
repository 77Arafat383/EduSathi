# EduSathi: Database Design & Relational ER Model

## 1. Relational Entities (22 Core Tables)

1. `profiles`: System users with `role IN ('student', 'teacher', 'admin')` and `status IN ('active', 'inactive')`.
2. `subjects`: Academic subjects and departmental classifications.
3. `courses`: Courses owned by an instructor, linked to subjects.
4. `course_teachers`: Composite key (`course_id`, `teacher_id`) for co-instructors.
5. `enrollments`: Student-to-course relationship with unique constraint preventing duplicate enrollments.
6. `modules`: Sequential course sections.
7. `lessons`: Markdown-formatted learning materials.
8. `lesson_progress`: Student lesson completion registry.
9. `quizzes`: Online assessments with status and release flags.
10. `quiz_questions`: Questions with type (`single` or `multiple`) and point values.
11. `quiz_options`: Choices with correct answer indicators (hidden during attempts).
12. `quiz_attempts`: Student assessment submission with server-calculated score.
13. `quiz_answers`: Individual answer selections linked to attempts.
14. `assignments`: Coursework tasks with deadlines and point maximums.
15. `submissions`: Student submissions (text and external artifact URLs).
16. `grades`: Evaluations with teacher score and feedback.
17. `attendance_sessions`: Course session dates.
18. `attendance_records`: Attendance status (`present`, `absent`, `late`) per student.
19. `announcements`: Course announcements.
20. `comments`: Discussion threads supporting course, assignment, or quiz doubts.
21. `notifications`: In-app notification queue.
22. `study_plans` & `study_plan_tasks`: Revision plans generated with AI assistance.

## 2. Integrity & Performance
- Foreign key constraints ensure referential integrity.
- Indexes on `course_id`, `student_id`, `session_id`, `assignment_id`, and `recipient_id`.
- Supabase Row-Level Security (RLS) policies configured for multi-tenant data isolation.
