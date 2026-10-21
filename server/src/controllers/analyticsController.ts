import { Response } from 'express';
import { query, getOne } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function getStudentAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  // Enrolled courses count
  const enrolledCount = await getOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM enrollments WHERE student_id = ? AND status = 'active'`,
    [studentId]
  );

  // Lesson progress
  const totalLessons = await getOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN enrollments e ON m.course_id = e.course_id
    WHERE e.student_id = ? AND e.status = 'active'
  `, [studentId]);

  const completedLessons = await getOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM lesson_progress WHERE student_id = ?',
    [studentId]
  );

  const lessonTotal = totalLessons?.count || 0;
  const lessonCompleted = completedLessons?.count || 0;
  const courseCompletionPct = lessonTotal > 0 ? Math.round((lessonCompleted / lessonTotal) * 100) : 0;

  // Quiz performance
  const quizScores = await query<{ score: number; max_score: number; quiz_title: string; submitted_at: string }>(`
    SELECT qa.score, qa.max_score, q.title as quiz_title, qa.submitted_at
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_id = ?
    ORDER BY qa.submitted_at ASC
  `, [studentId]);

  let avgQuizPct = 0;
  if (quizScores.length > 0) {
    const sumPct = quizScores.reduce((acc, q) => acc + (q.max_score > 0 ? (q.score / q.max_score) * 100 : 0), 0);
    avgQuizPct = Math.round(sumPct / quizScores.length);
  }

  // Assignment performance
  const assignmentGrades = await query<{ score: number; max_score: number; assignment_title: string; released_at: string }>(`
    SELECT g.score, a.max_score, a.title as assignment_title, g.released_at
    FROM grades g
    JOIN submissions s ON g.submission_id = s.id
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.student_id = ?
    ORDER BY g.released_at ASC
  `, [studentId]);

  let avgAssignmentPct = 0;
  if (assignmentGrades.length > 0) {
    const sumPct = assignmentGrades.reduce((acc, a) => acc + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0);
    avgAssignmentPct = Math.round(sumPct / assignmentGrades.length);
  }

  // Attendance
  const attStats = await getOne<{ total: number; present: number; late: number }>(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
           SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
    FROM attendance_records
    WHERE student_id = ?
  `, [studentId]);

  const attTotal = attStats?.total || 0;
  const attPresent = attStats?.present || 0;
  const attLate = attStats?.late || 0;
  const attendancePct = attTotal > 0 ? Math.round(((attPresent + attLate) / attTotal) * 100) : 100;

  // Upcoming deadlines
  const upcomingAssignments = await query<any>(`
    SELECT a.id, a.title, a.due_at, c.title as course_title, 'assignment' as type
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = ? AND a.due_at >= CURRENT_TIMESTAMP
    ORDER BY a.due_at ASC
    LIMIT 5
  `, [studentId]);

  res.json({
    success: true,
    data: {
      enrolled_courses: enrolledCount?.count || 0,
      course_completion_pct: courseCompletionPct,
      completed_lessons: lessonCompleted,
      total_lessons: lessonTotal,
      average_quiz_score: avgQuizPct,
      average_assignment_score: avgAssignmentPct,
      overall_attendance_pct: attendancePct,
      quiz_history: quizScores.map(q => ({
        name: q.quiz_title.length > 15 ? q.quiz_title.slice(0, 15) + '...' : q.quiz_title,
        score: q.max_score > 0 ? Math.round((q.score / q.max_score) * 100) : 0,
        date: q.submitted_at,
      })),
      assignment_history: assignmentGrades.map(a => ({
        name: a.assignment_title.length > 15 ? a.assignment_title.slice(0, 15) + '...' : a.assignment_title,
        score: a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0,
        date: a.released_at,
      })),
      upcoming_deadlines: upcomingAssignments,
    },
  });
}

export async function getTeacherAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const teacherId = req.user!.id;

  // Total courses
  const courses = await query<any>(`
    SELECT c.id, c.title,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count
    FROM courses c
    JOIN course_teachers ct ON c.id = ct.course_id
    WHERE ct.teacher_id = ?
  `, [teacherId]);

  const totalStudents = courses.reduce((acc, c) => acc + (c.student_count || 0), 0);

  // Pending submissions to grade
  const pendingGrading = await getOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN course_teachers ct ON a.course_id = ct.course_id
    WHERE ct.teacher_id = ? AND s.status = 'submitted'
  `, [teacherId]);

  // Flagged students: students with quiz scores < 60% or unsubmitted assignments past due
  const lowScorers = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.student_id, c.title as course_title,
           qa.score, qa.max_score, 'Low Quiz Score (< 60%)' as reason
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    JOIN course_teachers ct ON c.id = ct.course_id
    JOIN profiles p ON qa.student_id = p.id
    WHERE ct.teacher_id = ? AND qa.max_score > 0 AND (qa.score / qa.max_score) < 0.6
    LIMIT 5
  `, [teacherId]);

  res.json({
    success: true,
    data: {
      total_courses: courses.length,
      total_students: totalStudents,
      pending_grading_count: pendingGrading?.count || 0,
      courses,
      flagged_students: lowScorers,
    },
  });
}

export async function getAdminAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const usersByRole = await query<{ role: string; count: number }>(`
    SELECT role, COUNT(*) as count FROM profiles GROUP BY role
  `);

  const coursesByStatus = await query<{ status: string; count: number }>(`
    SELECT status, COUNT(*) as count FROM courses GROUP BY status
  `);

  const totalEnrollments = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM enrollments');
  const totalSubmissions = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM submissions');
  const totalQuizzes = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM quizzes');
  const totalAttendance = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM attendance_records');

  res.json({
    success: true,
    data: {
      users_by_role: usersByRole,
      courses_by_status: coursesByStatus,
      total_enrollments: totalEnrollments?.count || 0,
      total_submissions: totalSubmissions?.count || 0,
      total_quizzes: totalQuizzes?.count || 0,
      total_attendance_records: totalAttendance?.count || 0,
    },
  });
}
