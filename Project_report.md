# EduSathi

# 1. Project Overview

## 1.1 Project title

EduSathi: AI-Powered Smart Learning Management System

EduSathi is a responsive, full-stack educational platform that brings course management, learning resources, assessments, assignment submissions, grading, attendance, academic analytics, notifications, and AI-assisted study guidance into one application.

The platform will serve three primary roles:

- Student: learns from courses, attempts quizzes, submits assignments, tracks academic progress, and receives study guidance.
- Teacher: creates courses, publishes learning resources, prepares assessments, grades submissions, records attendance, and reviews student performance.
- Administrator: manages users, roles, subjects, courses, platform-wide records, and administrative reports.

The first release will be a functional, demonstrable learning platform. Its architecture should leave room for future expansion into a multi-institution product, but the first release will not pretend to be a complete commercial SaaS platform.

## 1.2 Problem statement

Educational activities are often distributed across separate applications and manual processes. Course materials may be shared in one place, assignments submitted somewhere else, grades stored in spreadsheets, attendance recorded manually, and student questions handled through unrelated messaging tools.

This fragmentation creates several problems:

1. Students may struggle to identify upcoming deadlines and understand their academic progress.
2. Teachers may spend unnecessary time managing courses, collecting assignments, calculating scores, and maintaining attendance.
3. Administrators may lack a centralized view of courses, users, and institutional activity.
4. Students may receive generic study suggestions instead of guidance based on their available course content and performance.
5. Communication about lessons, assignments, announcements, and grades can become scattered.
6. Academic information may be exposed if access permissions are not properly enforced.

EduSathi addresses these issues through a centralized, role-based learning environment with an AI-assisted study workflow.

## 1.3 Project objectives

The main objectives are to:

1. Build a centralized platform for courses, lessons, and learning materials.
2. Provide separate student, teacher, and administrator dashboards.
3. Support multiple-choice quizzes with server-side automatic grading.
4. Support assignment creation, submission, teacher evaluation, and feedback.
5. Record attendance and calculate attendance summaries.
6. Display meaningful academic analytics using actual database records.
7. Integrate an AI study assistant that can explain concepts and suggest revision activities.
8. Provide announcements and in-app notifications.
9. Create a responsive interface for desktop, tablet, and mobile browsers.
10. Protect accounts and academic records through authentication, authorization, input validation, and security testing.
11. Provide setup instructions, API documentation, a database design, testing evidence, and a final security audit.

## 1.4 Target users and use cases

| User group | Primary needs | Typical activities |
| --- | --- | --- |
| Students | Learning and progress tracking | Open lessons, take quizzes, submit assignments, view grades, check attendance, ask the AI assistant for help |
| Teachers | Teaching and assessment management | Create courses, publish lessons, prepare quizzes, review submissions, assign grades, record attendance |
| Administrators | Platform management | Manage accounts, roles, subjects, course assignments, account status, and reports |

The design should be suitable for university communities, schools, coaching centres, and independent teachers. Supporting all these organizations as fully isolated customers is a future extension, not an assumption about the first release.

# 2. Final Scope and Project Boundaries

## 2.1 Required in the first release

Authentication and permissions

Login, logout, current-user session, account status checks, role-based dashboards, server-side authorization, and secure account handling.

Courses and lessons

Course creation, teacher assignment, student enrolment, course details, modules, lessons, learning resources, and course access control.

Assessments

Multiple-choice quiz creation, student attempts, server-side scoring, assignment submissions, teacher grading, and feedback.

Academic management

Attendance recording, student progress, teacher analytics, administrative summaries, announcements, and in-app notifications.

AI study assistant

Concept explanations, revision planning, practice-question generation, and suggestions based on authorized academic context.

Security, testing, and documentation

Security audit, regression testing, responsive checks, deployment configuration, API documentation, database documentation, and a complete README.

## 2.2 Included when the core workflows are stable

- Course-level comments and discussion.
- Managed file uploads for course materials and assignment submissions.
- Search, filtering, and pagination.
- Downloadable reports.
- More detailed analytics and teacher follow-up indicators.

## 2.3 Outside the first release

The following should not be allowed to endanger the completion of the core platform:

- Real-time private chat, typing indicators, and read receipts.
- Live video classes.
- Payment gateways, subscriptions, invoicing, and paid course purchases.
- Certificates and automated certificate verification.
- Advanced plagiarism detection and online proctoring.
- A custom-trained AI model.
- A sophisticated retrieval-augmented generation system across a large document library.
- Full multi-tenant administration with independently isolated institutions.
- A native Android or iOS application.

These are possible future features. They should not appear as completed features in the project report unless they are implemented and verified.

# 3. Final Technology Stack

Final decision: use React + Node.js/Express + TypeScript + Supabase PostgreSQL. This is a relational full-stack application, 

Frontend — React, Vite, TypeScript

Pages, dashboards, reusable UI components, forms, charts, route navigation, and responsive behavior.

UI — Tailwind CSS and shadcn/ui

Consistent styling, cards, dialogs, navigation, tables, form elements, and accessible components.

Backend — Node.js, Express, TypeScript

REST APIs, validation, authentication, permissions, business rules, grading, analytics, and AI integration.

Database — Supabase PostgreSQL

Users, courses, enrolments, assessments, attendance, grades, announcements, notifications, and related records.

AI — Gemini API or another supported LLM provider

Concept explanations, revision suggestions, and practice questions, accessed only through the backend.

### 3.1 Supporting libraries

| Purpose | Final choice |
| --- | --- |
| Frontend routing | React Router |
| Server validation | Zod |
| Frontend forms | React Hook Form + Zod |
| Database access | Prisma ORM with PostgreSQL, or a consistent parameterized-query approach |
| Charts | Recharts |
| Icons | Lucide React |
| API requests | Centralized Fetch wrapper or Axios |
| Security headers | Helmet |
| Authentication | Supabase Auth with server-verified access, or a carefully implemented server-managed session |
| Rate limiting | Express rate-limiting middleware with production-appropriate storage |
| File storage | Supabase Storage or another managed object-storage service |
| Testing | Vitest and React Testing Library; Supertest for Express APIs |
| API documentation | OpenAPI/Swagger or a detailed Markdown API reference |
| Version control | Git and GitHub |
| Deployment | Vercel or Netlify for frontend; Render or equivalent for backend; Supabase for PostgreSQL |

Do not install all libraries at the beginning. Install and configure dependencies as the relevant feature is implemented.

### 3.2 Important authentication decision

For this browser-based project, use one authentication approach consistently. The recommended default is Supabase Auth with access tokens verified by the backend, with the browser session handled securely and long-lived credentials not stored in `localStorage`.

If you instead implement custom authentication, use a well-reviewed session approach or secure HTTP-only cookies, and implement the associated CSRF controls. Do not combine multiple competing authentication systems without a clear reason.

The backend must independently verify the authenticated identity and role for protected operations. Frontend route guards alone are not security controls.

# 4. System Architecture

EduSathi will use a modular client-server architecture. The frontend will not connect directly to the database using privileged credentials. It will call the Express API, which will validate requests, enforce permissions, apply business rules, and access the database.

Presentation Layer

React · Vite · TypeScript · Tailwind CSS

Student / Teacher / Admin interfaces

Application Layer

Express REST API · Authentication · Authorization

Validation · Business logic · Error handling · Rate limiting

PostgreSQL

Academic records

AI provider

Study guidance

File storage

Private resources

## 4.1 How a typical request works

Suppose a teacher creates a new assignment:

1. The teacher opens the assignment form in React.
2. The frontend validates basic form fields and sends the request to express.
3. The backend authenticates the teacher.
4. The backend verifies that the teacher is authorized to manage the selected course.
5. The backend validates the assignment title, instructions, maximum marks, deadline, and any other submitted fields.
6. The backend stores the assignment in PostgreSQL.
7. The application creates notifications for the appropriate enrolled students, if notifications are enabled for that event.
8. The API returns a structured success response.
9. The frontend refreshes the assignment list and displays a confirmation.

The same pattern applies to quiz creation, attendance, grading, and other operations.

## 4.2 Separation of responsibilities

- Frontend: display data, collect input, provide navigation, and show loading/error states.
- Backend: validate requests, authenticate users, authorize access, enforce business rules, and orchestrate integrations.
- Database: store persistent records and enforce relational constraints.
- AI service: generate study assistance from approved context; it does not own official grades or permissions.
- File storage: store uploaded files with access restrictions independent of the visual interface.

