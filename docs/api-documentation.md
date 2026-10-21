# EduSathi: RESTful API Reference

All protected endpoints require `Authorization: Bearer <token>`.

## 1. Authentication & Profile
- `POST /api/auth/login`: Authenticate with email/password; returns JWT and user profile.
- `POST /api/auth/register`: Public student registration (role is locked to `student`).
- `POST /api/auth/logout`: Invalidate session.
- `GET /api/auth/me`: Retrieve current user profile and unread notification count.
- `PATCH /api/me/profile`: Update personal profile fields (`full_name`, `avatar_url`, `department`).

## 2. Admin User Directory
- `GET /api/users`: List, search, and filter all accounts by role and status (Admin only).
- `POST /api/users`: Create student, teacher, or admin account (Admin only).
- `PATCH /api/users/:id`: Modify user status (`active`/`inactive`) or role (Admin only).

## 3. Subjects & Catalog
- `GET /api/subjects`: List academic subjects.
- `POST /api/subjects`: Create academic subject (Admin only).

## 4. Courses, Modules & Lessons
- `GET /api/courses`: List accessible published courses.
- `GET /api/courses/:courseId`: Retrieve course syllabus, modules, quizzes, and assignments.
- `POST /api/courses`: Create course (Teacher / Admin).
- `PATCH /api/courses/:courseId`: Update course information (Course Teacher / Admin).
- `POST /api/courses/:courseId/enroll`: Enroll student in course.
- `GET /api/me/courses`: Retrieve current student's enrolled courses with progress percentages.
- `POST /api/courses/:courseId/modules`: Add module to course.
- `POST /api/modules/:moduleId/lessons`: Add lesson to module.
- `POST /api/lessons/:lessonId/progress`: Mark lesson complete for student.

## 5. Quizzes & Assessments
- `POST /api/courses/:courseId/quizzes`: Create quiz with questions and choices (Teacher / Admin).
- `GET /api/quizzes/:quizId`: Fetch quiz questions (correct answers stripped during attempt).
- `POST /api/quizzes/:quizId/attempts`: Submit attempt; server computes score from database key.
- `GET /api/quizzes/:quizId/attempts`: Teacher review of attempts and scores.
- `GET /api/me/quiz-results`: Student review of released quiz attempts.

## 6. Assignments & Gradebook
- `POST /api/courses/:courseId/assignments`: Create assignment with instructions and max points.
- `GET /api/courses/:courseId/assignments`: List assignments for course.
- `GET /api/assignments/:assignmentId`: View assignment details and student's submission.
- `POST /api/assignments/:assignmentId/submissions`: Submit solution text or artifact URL.
- `GET /api/assignments/:assignmentId/submissions`: Teacher review of submissions.
- `PATCH /api/submissions/:submissionId/grade`: Record score and feedback (validates `0 <= score <= max_score`).
- `GET /api/me/grades`: Student list of released grades.
- `GET /api/teacher/gradebook`: Comprehensive teacher gradebook matrix across courses.

## 7. Attendance Register
- `POST /api/courses/:courseId/attendance-sessions`: Record session attendance for enrolled students.
- `GET /api/courses/:courseId/attendance`: Teacher view of course attendance stats.
- `GET /api/me/attendance`: Student view of 365-day attendance heatmap and session logs.

## 8. Academic Analytics
- `GET /api/analytics/student`: Average scores, completion rate, attendance %, upcoming tasks.
- `GET /api/analytics/teacher`: Course averages, grading backlog, flagged students (< 60%).
- `GET /api/analytics/admin`: Institutional metrics, role distributions, activity logs.

## 9. AI Study Assistant
- `POST /api/ai/study-assistant`: Solicit curriculum-grounded explanation, practice questions, or revision plans.
