import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  loginSchema,
  registerSchema,
  createCourseSchema,
  createQuizSchema,
  submitQuizAttemptSchema,
  createAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
  createAttendanceSessionSchema,
  createAnnouncementSchema,
  createCommentSchema,
  aiAssistantPromptSchema,
} from '../validators/schemas';

import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as subjectController from '../controllers/subjectController';
import * as courseController from '../controllers/courseController';
import * as quizController from '../controllers/quizController';
import * as assignmentController from '../controllers/assignmentController';
import * as attendanceController from '../controllers/attendanceController';
import * as analyticsController from '../controllers/analyticsController';
import * as announcementController from '../controllers/announcementController';
import * as commentController from '../controllers/commentController';
import * as notificationController from '../controllers/notificationController';
import * as aiController from '../controllers/aiController';
import * as financeController from '../controllers/financeController';

const router = Router();

// --- 1. Authentication & Profile ---
router.post('/auth/login', validateBody(loginSchema), authController.login);
router.post('/auth/register', validateBody(registerSchema), authController.register);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.getMe);
router.patch('/me/profile', authenticate, authController.updateProfile);

// --- 2. Admin User Management ---
router.get('/users', authenticate, requireRole(['admin']), userController.listUsers);
router.post('/users', authenticate, requireRole(['admin']), userController.createUser);
router.patch('/users/:id', authenticate, requireRole(['admin']), userController.updateUser);

// --- 3. Subjects ---
router.get('/subjects', authenticate, subjectController.listSubjects);
router.post('/subjects', authenticate, requireRole(['admin']), subjectController.createSubject);

// --- 4. Courses & Modules & Lessons ---
router.get('/courses', authenticate, courseController.listCourses);
router.post('/courses', authenticate, requireRole(['teacher', 'admin']), validateBody(createCourseSchema), courseController.createCourse);
router.get('/courses/:courseId', authenticate, courseController.getCourse);
router.patch('/courses/:courseId', authenticate, requireRole(['teacher', 'admin']), courseController.updateCourse);
router.delete('/courses/:courseId', authenticate, requireRole(['teacher', 'admin']), courseController.deleteCourse);
router.post('/courses/:courseId/enroll', authenticate, courseController.enrollCourse);
router.post('/courses/:courseId/enrollments', authenticate, courseController.enrollCourse);
router.get('/courses/:courseId/teachers', authenticate, courseController.getCourseTeachers);
router.post('/courses/:courseId/teachers', authenticate, requireRole(['teacher', 'admin']), courseController.assignCourseTeacher);
router.delete('/courses/:courseId/teachers/:teacherId', authenticate, requireRole(['teacher', 'admin']), courseController.removeCourseTeacher);
router.get('/courses/:courseId/students', authenticate, requireRole(['teacher', 'admin']), courseController.getCourseStudents);
router.get('/courses/:courseId/students-performance', authenticate, requireRole(['teacher', 'admin']), courseController.getCourseStudentsPerformance);
router.delete('/courses/:courseId/students/:studentId', authenticate, requireRole(['teacher', 'admin']), courseController.unenrollCourseStudent);
router.get('/courses/:courseId/roadmap', authenticate, courseController.getCourseRoadmap);
router.put('/courses/:courseId/roadmap', authenticate, requireRole(['teacher', 'admin']), courseController.saveCourseRoadmap);
router.get('/me/courses', authenticate, courseController.getMyCourses);

router.post('/courses/:courseId/modules', authenticate, requireRole(['teacher', 'admin']), courseController.addModule);
router.post('/modules/:moduleId/lessons', authenticate, requireRole(['teacher', 'admin']), courseController.addLesson);
router.post('/lessons/:lessonId/progress', authenticate, requireRole(['student']), courseController.markLessonProgress);

// --- 5. Quizzes & Assessments ---
router.post('/courses/:courseId/quizzes', authenticate, requireRole(['teacher', 'admin']), validateBody(createQuizSchema), quizController.createQuiz);
router.get('/courses/:courseId/quizzes', authenticate, quizController.listCourseQuizzes);
router.get('/teacher/quizzes', authenticate, requireRole(['teacher', 'admin']), quizController.listTeacherQuizzes);
router.get('/quizzes/:quizId', authenticate, quizController.getQuiz);
router.post('/quizzes/:quizId/attempts', authenticate, requireRole(['student']), validateBody(submitQuizAttemptSchema), quizController.submitQuizAttempt);
router.get('/quizzes/:quizId/attempts', authenticate, requireRole(['teacher', 'admin']), quizController.getQuizAttempts);
router.get('/me/quiz-results', authenticate, requireRole(['student']), quizController.getStudentQuizResults);