# 5. Authentication and Account Management

## 5.1 Public pages

The public part of EduSathi will include:

- `/` — landing page
- `/features` — platform features
- `/about` — project information
- `/login` — login
- `/register` — registration, if enabled
- `/forgot-password` — optional account recovery page, included only if the workflow is implemented

The landing page should explain the platform, highlight its main capabilities, and provide clear Login and Get Started actions.

## 5.2 Registration policy

For the initial release, use controlled registration:

- An administrator can create student and teacher accounts.
- Student self-registration may be enabled if it can be implemented securely.
- Public registration must never let a user choose the Admin role.
- Teacher accounts can be created by an administrator or through an invitation/approval workflow.
- Account status must be checked during authentication and on protected requests.

Suggested registration fields:

- Full name
- Email address
- Password
- Confirm password
- Optional student ID or institution information
- login will also possible with google authentication

The server must validate the email, enforce password requirements, prevent duplicate accounts, and create the account through the chosen authentication system. If using Supabase Auth, do not separately store a custom plaintext password in the application database.

## 5.3 Login and session behavior

The login process should:

1. Accept the user's credentials.
2. Authenticate them through the chosen authentication system.
3. Check whether the account is allowed to access the application.
4. Retrieve the user's profile and authorized role.
5. Show the appropriate dashboard.
6. Fetch protected data through authenticated API requests.

Expected destinations:

| Role | Dashboard |
| --- | --- |
| Student | `/student` |
| Teacher | `/teacher` |
| Admin | `/admin` |

Logout must invalidate the application's session or revoke the relevant credentials according to the chosen authentication design.

## 5.4 Authentication requirements

- Never store plaintext passwords.
- If custom password storage is used, hash passwords with Argon2id or a suitably configured bcrypt implementation.
- Use secure, HTTP-only cookies for cookie-based browser sessions.
- Set `Secure` in HTTPS production environments and configure `SameSite` appropriately.
- Do not store long-lived authentication credentials in `localStorage` or `sessionStorage`.
- Validate authentication tokens or sessions on the server.
- Enforce expiry and logout behavior.
- Use generic login errors that do not reveal whether an email address exists.
- Rate-limit login, registration, password recovery, and verification attempts.
- Protect administrator accounts and operations.
- Remove default credentials and development-only accounts from production.
- Add MFA for administrators if feasible; otherwise, document it as a remaining security requirement rather than claiming it is implemented.

## 5.5 Role-based route protection

The frontend should use reusable `ProtectedRoute` and `RoleGuard` components to improve navigation and user experience. However, the backend must authorize every protected API operation independently.

Examples:

- A student entering `/admin/users` should not gain access to administrator data.
- A student calling a grade-update endpoint must be denied.
- A teacher requesting a private course managed by another teacher must be denied unless explicitly authorized.
- A user attempting to change their own role to Admin must be denied.

# 6. Student Dashboard

The student dashboard is the learner's main workspace. Its content should be based on actual records rather than hard-coded demonstration numbers.

## 6.1 Dashboard overview

Display:

- Welcome message and profile information.
- Number of enrolled courses.
- Pending assignments.
- Upcoming deadlines.
- Recent quiz results.
- Average score, where meaningful.
- Attendance percentage.
- Course completion.
- Recent announcements and notifications.
- Suggested next study activities.
- A grid will show student attendance  for a year

The dashboard should prioritize actionable information rather than overwhelming the student with too many charts.

## 6.2 My Courses

Route: `/student/courses`

Students can:

- View courses in which they are enrolled.
- Search and filter courses.
- See course titles, descriptions, teacher names, and course status.
- Open course details.
- Access lessons and authorized resources.
- Review course progress.

Course progress should be defined clearly. For example:

$\text{Completion \%} =
\frac{\text{Lessons marked complete}}
{\text{Total published lessons}}\times100$

This measures lesson completion, not proof that the student has mastered the subject.

## 6.3 Course details

Route: `/student/courses/:courseId`

The course page should contain:

- Course overview
- Teacher information
- Modules and lessons
- Learning notes and resources
- Available quizzes
- Assignments and deadlines
- Announcements
- Course comments, if implemented
- Progress summary

A student must be enrolled or otherwise authorized to access private course content.

## 6.4 Quiz and examination system

The initial assessment system should support multiple-choice questions.

Student workflow:

1. Open an available quiz.
2. Read the instructions and availability information.
3. Select answers.
4. Review answers before submitting, where allowed.
5. Submit the attempt.
6. Receive a confirmation.
7. View the score and explanations when results have been released.

The backend must calculate the score using the correct answers stored on the server. It must not accept a score calculated by the browser.

Quiz requirements:

- Questions and options must be validated.
- Correct answers must not be returned to students before they are allowed to see them.
- Duplicate or repeated attempts must follow the quiz's configured policy.
- A submitted attempt must not be silently modified afterward.
- Result visibility must respect the teacher's release settings.
- Attempt records must be linked to the correct student and quiz.

Essay questions, question banks, random question selection, timed examinations, and sophisticated anti-cheating tools are later extensions.

## 6.5 Assignment submission

Routes:

- `/student/assignments`
- `/student/assignments/:assignmentId`

Students should be able to:

- Read assignment instructions.
- View the deadline and maximum marks.
- Submit written text.
- Upload a file if the secure upload workflow is implemented.
- See the submission timestamp and status.
- View teacher feedback and released marks.

Suggested states:

`Not Submitted → Submitted → Graded`

Late submissions can be flagged separately. Whether late work is accepted should be controlled by the assignment rules, not by frontend assumptions.

## 6.6 Results and learning progress

Route: `/student/progress`

Display:

- Quiz scores over time.
- Assignment results.
- Course completion.
- Attendance summary.
- Upcoming academic tasks.
- Topics associated with lower assessment scores.
- Suggested revision activities.

A low score can be used as a signal for additional practice, but EduSathi must not treat it as a definitive diagnosis of a student's ability or learning difficulty.

## 6.7 AI Study Assistant

Route: `/student/ai-assistant`

Students should be able to ask questions such as:

- “Explain this topic in simple language.”
- “Create a revision plan for my upcoming exam.”
- “Generate five practice questions about this lesson.”
- “Which topics should I revise based on my recent quiz results?”
- “Help me organize my remaining assignments.”

The backend may use authorized course materials, relevant assessment summaries, and upcoming deadlines as context.

The AI must not:

- Change official grades.
- Bypass course permissions.
- Pretend it has reviewed records it did not receive.
- Make final academic decisions.
- Reveal another student's private information.

## 6.8 Profile and notifications

Students can view and update permitted profile fields, see their notifications, mark notifications as read, and open relevant course or assignment pages.

They must not be allowed to change protected fields such as their role, account status, or privileged permissions through profile editing.

# 7. Teacher Dashboard

The teacher dashboard supports course management, assessments, grading, attendance, and performance review.

## 7.1 Dashboard overview

Display:

- Assigned courses.
- Enrolled student count.
- Pending submissions to grade.
- Upcoming assessments.
- Recent submissions.
- Course performance summary.
- Attendance overview.
- Students with overdue work or repeated low scores.

Each summary should be derived from the teacher's authorized courses only.

## 7.2 Course management

Route: `/teacher/courses`

Teachers can:

- Create a course.
- Edit its title and description.
- Assign a subject or category.
- Create modules and lessons.
- Add notes, text content, and resource links.
- Publish, unpublish, or archive a course.
- View authorized enrolments.
- Publish course announcements.

Each course must have a clear owner or assigned-teacher relationship. The server must verify course ownership or explicit teaching permission for every update.

## 7.3 Lesson and resource management

A lesson can contain:

- Title
- Description
- Module
- Text-based learning content
- External resource links
- Publication status
- Display order
- Optional file attachment

External links must be handled as untrusted input. File attachments must use the validated upload workflow described later.

## 7.4 Quiz builder

Route: `/teacher/quizzes`

Teachers should be able to:

- Create a quiz within an authorized course.
- Add a title and instructions.
- Add multiple-choice questions and answer options.
- Also some question that have multiple answer able to add
- Set correct answers and marks.
- Set availability and deadlines.
- Publish or unpublish the quiz.
- Configure result visibility.
- Review attempts and scores.

