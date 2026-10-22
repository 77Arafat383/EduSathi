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

  // 1. Department Distribution
  const departments = await query<{ department: string; count: number }>(`
    SELECT COALESCE(department, 'General Studies') as department, COUNT(*) as count
    FROM profiles
    WHERE role = 'student'
    GROUP BY department
    ORDER BY count DESC
  `);

  // 2. Comprehensive Course Performance & Syllabus Audit
  const coursePerformance = await query<any>(`
    SELECT c.id, c.title, s.name as subject_name, c.status,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as enrolled_students,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as total_lessons,
           (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as completed_lessons,
           (SELECT p.full_name FROM profiles p JOIN course_teachers ct ON p.id = ct.teacher_id WHERE ct.course_id = c.id LIMIT 1) as lead_instructor
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    ORDER BY c.created_at DESC
  `);

  // 3. Attendance Analytics
  const attStats = await getOne<any>(`
    SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
    FROM attendance_records
  `);

  const totalAtt = Number(attStats?.total_records || 0);
  const presentAtt = Number(attStats?.present_count || 0);
  const lateAtt = Number(attStats?.late_count || 0);
  const absentAtt = Number(attStats?.absent_count || 0);
  const overallAttendancePct = totalAtt > 0 ? Math.round(((presentAtt + lateAtt) / totalAtt) * 100) : 95;

  // 4. Assessment Performance
  const assessments = await getOne<any>(`
    SELECT 
      (SELECT COUNT(*) FROM submissions) as submissions_count,
      (SELECT COUNT(*) FROM grades) as graded_count,
      (SELECT AVG(score) FROM grades) as avg_grade,
      (SELECT COUNT(*) FROM quiz_attempts) as quiz_attempts_count,
      (SELECT AVG(score) FROM quiz_attempts) as avg_quiz_score
  `);

  // 5. Student Cohort Retention & Due Audit
  const studentCohort = await query<any>(`
    SELECT p.id, p.full_name, p.student_id, p.email, p.department, p.status,
           (SELECT COUNT(*) FROM enrollments WHERE student_id = p.id AND status = 'active') as enrolled_courses,
           (SELECT COALESCE(SUM(due_amount), 0) FROM student_payments WHERE student_id = p.id) as total_due,
           (SELECT COALESCE(SUM(paid_amount), 0) FROM student_payments WHERE student_id = p.id) as total_paid,
           (SELECT AVG(CASE WHEN status = 'present' THEN 100.0 WHEN status = 'late' THEN 50.0 ELSE 0.0 END) FROM attendance_records WHERE student_id = p.id) as attendance_pct
    FROM profiles p
    WHERE p.role = 'student'
    ORDER BY total_due DESC, p.created_at DESC
  `);

  // 6. Faculty Workload & Compensation Audit
  const facultyWorkload = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.department, p.status,
           (SELECT COUNT(*) FROM course_teachers WHERE teacher_id = p.id) as assigned_courses_count,
           (SELECT COUNT(e.id) FROM course_teachers ct JOIN enrollments e ON ct.course_id = e.course_id WHERE ct.teacher_id = p.id AND e.status = 'active') as active_students_taught,
           (SELECT COALESCE(SUM(amount), 0) FROM teacher_salaries WHERE teacher_id = p.id AND status = 'paid') as total_salary_paid,
           (SELECT pay_period FROM teacher_salaries WHERE teacher_id = p.id ORDER BY payment_date DESC LIMIT 1) as last_pay_period
    FROM profiles p
    WHERE p.role = 'teacher'
    ORDER BY total_salary_paid DESC
  `);

  // 7. Fiscal Governance Summary
  const finance = await getOne<any>(`
    SELECT 
      (SELECT COALESCE(SUM(total_amount), 0) FROM student_payments) as total_invoiced,
      (SELECT COALESCE(SUM(paid_amount), 0) FROM student_payments) as total_collected,
      (SELECT COALESCE(SUM(due_amount), 0) FROM student_payments) as total_outstanding_due,
      (SELECT COALESCE(SUM(amount), 0) FROM teacher_salaries WHERE status = 'paid') as total_salary_disbursed
  `);

  res.json({
    success: true,
    data: {
      users_by_role: usersByRole,
      courses_by_status: coursesByStatus,
      total_enrollments: totalEnrollments?.count || 0,
      total_submissions: totalSubmissions?.count || 0,
      total_quizzes: totalQuizzes?.count || 0,
      total_attendance_records: totalAttendance?.count || 0,
      departments,
      course_performance: coursePerformance,
      attendance_metrics: {
        total_sessions_logged: totalAtt,
        present_count: presentAtt,
        late_count: lateAtt,
        absent_count: absentAtt,
        overall_attendance_pct: overallAttendancePct,
      },
      assessment_metrics: {
        submissions_count: Number(assessments?.submissions_count || 0),
        graded_count: Number(assessments?.graded_count || 0),
        avg_grade: assessments?.avg_grade ? Math.round(Number(assessments.avg_grade) * 10) / 10 : 0,
        quiz_attempts_count: Number(assessments?.quiz_attempts_count || 0),
        avg_quiz_score: assessments?.avg_quiz_score ? Math.round(Number(assessments.avg_quiz_score) * 10) / 10 : 0,
      },
      student_cohort: studentCohort,
      faculty_workload: facultyWorkload,
      fiscal_summary: {
        total_invoiced: Number(finance?.total_invoiced || 0),
        total_collected: Number(finance?.total_collected || 0),
        total_outstanding_due: Number(finance?.total_outstanding_due || 0),
        total_salary_disbursed: Number(finance?.total_salary_disbursed || 0),
      },
    },
  });
}