// --- 6. Assignments & Grading ---
router.post('/courses/:courseId/assignments', authenticate, requireRole(['teacher', 'admin']), validateBody(createAssignmentSchema), assignmentController.createAssignment);
router.get('/courses/:courseId/assignments', authenticate, assignmentController.listAssignments);
router.get('/teacher/assignments', authenticate, requireRole(['teacher', 'admin']), assignmentController.listTeacherAssignments);
router.get('/assignments/:assignmentId', authenticate, assignmentController.getAssignment);
router.post('/assignments/:assignmentId/submissions', authenticate, requireRole(['student']), validateBody(submitAssignmentSchema), assignmentController.submitAssignment);
router.get('/assignments/:assignmentId/submissions', authenticate, requireRole(['teacher', 'admin']), assignmentController.listSubmissions);
router.patch('/submissions/:submissionId/grade', authenticate, requireRole(['teacher', 'admin']), validateBody(gradeSubmissionSchema), assignmentController.gradeSubmission);
router.get('/me/grades', authenticate, requireRole(['student']), assignmentController.getStudentGrades);
router.get('/teacher/gradebook', authenticate, requireRole(['teacher', 'admin']), assignmentController.getGradebook);

// --- 7. Attendance Management ---
router.post('/courses/:courseId/attendance-sessions', authenticate, requireRole(['teacher', 'admin']), validateBody(createAttendanceSessionSchema), attendanceController.createAttendanceSession);
router.get('/courses/:courseId/attendance', authenticate, requireRole(['teacher', 'admin']), attendanceController.getCourseAttendance);
router.patch('/attendance-sessions/:sessionId', authenticate, requireRole(['teacher', 'admin']), attendanceController.updateAttendanceSession);
router.post('/attendance/check-in', authenticate, requireRole(['student']), attendanceController.studentCheckIn);
router.get('/me/active-attendance-sessions', authenticate, requireRole(['student']), attendanceController.getMyActiveAttendanceSessions);
router.get('/me/attendance', authenticate, requireRole(['student']), attendanceController.getMyAttendance);

// --- 8. Academic Analytics ---
router.get('/analytics/student', authenticate, requireRole(['student']), analyticsController.getStudentAnalytics);
router.get('/analytics/teacher', authenticate, requireRole(['teacher', 'admin']), analyticsController.getTeacherAnalytics);
router.get('/analytics/teacher/course/:courseId', authenticate, requireRole(['teacher', 'admin']), analyticsController.getTeacherCourseAnalytics);
router.get('/analytics/admin', authenticate, requireRole(['admin']), analyticsController.getAdminAnalytics);

// --- 9. Announcements & Discussions ---
router.get('/courses/:courseId/announcements', authenticate, announcementController.listAnnouncements);
router.post('/courses/:courseId/announcements', authenticate, requireRole(['teacher', 'admin']), validateBody(createAnnouncementSchema), announcementController.createAnnouncement);
router.get('/comments', authenticate, commentController.listComments);
router.post('/comments', authenticate, validateBody(createCommentSchema), commentController.createComment);

// --- 10. Notifications ---
router.get('/notifications', authenticate, notificationController.listNotifications);
router.patch('/notifications/:notificationId/read', authenticate, notificationController.markNotificationAsRead);
router.post('/notifications/read-all', authenticate, notificationController.markAllNotificationsAsRead);

// --- 11. AI Study Assistant ---
router.post('/ai/study-assistant', authenticate, validateBody(aiAssistantPromptSchema), aiController.askStudyAssistant);

// --- 12. Finance & Salaries & Payments ---
router.get('/finance/salaries', authenticate, requireRole(['admin']), financeController.listTeacherSalaries);
router.get('/finance/salaries/summary', authenticate, requireRole(['admin']), financeController.getTeacherSalariesSummary);
router.post('/finance/salaries', authenticate, requireRole(['admin']), financeController.recordTeacherSalary);
router.get('/finance/teachers/:teacherId/compensation', authenticate, requireRole(['admin']), financeController.getTeacherFinanceDetails);

router.get('/finance/student-payments', authenticate, requireRole(['admin']), financeController.listStudentPayments);
router.get('/finance/student-payments/summary', authenticate, requireRole(['admin']), financeController.getStudentPaymentsSummary);
router.post('/finance/student-payments', authenticate, requireRole(['admin']), financeController.recordStudentPayment);
router.patch('/finance/student-payments/:paymentId/pay', authenticate, requireRole(['admin']), financeController.settleStudentPayment);
router.get('/finance/students/:studentId/ledger', authenticate, requireRole(['admin']), financeController.getStudentFinanceDetails);

router.get('/me/payments', authenticate, requireRole(['student']), financeController.getMyStudentPayments);
router.get('/me/salaries', authenticate, requireRole(['teacher']), financeController.getMyTeacherSalaries);

export default router;