The backend must check the question structure and calculate the maximum score consistently.

## 7.5 Assignment builder

Route: `/teacher/assignments`

Fields should include:

- Title
- Instructions
- Associated course
- Due date
- Maximum marks
- Submission type
- Optional reference material
- Publication status
- Late-submission policy, if supported

Teachers should be able to update an assignment only if they are authorized to manage its course.

## 7.6 Gradebook and evaluation

Route: `/teacher/gradebook`

Teachers can:

- View students and their submissions for authorized courses.
- Filter by assignment, course, and submission status.
- Open submitted work.
- Enter a score.
- Write feedback.
- Save and publish results.

The backend must reject invalid scores, including negative scores and scores greater than the maximum marks. A student must not see an unpublished grade.

## 7.7 Attendance management

Route: `/teacher/attendance`

Teachers select a course and session date, then mark enrolled students as:

- Present
- Absent
- Late

The system stores attendance records and calculates summaries.

A simple formula is:

$\text{Attendance \%} =
\frac{\text{Sessions counted as attended}}
{\text{Eligible sessions}}\times100$

The project must define whether late attendance counts as attended, how cancelled sessions are handled, and whether teachers can edit previously recorded attendance.

## 7.8 Teacher analytics

Route: `/teacher/analytics`

Display:

- Average quiz scores.
- Assignment submission rates.
- Grading backlog.
- Attendance percentages.
- Overdue assignments.
- Assessment-level performance.
- Students with repeated low results.

The first release can use transparent, rule-based indicators. For example, a configurable rule can flag repeated quiz scores below a threshold or multiple overdue assignments. Each flag should explain why it was generated.

These indicators are intended to support teacher review, not automatically label or penalize students.

# 8. Administrator Dashboard

The administrator manages users, roles, course organization, and platform-wide information.

## 8.1 Admin overview

Display:

- Total students.
- Total teachers.
- Total courses.
- Published and inactive courses.
- Enrolment counts.
- Quiz and assignment counts.
- Recent administrative activity.
- General platform usage summaries.

## 8.2 User management

Route: `/admin/users`

Administrator capabilities:

- Create student and teacher accounts.
- Search and filter accounts.
- View user profiles.
- Edit permitted profile information.
- Activate or deactivate accounts.
- Assign or change permitted roles.
- Review account status.

Security requirements:

- Only authorized administrators can manage roles.
- Regular users cannot promote themselves.
- A user cannot gain admin access by editing a request body or URL.
- Privileged changes should be logged where practical.
- Admin account creation should be controlled rather than exposed through public registration.

## 8.3 Course and subject management

Routes:

- `/admin/courses`
- `/admin/subjects`
- `/admin/enrollments`

Administrators can:

- View all courses.
- Create and manage subjects.
- Assign teachers.
- Review course details and status.
- Manage enrolments when required.
- Archive inactive courses.
- Resolve basic course-management issues.

Administrative operations must still follow validation and database constraints.

## 8.4 Reports and platform settings

Route: `/admin/reports`

Basic reports can include:

- User distribution by role.
- Course and enrolment counts.
- Attendance summaries.
- Assessment and submission counts.
- Published versus unpublished courses.
- General platform activity.

Advanced audit trails, billing settings, institution branding, subscription administration, and detailed usage metering are future enhancements.

# 9. User Interaction and Notifications

EduSathi should support meaningful communication between users without requiring a full real-time messaging system.

## 9.1 Announcements

Teachers can publish course announcements about:

- New lessons.
- Assignment deadlines.
- Quiz availability.
- Class or session updates.
- Published grades.
- General course information.

Students should only see announcements for courses they are authorized to access.

## 9.2 Course comments

If implemented, comments should support:

- Creating a comment.
- Listing comments in the relevant course.
- Editing or deleting one's own comment under defined rules.
- Replies, if included.
- Appropriate teacher or admin moderation.

The backend must check course membership and ownership for comment operations. Text must be safely rendered to prevent XSS.

## 9.3 In-app notifications

Notifications can be generated when:

- A new assignment is published.
- A quiz becomes available.
- A teacher posts an announcement.
- A grade is released.
- Feedback becomes available.
- A relevant deadline is approaching.

Each notification should contain a recipient, type, title, message, optional internal link, creation timestamp, and read status.

Users must only retrieve and modify notifications addressed to themselves.

## 9.4 Real-time chat decision

Private chat using Socket.IO is not a core requirement for the first release. Announcements, comments, and persistent notifications provide useful communication with less complexity.

If real-time chat is added later, socket connections and every message event must independently verify authentication, conversation membership, and permissions. A visually complete chat interface with mock messages does not count as a functioning messaging feature.

Student able to comment under assignment post or quiz post teacher able to replay that if there any doubt abailable. 

# 10. AI Study Assistant — Detailed Design

AI is one of EduSathi's main differentiators. It should improve the learning workflow rather than exist only as a chatbot on a separate page.

## 10.1 Core capabilities

| Capability | Input | Expected output |
| --- | --- | --- |
| Concept explanation | Student question and permitted lesson context | Clear explanation and examples |
| Revision planning | Study goal, deadlines, available time, relevant results | Suggested study tasks and priorities |
| Practice questions | Selected lesson or topic | Practice questions with answers or explanations, according to the configured mode |
| Revision recommendations | Relevant assessment summaries and course topics | Topics that may benefit from more practice |
| Teacher assistance, optional | Lesson content or quiz topic | Draft questions or teaching suggestions for teacher review |

The AI should not be treated as an authoritative grading system. Official grades remain controlled by the assessment and grading workflows.

## 10.2 AI request workflow

1. The student submits a question.
2. The frontend sends it to `POST /api/ai/study-assistant`.
3. The backend verifies authentication.
4. The backend validates the prompt's size and format.
5. It retrieves only the course content and academic information the student is permitted to access.
6. It sends the request and relevant context to the configured AI provider.
7. The backend handles provider errors and usage limits.
8. The frontend displays the answer and any suggested next steps.

Never expose the AI provider's secret key in the frontend bundle, API response, or public repository.

## 10.3 Example system prompt

```
You are EduSathi's AI study assistant.

Help students understand course concepts and organize their
study activities.

Use only the supplied course context and academic information.
Do not invent grades, deadlines, course content, or student
history. Do not claim to have inspected information that was
not provided.

Explain concepts clearly and give practical examples.
When creating a study plan, consider the student's stated
goals, available study time, and known deadlines.

You may suggest practice activities and revision priorities,
but you must not assign official grades or make final academic
decisions.

Do not reveal private information about other users.
If essential information is missing, ask a clarification
question or state the limitation.
```

This prompt is a starting point, not a security boundary. Permissions and data filtering must be enforced in backend code before information is sent to the model.

## 10.4 AI fallback and failure handling

The platform must remain usable when the AI provider is unavailable.

The application should:

- Show a clear message when AI is not configured.
- Handle timeouts and provider errors gracefully.
- Limit request length and request frequency.
- Avoid retry loops that consume excessive API usage.
- Avoid exposing raw provider errors or secret configuration.
- Offer rule-based study suggestions only when clearly labelled as such.

For example, the system can suggest revising a topic associated with a low quiz score. It must not claim that this suggestion was generated by a live AI model if it came from deterministic rules.

## 10.5 Privacy and AI limitations

Only send the minimum necessary information to the provider. Avoid sending passwords, authentication tokens, unrelated student profiles, or another student's private academic data. Inform users when their questions are processed by an external AI provider, and avoid retaining full AI conversations unless there is a defined product need.

AI-generated explanations can be incorrect. Students should be encouraged to compare answers with course materials and teacher guidance.

# 11. Database Design

The final database is PostgreSQL through Supabase, not MongoDB, SQLite, or MySQL. The application should use relational tables, foreign keys, indexes, constraints, and transactions where appropriate.

A relational database fits EduSathi because students, courses, enrolments, attempts, submissions, and grades have well-defined relationships.

## 11.1 Core database entities

| Table | Purpose and important fields |
| --- | --- |
| `profiles` | `id`, `full_name`, `email`, `role`, `status`, `avatar_url`, timestamps |
| `subjects` | `id`, `name`, `description`, `status` |
| `courses` | `id`, `title`, `description`, `subject_id`, `status`, `created_by`, timestamps |
| `course_teachers` | `course_id`, `teacher_id` |
| `enrollments` | `id`, `course_id`, `student_id`, `status`, `enrolled_at` |
| `modules` | `id`, `course_id`, `title`, `position` |
| `lessons` | `id`, `module_id`, `title`, `content`, `position`, `published_at` |
| `lesson_progress` | `student_id`, `lesson_id`, `completed_at` |
| `quizzes` | `id`, `course_id`, `title`, `instructions`, `max_score`, availability, publication settings |
| `quiz_questions` | `id`, `quiz_id`, `question_text`, `question_type`, `marks`, `position` |
| `quiz_options` | `id`, `question_id`, `option_text`, correct-answer field restricted from student access |
| `quiz_attempts` | `id`, `quiz_id`, `student_id`, `started_at`, `submitted_at`, `score`, status |
| `quiz_answers` | `id`, `attempt_id`, `question_id`, `selected_option_id`, or another validated answer representation |
| `assignments` | `id`, `course_id`, `title`, `instructions`, `max_score`, `due_at`, publication settings |
| `submissions` | `id`, `assignment_id`, `student_id`, text/file reference, status, submitted timestamp |
| `grades` | `id`, `submission_id`, `graded_by`, `score`, `feedback`, `released_at` |
| `attendance_sessions` | `id`, `course_id`, `session_date`, `created_by`, status |
| `attendance_records` | `id`, `session_id`, `student_id`, `attendance_status`, `marked_by` |
| `announcements` | `id`, `course_id`, `author_id`, `title`, `body`, `published_at` |
| `comments` | `id`, `course_id`, `author_id`, `body`, optional `parent_id`, timestamps |
| `notifications` | `id`, `recipient_id`, `type`, `title`, `message`, `link`, `read_at`, timestamps |
| `study_plans` | `id`, `student_id`, `goal`, `start_date`, `end_date`, `source`, status |
| `study_plan_tasks` | `id`, `study_plan_id`, `title`, `due_at`, status, position |
| `ai_conversations`, optional | `id`, `user_id`, metadata, timestamps |
| `ai_messages`, optional | `id`, `conversation_id`, role, content, timestamps |

The exact columns can change slightly during implementation, but the relationships and access rules must remain consistent.

### 11.2 Authentication records and profiles

If Supabase Auth is used, authentication credentials belong to the authentication system. The `profiles` table should reference the authenticated user's ID.

Do not duplicate plaintext passwords or build a second password database unnecessarily. Also, do not trust a role value supplied by a client. Role assignment must be restricted to an authorized server-side workflow.

### 11.3 Core relationships

Users / Profiles

Teacher manages courses; students enrol in courses

Courses

Contains learning and assessment activities

Modules / Lessons

Content and progress

Quizzes / Assignments

Assessments

Lesson Progress

Completion records

Attempts / Submissions

Student work

Grades, Attendance, Analytics and Study Recommendations

### 11.4 Database integrity rules

The database and backend must enforce appropriate rules, including:

- User email uniqueness, where applicable.
- Valid foreign keys between courses, lessons, assessments, and submissions.
- One active enrolment per student and course.
- One attendance record per student and attendance session.
- Valid marks and scores.
- Valid publication and submission states.
- No duplicate answer for the same question in the same attempt, unless the question model explicitly permits it.
- Correct relationship between a submission, assignment, and student.
- Appropriate indexes for frequently queried columns.
- Transactions for operations that must succeed or fail together.

For example, a grade update should not partially save a score while failing to save the related feedback or publication state.

### 11.5 Row-Level Security (RLS)

If using Supabase, enable Row-Level Security on tables exposed through Supabase's Data API and write policies for the intended access model.

Policies must be based on the authenticated identity and authorized relationships, not on client-supplied role claims or arbitrary user IDs.

Examples of intended policy behavior:

- A student reads only their own private grades, submissions, and attendance.
- A teacher reads and modifies academic records only for courses they are authorized to manage.
- An administrator can perform explicitly permitted administrative operations.
- A user can modify their permitted profile fields but cannot assign themselves an elevated role.
- Private storage objects follow the same ownership and course-access rules.

Important: RLS is not a replacement for backend authorization. If the Express backend connects with a privileged Supabase service-role key, that key can bypass RLS. It must never be exposed to the frontend, and the backend must still enforce permissions for every operation.

# 12. Backend API Design

The backend will expose REST endpoints under `/api`. Use a modular structure with routes, controllers, services, validation schemas, and shared middleware.

## 12.1 API conventions

- Use `GET` to retrieve data.
- Use `POST` to create resources or submit actions.
- Use `PATCH` to update permitted fields.
- Use `DELETE` only where deletion is allowed and its consequences are defined.
- Use consistent JSON responses.
- Validate request bodies, query parameters, and route parameters.
- Enforce authentication, permissions, and ownership on the server.
- Use pagination for potentially large lists.
- Do not return fields the requesting user is not allowed to see.

### Example success response

```
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "assignment-id",
    "title": "Database Design Assignment"
  }
}
```

### Example error response

```
{
  "success": false,
  "message": "You are not authorized to perform this action",
  "code": "FORBIDDEN"
}
```

The real implementation should use appropriate HTTP status codes and avoid returning internal exception details.

## 12.2 Authentication and profile endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticate user, if custom login is used | Public, rate-limited |
| `POST` | `/api/auth/logout` | End the session or revoke relevant credentials | Authenticated |
| `GET` | `/api/auth/me` | Retrieve the current authenticated user's profile and role | Authenticated |
| `POST` | `/api/auth/register` | Create an allowed account, if public registration is enabled | Public with restrictions |
| `POST` | `/api/auth/forgot-password` | Request password recovery, if implemented | Public, rate-limited |
| `PATCH` | `/api/me/profile` | Update permitted profile fields | Authenticated |
| `GET` | `/api/users` | Search/list users | Admin |
| `POST` | `/api/users` | Create a student or teacher account | Admin |
| `PATCH` | `/api/users/:id` | Update permitted user fields or status | Admin |

If Supabase Auth handles the browser login flow, do not implement a duplicate custom login endpoint simply to match this table. Keep the actual API consistent with the selected design.

## 12.3 Course and lesson endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | List courses visible to the current user | Role and enrolment scoped |
| `POST` | `/api/courses` | Create a course | Authorized teacher/admin |
| `GET` | `/api/courses/:courseId` | Retrieve course details | Authorized user |
| `PATCH` | `/api/courses/:courseId` | Update course information | Course manager/admin |
| `POST` | `/api/courses/:courseId/enrollments` | Enrol a student or manage enrolment according to policy | Authorized user/admin |
| `GET` | `/api/me/courses` | Retrieve the current student's courses | Student |
| `POST` | `/api/courses/:courseId/modules` | Create a module | Course manager |
| `POST` | `/api/modules/:moduleId/lessons` | Create a lesson | Course manager |
| `GET` | `/api/courses/:courseId/lessons` | Retrieve published lessons accessible to the user | Authorized user |
| `PATCH` | `/api/lessons/:lessonId` | Update a lesson | Course manager |
| `POST` | `/api/lessons/:lessonId/progress` | Mark a lesson complete | Enrolled student |

## 12.4 Quiz endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/courses/:courseId/quizzes` | Create a quiz | Course manager |
| `GET` | `/api/courses/:courseId/quizzes` | List accessible quizzes | Authorized course member |
| `GET` | `/api/quizzes/:quizId` | Retrieve quiz instructions and permitted question data | Authorized student/teacher |
| `PATCH` | `/api/quizzes/:quizId` | Update quiz configuration | Course manager |
| `POST` | `/api/quizzes/:quizId/attempts` | Submit an attempt or create one according to the attempt model | Eligible student |
| `GET` | `/api/quizzes/:quizId/attempts` | Review attempts | Course manager |
| `GET` | `/api/me/quiz-results` | Retrieve the student's released quiz results | Student |

Never return correct answers or private answer keys before the configured release condition is satisfied.

## 12.5 Assignment and grading endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/courses/:courseId/assignments` | Create an assignment | Course manager |
| `GET` | `/api/courses/:courseId/assignments` | List course assignments | Authorized course member |
| `GET` | `/api/assignments/:assignmentId` | View assignment details | Authorized user |
| `POST` | `/api/assignments/:assignmentId/submissions` | Submit assignment work | Eligible student |
| `GET` | `/api/assignments/:assignmentId/submissions` | Review submissions | Course manager |
| `PATCH` | `/api/submissions/:submissionId/grade` | Save score and feedback | Course manager |
| `GET` | `/api/me/grades` | Retrieve the current student's released grades | Student |

The backend must check the assignment's course, the student's enrolment, the submission's owner, the teacher's permissions, and the grade-release state as appropriate.

## 12.6 Attendance and analytics endpoints

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/courses/:courseId/attendance-sessions` | Create an attendance session | Course manager |
| `POST` | `/api/attendance-sessions/:sessionId/records` | Save attendance records | Course manager |
| `GET` | `/api/me/attendance` | Retrieve personal attendance | Student |
| `GET` | `/api/courses/:courseId/attendance` | View course attendance | Course manager |
| `GET` | `/api/analytics/student` | Personal academic analytics | Student |
| `GET` | `/api/analytics/course/:courseId` | Course-level analytics | Course manager |
| `GET` | `/api/analytics/admin` | Platform-wide analytics | Admin |

## 12.7 AI, announcements, comments, and notifications

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/ai/study-assistant` | Generate study assistance | Authenticated, rate-limited |
| `POST` | `/api/courses/:courseId/announcements` | Publish an announcement | Course manager |
| `GET` | `/api/courses/:courseId/announcements` | List authorized course announcements | Authorized course member |
| `GET` | `/api/courses/:courseId/comments` | Retrieve course comments | Authorized course member |
| `POST` | `/api/courses/:courseId/comments` | Create a comment | Authorized course member |
| `PATCH` | `/api/comments/:commentId` | Edit a permitted comment | Author or authorized moderator |
| `DELETE` | `/api/comments/:commentId` | Delete a permitted comment | Author or authorized moderator |
| `GET` | `/api/notifications` | List current user's notifications | Authenticated |
| `PATCH` | `/api/notifications/:notificationId/read` | Mark an owned notification as read | Recipient only |

This endpoint list is the intended design. If the implementation uses slightly different paths, update the API documentation and tests rather than allowing inconsistent routes to accumulate.

## 12.8 HTTP status codes

| Status | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created |
| `204` | Request succeeded with no response body |
| `400` | Invalid request data |
| `401` | Authentication required or invalid |
| `403` | Authenticated but not authorized |
| `404` | Resource not found or intentionally hidden by policy |
| `409` | Duplicate or conflicting operation |
| `413` | Request or upload too large |
| `422` | Validly structured request with invalid field values, if used consistently |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

The API should use a consistent error format and avoid revealing whether private records exist when that information should remain hidden.

# 13. Frontend Pages and Navigation

The following is the full proposed route map. The final implementation should include all essential routes and avoid leaving prominent pages as non-functional placeholders.

## 13.1 Public pages

```
/
├── /features
├── /about
├── /login
├── /register
└── /forgot-password
```

The forgot-password page is conditional on implementing the full recovery flow.

## 13.2 Student pages

```
/student
├── /student/courses
├── /student/courses/:courseId
├── /student/quizzes/:quizId
├── /student/assignments
├── /student/assignments/:assignmentId
├── /student/progress
├── /student/attendance
├── /student/ai-assistant
├── /student/notifications
└── /student/profile
```

## 13.3 Teacher pages

```
/teacher
├── /teacher/courses
├── /teacher/courses/create
├── /teacher/courses/:courseId/edit
├── /teacher/quizzes
├── /teacher/assignments
├── /teacher/submissions
├── /teacher/gradebook
├── /teacher/attendance
├── /teacher/analytics
├── /teacher/announcements
├── /teacher/notifications
└── /teacher/profile
```

## 13.4 Admin pages

```
/admin
├── /admin/users
├── /admin/courses
├── /admin/subjects
├── /admin/enrollments
├── /admin/reports
├── /admin/settings
└── /admin/profile
```

The route map is a design target, not a reason to create empty pages. Each essential page should have a clear purpose, working API integration, and appropriate loading, empty, error, and success states.

## 13.5 Shared UI components

Recommended reusable components:

- `PublicLayout`
- `DashboardLayout`
- `Sidebar`
- `Topbar`
- `MobileNavigation`
- `PageHeader`
- `StatCard`
- `CourseCard`
- `DataTable`
- `SearchFilter`
- `FormField`
- `ConfirmDialog`
- `StatusBadge`
- `LoadingState`
- `EmptyState`
- `ErrorMessage`
- `NotificationDropdown`
- `ProgressChart`
- `ProtectedRoute`
- `RoleGuard`

Reusable components should reduce duplication and provide consistent behavior across all three dashboards.

# 14. UI/UX and Responsive Design

EduSathi should look like one coherent product, not three unrelated dashboard templates.

## 14.1 Visual identity

Recommended visual direction:

- Primary: deep navy or indigo.
- Secondary: teal.
- Background: light neutral grey.
- Cards: white with subtle borders and restrained shadows.
- Typography: Inter or another readable sans-serif.
- Icons: Lucide React.
- Layout: consistent spacing, border radius, and form styling.

Use the same design system for all roles while tailoring their navigation and page content.

## 14.2 Responsive behavior

Desktop

## 1280px+

Sidebar, detailed tables, multi-column cards, full forms, charts.

Tablet

## ~768px

Compact navigation, adapted columns, stacked forms.

Mobile

## ~360px

Single-column cards, touch-friendly controls, compact navigation.

### Responsive acceptance criteria

- No unintended horizontal page overflow at target widths.
- Tables are scrollable or adapt to a mobile-friendly presentation.
- Forms fit narrow screens.
- Buttons and controls are touch-friendly.
- Navigation remains usable.
- Charts resize and retain readable labels.
- Dialogs fit within the viewport.
- Keyboard focus is visible.
- Form fields have labels and accessible validation messages.
- Loading, empty, error, and success states are implemented.

# 15. Recommended Repository and Folder Structure

Use a single Git repository with separate frontend and backend directories.

```
edusathi/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── charts/
│   │   │   └── layout/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── courses/
│   │   │   ├── lessons/
│   │   │   ├── quizzes/
│   │   │   ├── assignments/
│   │   │   ├── attendance/
│   │   │   ├── analytics/
│   │   │   ├── ai-assistant/
│   │   │   └── notifications/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── repositories/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   ├── migrations/
│   ├── seed/
│   └── schema-notes.md
│
├── docs/
│   ├── project-overview.md
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── api-documentation.md
│   ├── testing-report.md
│   └── security-audit.md
│
├── .gitignore
├── .env.example
└── README.md
```

### Folder responsibilities

- `routes/` defines HTTP routes and connects them to middleware/controllers.
- `controllers/` handles HTTP request and response logic.
- `services/` contains business logic, such as grading and analytics calculations.
- `repositories/` centralizes database access if that abstraction is used.
- `validators/` contains Zod schemas and request validation.
- `middleware/` contains authentication, authorization, rate limits, and error handling.
- `tests/` contains automated tests.
- `database/migrations/` contains version-controlled database changes.
- `database/seed/` contains development or demonstration data.
- `docs/` contains the project and verification documentation.

# 16. Non-Functional Requirements

In addition to feature requirements, EduSathi should meet the following quality expectations.

| Area | Requirement |
| --- | --- |
| Security | Server-side authentication and authorization, secure secrets, input validation, and appropriate data isolation |
| Usability | Clear navigation, understandable feedback, and consistent interactions |
| Responsiveness | Usable layouts on desktop, tablet, and mobile |
| Reliability | Core workflows must fail gracefully and avoid corrupting records |
| Performance | Paginate large lists, avoid unnecessary queries, and use indexes where appropriate |
| Maintainability | Modular TypeScript code, reusable components, and consistent conventions |
| Accessibility | Labels, keyboard focus, readable contrast, and accessible controls |
| Data integrity | Valid relationships, constraints, score rules, and consistent submission states |
| Privacy | Minimize stored personal information and restrict private academic records |
| Documentation | Setup, configuration, API, database, tests, security findings, and known limitations |

Do not claim a specific performance benchmark or availability guarantee unless it has been measured under defined conditions.

# 17. Security Architecture and Threat Model

Security is a core project requirement because EduSathi handles accounts, private academic records, uploaded files, and external AI requests. The security design must cover the frontend, backend, database, storage, and deployment configuration.

The full security checklist is also intended to become a documented audit in `docs/security-audit.md`.

## 17.1 Security principles

1. Authenticate users before allowing access to protected operations.
2. Authorize each operation on the server.
3. Verify ownership and course membership for individual resources.
4. Validate all untrusted input on the server.
5. Use parameterized database access.
6. Keep API keys and privileged credentials server-side.
7. Minimize the data returned by APIs and sent to AI providers.
8. Apply rate limits to sensitive or expensive endpoints.
9. Use secure transport and cookie configuration in production.
10. Test access restrictions using separate student, teacher, and administrator accounts.
11. Record security findings honestly.
12. Do not treat the presence of a security library as proof that the application is secure.

## 17.2 Threats and mitigations

| Threat | Example | Required mitigation |
| --- | --- | --- |
| SQL injection | Malicious input changes a database query | Parameterized queries or safe ORM APIs; input validation |
| Cross-site scripting (XSS) | Malicious text executes in another user's browser | Safe React rendering, sanitization when needed, Content Security Policy |
| Cross-site request forgery (CSRF) | A browser is tricked into submitting an unwanted action | Appropriate CSRF defenses for cookie-authenticated state changes |
| Broken Object Level Authorization (BOLA) | A student changes a grade-record ID to access another student's result | Verify ownership and permissions for every resource operation |
| Broken function-level authorization | A student calls an administrator endpoint | Server-side role and permission enforcement |
| Credential theft | Passwords or tokens are exposed | Secure authentication, protected credentials, HTTPS, careful logging |
| Privileged secret exposure | AI key or service-role key appears in frontend code | Server-only secrets, repository and build scans |
| Malicious upload | An executable or oversized file is uploaded | Type and content validation, size limits, safe storage |
| SSRF | A backend fetches an attacker-controlled internal URL | Validate destinations and block unsafe protocols and internal addresses if remote fetching exists |
| Brute force or abuse | Repeated login or AI requests | Rate limits, generic authentication errors, usage limits |
| Dependency vulnerability | An installed package contains a known flaw | Dependency auditing, reviewed updates, regression testing |
| Database policy weakness | RLS permits a student to read another student's records | Explicit policies and tests under separate user identities |

## 17.3 SQL injection prevention

- Use parameterized queries or safe ORM methods.
- Do not concatenate untrusted input into SQL statements.
- Validate search terms, pagination, sort fields, and filter parameters.
- Allowlist dynamic column names and sort directions if dynamic sorting is required.
- Test authentication, course search, filtering, grading, and other database-backed operations.

Validation helps reject invalid input but does not replace parameterized database access.

## 17.4 XSS prevention

- Use React's normal text rendering.
- Avoid unsafe HTML insertion.
- If rich user-authored HTML is permitted, sanitize it with a suitable sanitizer.
- Validate URLs before displaying or navigating to them.
- Add an appropriate Content Security Policy.
- Test comments, lesson content, announcements, profile fields, and AI-generated output.

AI-generated text must also be treated as untrusted content when rendered.

## 17.5 CSRF and session security

If the chosen authentication system relies on cookies, state-changing requests need suitable CSRF protections. These may include SameSite cookie settings, Origin/Referer validation where appropriate, and CSRF tokens according to the design.

CORS is not a replacement for CSRF protection.

If authentication uses bearer tokens rather than automatically sent cookies, assess the corresponding token theft and storage risks instead of blindly applying a cookie-specific design.

## 17.6 BOLA and permission enforcement

BOLA is especially important for EduSathi because academic resources are associated with individual users and courses.

For every protected resource, the backend must check the relevant relationship:

- Is this student enrolled in the course?
- Does this submission belong to the student?
- Is this teacher assigned to manage the course?
- Is this grade released to the requesting student?
- Does this notification belong to the current user?
- Is this user authorized to change the account role or status?

A user being authenticated does not automatically mean they are authorized to access every resource.

## 17.7 File upload security

If uploads are included, implement all of the following:

- Allowlist accepted file extensions.
- Validate MIME type and file signature where applicable.
- Enforce file-size limits.
- Generate server-controlled storage names.
- Prevent path traversal.
- Restrict private files to authorized users.
- Use short-lived signed download URLs or authorized download endpoints where appropriate.
- Prevent untrusted uploaded content from being served as active website code.
- Scan files where practical and appropriate for the intended deployment.

If the secure upload flow is not completed, defer uploads rather than accepting arbitrary files.

## 17.8 SSRF checks

SSRF is relevant if the backend fetches URLs supplied by users, imports remote resources, retrieves arbitrary external files, or follows user-controlled redirects.

If such features exist, validate schemes and destinations, block internal/private network targets, and prevent redirects from bypassing the restrictions. If no backend URL-fetching feature exists, document the SSRF check as not applicable and reassess if one is introduced.

## 17.9 API secrets and deployment security

- Keep database credentials, AI provider keys, session secrets, and signing keys in server-side environment variables or a secret manager.
- Never place privileged credentials in frontend environment variables or bundles.
- Keep real `.env` files out of Git.
- Rotate credentials if they are exposed.
- Restrict CORS to intended production frontend origins.
- Do not combine credentialed requests with unrestricted wildcard origins.
- Use HTTPS in production.
- Configure appropriate security headers, including CSP and HSTS where applicable.
- Return safe production errors without stack traces or internal configuration.
- Avoid logging passwords, tokens, reset links, or unnecessary academic information.
- Review source maps and dependency vulnerabilities before release.
- Use signed webhook verification only if inbound webhook functionality exists.

## 17.10 Multifactor authentication

MFA should be prioritized for administrator accounts because those accounts can manage users and access sensitive records.

If MFA cannot be fully implemented and tested in the available scope, document it as a limitation and future security requirement. Do not describe MFA as complete merely because the chosen authentication provider supports it in principle.

# 18. Full Post-Development Security Audit Checklist

This checklist is mandatory for the final verification process. Mark each item PASS, FAIL, or NOT APPLICABLE only after reviewing the implementation or running the relevant test.

A check should not be marked PASS just because code has been written for it.

## Interactive audit tracker

Use this to track the checklist during verification. These selections are a planning aid only; they do not inspect the code or save an audit report.

### A. Authentication and account security

- [ ]  Passwords are securely hashed if custom password storage is used; no plaintext passwords are stored.
- [ ]  Browser sessions or tokens use the selected secure authentication design.
- [ ]  Long-lived authentication credentials are not stored in localStorage or sessionStorage.
- [ ]  JWT signatures, expiry, claims, secrets, and revocation are validated if JWTs are used.
- [ ]  MFA is implemented for administrator accounts or documented as a limitation.
- [ ]  Default accounts, default passwords, and hardcoded production credentials are removed.
- [ ]  Password recovery uses secure, short-lived, single-use tokens if implemented.
- [ ]  Login, registration, recovery, and verification endpoints are rate-limited.

### B. Authorization and academic data protection

- [ ]  Every protected API operation enforces server-side authentication and permissions.
- [ ]  BOLA tests verify access to grades, submissions, courses, quizzes, and attendance.
- [ ]  Students can access only their own private academic records.
- [ ]  Teachers can manage only courses and records within their authorized scope.
- [ ]  Only authorized administrators can change roles and manage privileged accounts.
- [ ]  Supabase RLS is enabled and tested on exposed tables where applicable.
- [ ]  The Supabase service-role key is never exposed to frontend code.
- [ ]  API responses exclude passwords, secrets, private records, and unnecessary fields.

### C. Injection and browser security

- [ ]  Database operations use parameterized queries or safe ORM APIs
- [ ]  User content is rendered safely and permitted HTML is sanitized.
- [ ]  An appropriate Content Security Policy and security headers are configured.
- [ ]  CSRF protections are implemented where required by the cookie-authentication design.
- [ ]  Server-side validation covers request bodies, query parameters, route parameters, and unexpected fields.
- [ ]  Helmet or equivalent security-header configuration is reviewed.

### D. File uploads and SSRF

- [ ]  Uploads enforce extension, MIME, content-signature, and size restrictions as appropriate.
- [ ]  Storage names are controlled and path traversal is prevented.
- [ ]  Private files are protected by authorization or short-lived signed URLs.
- [ ]  Unsafe file content cannot execute as active website content.
- [ ]  SSRF controls are tested if the server fetches user-controlled URLs; otherwise the check is documented as not applicable.

### E. API, secrets, and network security

- [ ]  Sensitive endpoints have suitable rate limits, including AI and upload routes.
- [ ]  AI keys, database credentials, session secrets, and signing keys remain server-side.
- [ ]  Real .env files and credentials are excluded from Git; exposed credentials are rotated.
- [ ]  CORS allows only intended origins and is configured safely for credentials
- [ ]  Webhook signatures and replay protections are verified if webhooks exist; otherwise documented as not applicable.
- [ ]  Production uses HTTPS and appropriate secure cookie settings.
- [ ]  Error responses do not expose stack traces, database errors, or secrets.
- [ ]  Logs do not contain passwords, tokens, API keys, or unnecessary private student data.

### F. Build, dependencies, and deployment

- [ ]  Production source maps are reviewed and sensitive maps are not publicly exposed.
- [ ]  Dependency audits are reviewed and high-severity issues are addressed or documented.
- [ ]  Production configuration disables debugging and removes test-only routes.
- [ ]  Repository and frontend build are checked for accidentally exposed secrets.
- [ ]  Database constraints and transaction behavior protect record integrity.
- [ ]  Backup and recovery expectations are documented for the deployment.

## 18.1 Required security test scenarios

Use separate, controlled test accounts and non-production data.

1. A student attempts to view another student's grades by changing a resource ID.
2. A student attempts to create a course or access an admin API.
3. A teacher attempts to modify a course managed by another teacher.
4. A student tries to change their role through a profile or API request.
5. SQL injection test inputs are submitted to relevant search and form fields.
6. XSS test strings are entered into comments, lesson content, and announcements.
7. A state-changing request is tested without the CSRF protections required by the authentication design.
8. Repeated login and AI requests are used to verify rate limiting.
9. Invalid, oversized, and disallowed file uploads are rejected.
10. Invalid or expired authentication credentials are rejected.
11. A frontend build and repository scan checks for exposed API keys and privileged secrets.
12. RLS policies are tested using student, teacher, and administrator identities.
13. Production error responses are checked for stack traces and internal configuration.
14. Notification endpoints are tested to ensure users cannot read or modify other users' notifications.
15. Quiz answers and unreleased grades are checked for premature disclosure.

For each test, record the expected result, actual result, status, and evidence. Retest failed cases after fixing them.

## 18.2 Security audit report

Create `docs/security-audit.md` containing:

- Audit date and application version.
- Tested environment.
- Checklist status for each applicable item.
- Test evidence.
- Findings and severity.
- Remediation performed.
- Outstanding risks and limitations.
- Final deployment recommendation.

Use these severity categories:

- Critical: severe compromise, such as unauthenticated administrative access or exposure of privileged secrets.
- High: significant unauthorized access or disclosure of academic data.
- Medium: meaningful weakness with more limited impact or additional conditions.
- Low: minor weakness or defense-in-depth improvement.

Do not deploy with unresolved critical findings. High-severity findings should be resolved before production deployment wherever possible. A completed checklist is not proof that the application is free of vulnerabilities.

# 19. Testing and Quality Assurance

Testing must cover not only individual pages but the complete end-to-end workflows.

## 19.1 Authentication tests

- Valid credentials authenticate successfully.
- Invalid credentials are rejected.
- Inactive accounts cannot access protected functionality.
- Logout ends the relevant session or invalidates the credentials according to the design.
- Protected endpoints reject unauthenticated requests.
- Role changes cannot be performed by unauthorized users.
- Session or token expiry is handled correctly.

## 19.2 Course and enrolment tests

- Authorized teachers can create and update their courses.
- Unauthorized teachers cannot edit another teacher's course.
- Students cannot access private courses without the required enrolment.
- Duplicate enrolments are rejected or handled according to policy.
- Unpublished lessons are not exposed to students who should not see them.
- Course and lesson deletion or archiving does not silently corrupt related records.

## 19.3 Quiz tests

- The server calculates quiz scores correctly.
- Correct answers are not exposed prematurely.
- Invalid answers are rejected.
- Scores cannot exceed the maximum marks.
- Attempts follow the configured attempt policy.
- Students cannot read another student's private attempt records.
- Result visibility follows the release setting.

## 19.4 Assignment and grading tests

- A student can submit only to an eligible assignment.
- Submission ownership is checked.
- A teacher can grade only authorized submissions.
- Scores outside the permitted range are rejected.
- Students cannot change their own grades.
- Unreleased grades remain private.
- Feedback and publication status are saved consistently.

## 19.5 Attendance tests

- Only authorized teachers can record attendance.
- Students can read their own attendance.
- Students cannot edit their attendance records.
- Duplicate records for the same session and student are prevented.
- Attendance percentages follow the documented calculation.
- Invalid statuses are rejected.

## 19.6 AI tests

Test the AI integration with:

- A valid provider key.
- A missing or invalid key.
- An unavailable provider.
- An empty prompt.
- An excessively long prompt.
- A request from an unauthenticated user.
- A request for another student's private information.
- Repeated requests that exceed the configured rate limit.

The AI integration must fail gracefully without taking down the main LMS.

## 19.7 Frontend and usability tests

- Each role sees the correct navigation.
- Forms show validation errors.
- Buttons perform the action their labels promise.
- Empty states are meaningful.
- Loading indicators appear when appropriate.
- API failures produce understandable messages.
- Mobile navigation works.
- Keyboard focus is visible.
- Tables, charts, and dialogs fit their intended viewports.

## 19.8 Suggested testing tools

- Vitest: unit and component tests.
- React Testing Library: frontend behavior.
- Supertest: Express API tests.
- Browser-based manual testing: complete user workflows and responsive layouts.
- Package manager audit: dependency vulnerability checks.
- Code review and controlled security tests: authorization, secrets, and application behavior.

Automated tests are valuable, but they do not replace manual verification of permissions and the complete user experience.

# 20. Environment Configuration

Use environment variables for local development and production configuration. Commit an `.env.example` containing variable names and safe placeholders, never real secrets.

An illustrative backend `.env.example`:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

DATABASE_URL=
DIRECT_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=gemini
AI_API_KEY=
AI_MODEL=

SESSION_SECRET=
```

Only include variables that the chosen libraries and architecture actually require. For example, if Supabase Auth manages browser sessions, custom session variables may not be necessary. If Prisma is used, configure database URLs according to the selected Supabase connection method and Prisma version.

### Configuration rules

- `DATABASE_URL` must be a valid PostgreSQL connection string, not a MongoDB URI.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed to the browser.
- Only intentionally public Supabase configuration should be included in the frontend build.
- AI keys and session/signing secrets must remain server-side.
- `.env.example` must not contain real credentials.
- Production secrets must be configured in the deployment provider's environment settings.
- If a credential is committed accidentally, rotate it; deleting the visible line alone may not remove it from Git history.

# 21. Deployment Architecture

Recommended deployment arrangement:

Frontend hosting

Vercel or Netlify for the React/Vite build, with the production API URL configured appropriately.

Backend hosting

Render or an equivalent Node.js hosting service for Express, with server-side environment variables, logs, and health checks.

Database

Supabase PostgreSQL with migrations, access policies, backups appropriate to the plan, and tested connection configuration.

File storage, if enabled

Supabase Storage or another managed storage service, with upload validation and access controls.

## 21.1 Production configuration

Before deployment:

- Set the production frontend origin in the backend's CORS configuration.
- Configure HTTPS and secure cookies where applicable.
- Confirm the API can connect to PostgreSQL.
- Apply the intended database migrations.
- Verify RLS policies and server-side permissions.
- Create controlled demonstration accounts.
- Remove development-only routes and credentials.
- Disable detailed production error output.
- Review dependency audit results.
- Check the frontend bundle for unintended secrets.
- Verify that the AI integration works or displays a clear unavailable state.
- Test the deployed application, not just the local version.

Hosting plans, connection limits, storage allowances, and AI API usage limits can change. Check the current provider terms and configuration before deployment.

## 21.2 Database migration and seed data

Use version-controlled migrations to create and update the database schema. Avoid relying only on manual changes in a dashboard because the schema must be reproducible.

Seed data should include a small, realistic demonstration environment:

- One administrator.
- Two teachers.
- Several students.
- Multiple subjects and courses.
- Published lessons.
- A quiz with several questions.
- An assignment and sample submissions.
- Attendance sessions and records.
- Example announcements and notifications.

Use synthetic demonstration data, not real students' private records.

If demonstration accounts have passwords, create them securely through the chosen authentication system. Remove or disable public demo credentials before any real production deployment.

# 22. Documentation Deliverables

The repository should contain the following documentation.

| File | Contents |
| --- | --- |
| `README.md` | Project introduction, features, prerequisites, setup, scripts, configuration, and deployment |
| `docs/project-overview.md` | Problem statement, objectives, scope, users, and limitations |
| `docs/requirements.md` | Functional and non-functional requirements |
| `docs/architecture.md` | Architecture, component responsibilities, and request flows |
| `docs/database-design.md` | Tables, relationships, constraints, and RLS strategy |
| `docs/api-documentation.md` | Endpoints, request/response examples, permissions, and error codes |
| `docs/testing-report.md` | Test cases, results, defects, and evidence |
| `docs/security-audit.md` | Security checklist, findings, remediation, and residual risks |
| `.env.example` | Safe environment variable template |

The report must distinguish between planned features, implemented features, and tested features. Do not claim a feature passed testing simply because it is described in the documentation.

# 23. Academic Demonstration Plan

The demonstration should prove that EduSathi is an integrated application rather than a collection of disconnected pages.

1. Administrator workflow
    
    Log in as an administrator, create or review accounts, manage subjects, assign a teacher, and prepare a course for the demonstration.
    
2. Teacher workflow
    
    Log in as the assigned teacher, create a lesson, publish it, and create a multiple-choice quiz and assignment.
    
3. Student workflow
    
    Log in as an enrolled student, open the course, view its learning material, take the quiz, and submit the assignment.
    
4. Grading workflow
    
    Return to the teacher account, review the student's submission, assign a score, provide feedback, and release the result.
    
5. Analytics workflow
    
    Show that the student's results and progress have changed based on the actual quiz and grading records. Show the teacher's course analytics and attendance summary.
    
6. AI workflow
    
    Ask the AI assistant to explain a topic or propose a revision plan using available authorized context. If the provider is unavailable, demonstrate the clearly labelled fallback instead of pretending a live AI response occurred.
    
7. Security workflow
    
    Demonstrate that a student cannot access another student's private result or invoke an administrator-only operation.
    
8. Responsive workflow
    
    Show the same core application at desktop and mobile viewport sizes.
    

For an academic presentation, prepare the problem statement, requirements analysis, use-case diagram, architecture diagram, database ER diagram, screenshots, API documentation, testing results, security findings, limitations, and future scope.

The person defending the project should understand the implementation decisions, database relationships, permission checks, and limitations. A smaller system that can be explained and demonstrated reliably is stronger than an oversized system with uncertain behavior.

# 24. Future Expansion and Business Potential

EduSathi can later evolve from a university-oriented learning platform into a product for multiple educational organizations.

## 24.1 Potential business models

| Model | Description | Future requirement |
| --- | --- | --- |
| Institution subscription | Schools, colleges, or coaching centres pay for platform access | Organization management, subscription administration, and tenant isolation |
| Teacher subscription | Teachers pay for advanced teaching and analytics tools | Subscription management and feature entitlements |
| Student premium plan | Students pay for additional AI assistance or study-planning features | Usage quotas, billing, and premium access control |
| Paid courses | Learners purchase selected courses | Payment integration, purchase records, refunds, and course access rules |
| AI usage plans | Different plans have different AI usage limits | Usage metering, cost controls, and quotas |

These are future business opportunities, not features of the initial release.

## 24.2 Multi-institution support

If EduSathi is expanded to multiple institutions, introduce an `organizations` table and appropriate relationships between organizations, users, courses, and memberships.

The system must prevent one organization from accessing another organization's private records. This needs to be designed and tested across the database, backend, storage, and administrative interface.

Simply adding an organization name to a user profile is not sufficient to create a secure multi-tenant system.

## 24.3 Advanced AI

Possible later improvements include:

- Retrieval-augmented generation (RAG) over approved course materials.
- Document ingestion and semantic search.
- More sophisticated study-plan generation.
- Teacher-assisted quiz generation.
- Learning-resource recommendations.
- AI usage limits and cost analytics.
- Feedback mechanisms for incorrect AI responses.

These additions should be introduced after the core learning and assessment workflows are reliable.

## 24.4 Other future features

- Real-time chat using Socket.IO.
- Email notifications.
- Certificates.
- Video classes.
- Payment processing.
- Advanced reports and exports.
- Institution branding.
- Native mobile applications.
- More comprehensive audit logging.

# 25. Final Feature Priorities

This is the final priority classification. It is a scope guide, not a day-by-day schedule.

| Priority | Features |
| --- | --- |
| P0 — Must work | Authentication, role permissions, user management, courses, lessons, enrolments, quizzes, quiz scoring, assignments, submissions, grading, responsive layout |
| P1 — Core project value | Attendance, academic analytics, AI study assistant, announcements, in-app notifications, security audit, testing, documentation |
| P2 — Add after core stability | Secure file uploads, course comments, advanced search, downloadable reports, enhanced analytics |
| P3 — Future release | Real-time private messaging, subscriptions, payments, video classes, certificates, advanced RAG, multi-institution SaaS |

Important: The security work is not a low-priority optional feature. The P0/P1 labels above describe product functionality, but authorization, secret protection, safe database access, and testing must be built into the relevant features from the beginning.

# 26. Final Acceptance Criteria

EduSathi should be considered ready for its final demonstration only when the following criteria are satisfied.

## Project completion checklist

0/20

- [ ]  All three roles can authenticate and reach the appropriate dashboards.
- [ ]  Protected APIs enforce authentication, role permissions, and resource ownership on the server.
- [ ]  Administrators can manage users, subjects, and courses.
- [ ]  Teachers can create courses and lessons and publish assessments.
- [ ]  Students can access authorized course content.
- [ ]  Students can submit quizzes and receive scores calculated by the backend.
- [ ]  Students can submit assignments, and authorized teachers can grade them and release feedback.
- [ ]  Attendance records can be created, retrieved, and summarized correctly.
- [ ]  Dashboard values and analytics use actual database records rather than hard-coded numbers.
- [ ]  The AI assistant works with a configured provider or displays an honest, clearly labelled fallback.
- [ ]  Announcements and in-app notifications work for the intended recipients.
- [ ]  Essential pages are usable at desktop, tablet, and mobile widths.
- [ ]  Input validation, error handling, and loading/empty states are implemented.
- [ ]  Secrets are not exposed in the frontend or repository.
- [ ]  Security tests cover BOLA, role escalation, injection, CSRF where applicable, rate limits, and RLS where applicable.
- [ ]  Dependency findings and source-map exposure have been reviewed.
- [ ]  Database schema, environment configuration, and seed data can be reproduced from documentation.
- [ ]  Core automated tests pass, and complete user workflows have been manually verified.
- [ ]  The security audit records PASS, FAIL, or NOT APPLICABLE honestly, with evidence and limitations.
- [ ]  The README explains setup, configuration, test execution, and deployment.

# 27. Final Project Summary

EduSathi will be a full-stack, AI-powered learning management system built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, and Supabase PostgreSQL.

Its central value is the integration of learning content, assessment, grading, attendance, academic progress, communication, and AI-assisted study guidance in a single platform.

The three dashboards have distinct responsibilities:

- Students learn, submit work, view results, and receive study assistance.
- Teachers manage courses, assessments, grading, attendance, and performance analysis.
- Administrators manage users, roles, courses, subjects, and platform-wide reports.

The technical design will use a relational database, modular REST APIs, server-side authorization, secure authentication, input validation, and appropriate RLS policies. The AI integration will operate through the backend, use only permitted context, and fail gracefully when the external provider is unavailable.

The first release will prioritize complete end-to-end workflows rather than trying to implement every possible LMS feature. File uploads and comments can be added when the core functionality is stable. Real-time chat, payments, video classes, advanced AI retrieval, and full multi-institution support will remain future extensions.

The final deliverables will include the working application, database schema and migrations, environment template, seed data, API documentation, testing report, security audit, and setup/deployment instructions.