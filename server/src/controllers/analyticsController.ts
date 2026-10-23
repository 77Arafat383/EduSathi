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

export async function computeCourseAnalytics(courseId: string) {
  // Course details & subject
  const course = await getOne<any>(`
    SELECT c.id, c.title, c.description, c.created_at, c.status,
           s.name as subject_name, s.code as subject_code
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    WHERE c.id = ?
  `, [courseId]);

  if (!course) return null;

  // Enrolled students
  const enrolledStudents = await query<any>(`
    SELECT p.id, p.full_name, p.student_id as student_code, p.email, p.avatar_url, p.department
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    WHERE e.course_id = ? AND e.status = 'active'
    ORDER BY p.student_id ASC, p.full_name ASC
  `, [courseId]);

  const studentCount = enrolledStudents.length;

  // 1. Syllabus & Modules Breakdown
  const modules = await query<any>(`
    SELECT id, title, position
    FROM modules
    WHERE course_id = ?
    ORDER BY position ASC
  `, [courseId]);

  const lessons = await query<any>(`
    SELECT l.id, l.module_id, l.title, l.position, l.published_at,
           CAST((SELECT COUNT(*) FROM lesson_progress lp WHERE lp.lesson_id = l.id) AS INTEGER) as completed_count
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ?
    ORDER BY m.position ASC, l.position ASC
  `, [courseId]);

  let totalCompletionsAcrossLessons = 0;
  const enrichedModules = modules.map(m => {
    const modLessons = lessons.filter(l => l.module_id === m.id);
    const modCompletions = modLessons.reduce((acc, l) => acc + (Number(l.completed_count) || 0), 0);
    totalCompletionsAcrossLessons += modCompletions;

    const totalPotential = modLessons.length * (studentCount || 1);
    const completionPct = totalPotential > 0 ? Math.min(100, Math.round((modCompletions / totalPotential) * 100)) : 0;

    let modStatus: 'completed' | 'in_progress' | 'scheduled' = 'scheduled';
    if (completionPct >= 80) modStatus = 'completed';
    else if (completionPct > 0) modStatus = 'in_progress';

    return {
      id: m.id,
      title: m.title,
      position: m.position,
      lesson_count: modLessons.length,
      completion_rate: completionPct,
      status: modStatus,
      lessons: modLessons.map(l => {
        const compCount = Number(l.completed_count) || 0;
        const compPct = studentCount > 0 ? Math.min(100, Math.round((compCount / studentCount) * 100)) : 0;
        return {
          id: l.id,
          title: l.title,
          position: l.position,
          published_at: l.published_at,
          completed_count: compCount,
          completion_percentage: compPct,
        };
      }),
    };
  });

  const totalPossibleCompletions = lessons.length * (studentCount || 1);
  const syllabusCoverageRate = totalPossibleCompletions > 0
    ? Math.min(100, Math.round((totalCompletionsAcrossLessons / totalPossibleCompletions) * 100))
    : 0;

  // 2. Target Schedule & Course Pacing
  const sessions = await query<any>(`
    SELECT s.id, s.session_date, s.title, s.status, s.created_at,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'present') AS INTEGER) as present_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'late') AS INTEGER) as late_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'absent') AS INTEGER) as absent_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) AS INTEGER) as total_marked
    FROM attendance_sessions s
    WHERE s.course_id = ?
    ORDER BY s.session_date DESC, s.created_at DESC
  `, [courseId]);

  const targetWeeks = 14;
  const targetSessionsTotal = 28; // 2 sessions/week for standard semester
  // Estimate current academic week: baseline 8th week for rich analytics demo
  const currentWeek = 8;
  const expectedSessionsToDate = Math.min(targetSessionsTotal, currentWeek * 2);
  const conductedSessions = sessions.length;
  const pacingVariance = conductedSessions - expectedSessionsToDate;

  let pacingStatus: 'Ahead of Schedule' | 'On Schedule' | 'Behind Schedule' = 'On Schedule';
  if (pacingVariance >= 2) pacingStatus = 'Ahead of Schedule';
  else if (pacingVariance < -1) pacingStatus = 'Behind Schedule';

  // Quizzes & Assignments for Milestones
  const quizzes = await query<any>(`
    SELECT q.id, q.title, q.max_score, q.due_at, q.status, q.created_at,
           CAST(COUNT(qa.id) AS INTEGER) as attempts_count,
           AVG(qa.score) as avg_score,
           MAX(qa.score) as max_score_achieved,
           MIN(qa.score) as min_score_achieved
    FROM quizzes q
    LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
    WHERE q.course_id = ?
    GROUP BY q.id, q.title, q.max_score, q.due_at, q.status, q.created_at
    ORDER BY q.due_at ASC, q.created_at ASC
  `, [courseId]);

  const assignments = await query<any>(`
    SELECT a.id, a.title, a.max_score, a.due_at, a.status, a.created_at,
           CAST(COUNT(s.id) AS INTEGER) as submission_count,
           CAST(COUNT(g.id) AS INTEGER) as graded_count,
           AVG(g.score) as avg_score,
           MAX(g.score) as max_score_achieved,
           MIN(g.score) as min_score_achieved
    FROM assignments a
    LEFT JOIN submissions s ON a.id = s.assignment_id
    LEFT JOIN grades g ON s.id = g.submission_id
    WHERE a.course_id = ?
    GROUP BY a.id, a.title, a.max_score, a.due_at, a.status, a.created_at
    ORDER BY a.due_at ASC, a.created_at ASC
  `, [courseId]);

  // Build Chronological Milestone Timeline
  const milestones: any[] = [];
  quizzes.forEach(q => {
    milestones.push({
      id: q.id,
      title: q.title,
      type: 'quiz',
      due_at: q.due_at,
      status: q.status === 'published' ? 'active' : q.status === 'closed' ? 'completed' : 'upcoming',
      target_metric: `${q.attempts_count} of ${studentCount} submitted`,
      completion_pct: studentCount > 0 ? Math.round((Number(q.attempts_count) / studentCount) * 100) : 0,
      avg_score: q.avg_score ? Math.round(Number(q.avg_score)) : null,
      max_score: q.max_score,
    });
  });

  assignments.forEach(a => {
    milestones.push({
      id: a.id,
      title: a.title,
      type: 'assignment',
      due_at: a.due_at,
      status: a.status === 'published' ? 'active' : a.status === 'closed' ? 'completed' : 'upcoming',
      target_metric: `${a.submission_count} submitted (${a.graded_count} graded)`,
      completion_pct: studentCount > 0 ? Math.round((Number(a.submission_count) / studentCount) * 100) : 0,
      avg_score: a.avg_score ? Math.round(Number(a.avg_score)) : null,
      max_score: a.max_score,
    });
  });

  milestones.sort((a, b) => {
    const da = a.due_at ? new Date(a.due_at).getTime() : 0;
    const db = b.due_at ? new Date(b.due_at).getTime() : 0;
    return da - db;
  });

  // 3. Overall Result & Performance Analysis
  // Student-by-student scores
  const allAttempts = await query<any>(`
    SELECT qa.student_id, qa.score, qa.max_score, q.id as quiz_id
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE q.course_id = ?
  `, [courseId]);

  const allGrades = await query<any>(`
    SELECT s.student_id, g.score, a.max_score, a.id as assignment_id
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN grades g ON s.id = g.submission_id
    WHERE a.course_id = ? AND g.score IS NOT NULL
  `, [courseId]);

  const allAttendance = await query<any>(`
    SELECT ar.student_id, ar.status
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    WHERE s.course_id = ?
  `, [courseId]);

  const studentPerformance = enrolledStudents.map(st => {
    // Quiz score average for student
    const stAttempts = allAttempts.filter(a => a.student_id === st.id);
    let quizAvg = 0;
    if (stAttempts.length > 0) {
      const sum = stAttempts.reduce((acc, a) => acc + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0);
      quizAvg = Math.round(sum / stAttempts.length);
    } else if (quizzes.length === 0) {
      quizAvg = 85; // Baseline if no quizzes exist
    }

    // Assignment score average for student
    const stGrades = allGrades.filter(g => g.student_id === st.id);
    let assignmentAvg = 0;
    if (stGrades.length > 0) {
      const sum = stGrades.reduce((acc, g) => acc + (g.max_score > 0 ? (g.score / g.max_score) * 100 : 0), 0);
      assignmentAvg = Math.round(sum / stGrades.length);
    } else if (assignments.length === 0) {
      assignmentAvg = 85; // Baseline if no assignments exist
    }

    // Attendance rate for student
    const stAtt = allAttendance.filter(a => a.student_id === st.id);
    let attendanceRate = 100;
    if (stAtt.length > 0) {
      const presentCount = stAtt.filter(a => a.status === 'present' || a.status === 'late').length;
      attendanceRate = Math.round((presentCount / stAtt.length) * 100);
    }

    // Composite grade: 45% assignments, 35% quizzes, 20% attendance
    const overallScore = Math.round((assignmentAvg * 0.45) + (quizAvg * 0.35) + (attendanceRate * 0.20));

    let gradeLetter: 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (overallScore >= 85) gradeLetter = 'A';
    else if (overallScore >= 70) gradeLetter = 'B';
    else if (overallScore >= 55) gradeLetter = 'C';
    else if (overallScore >= 40) gradeLetter = 'D';
    else gradeLetter = 'F';

    const riskReasons: string[] = [];
    if (attendanceRate < 75) riskReasons.push(`Low Attendance (${attendanceRate}%)`);
    if (quizAvg < 60 && stAttempts.length > 0) riskReasons.push(`Sub-par Quiz Score (${quizAvg}%)`);
    if (assignmentAvg < 60 && stGrades.length > 0) riskReasons.push(`Low Assignment Score (${assignmentAvg}%)`);
    if (quizzes.length > stAttempts.length) riskReasons.push(`Missing ${quizzes.length - stAttempts.length} Quiz Attempt(s)`);

    let riskLevel: 'critical' | 'warning' | 'healthy' = 'healthy';
    if (overallScore < 45 || attendanceRate < 60) riskLevel = 'critical';
    else if (overallScore < 65 || attendanceRate < 75 || riskReasons.length >= 2) riskLevel = 'warning';

    return {
      ...st,
      quiz_avg: quizAvg,
      assignment_avg: assignmentAvg,
      attendance_rate: attendanceRate,
      overall_score: overallScore,
      grade_letter: gradeLetter,
      risk_level: riskLevel,
      risk_reasons: riskReasons,
    };
  });

  // Grade Distribution Counts
  const gradeDistribution = [
    { grade: 'A', range: '85-100%', count: studentPerformance.filter(s => s.grade_letter === 'A').length, color: '#10b981' },
    { grade: 'B', range: '70-84%', count: studentPerformance.filter(s => s.grade_letter === 'B').length, color: '#3b82f6' },
    { grade: 'C', range: '55-69%', count: studentPerformance.filter(s => s.grade_letter === 'C').length, color: '#f59e0b' },
    { grade: 'D', range: '40-54%', count: studentPerformance.filter(s => s.grade_letter === 'D').length, color: '#f97316' },
    { grade: 'F', range: '<40%', count: studentPerformance.filter(s => s.grade_letter === 'F').length, color: '#ef4444' },
  ].map(g => ({
    ...g,
    percentage: studentCount > 0 ? Math.round((g.count / studentCount) * 100) : 0,
  }));

  // Overall Class Averages
  const classAvgScore = studentCount > 0
    ? Math.round(studentPerformance.reduce((acc, s) => acc + s.overall_score, 0) / studentCount)
    : 0;
  const classQuizAvg = studentCount > 0
    ? Math.round(studentPerformance.reduce((acc, s) => acc + s.quiz_avg, 0) / studentCount)
    : 0;
  const classAssignmentAvg = studentCount > 0
    ? Math.round(studentPerformance.reduce((acc, s) => acc + s.assignment_avg, 0) / studentCount)
    : 0;
  const classAttendanceAvg = studentCount > 0
    ? Math.round(studentPerformance.reduce((acc, s) => acc + s.attendance_rate, 0) / studentCount)
    : 0;
  const passRate = studentCount > 0
    ? Math.round((studentPerformance.filter(s => s.overall_score >= 40).length / studentCount) * 100)
    : 100;

  // Top Achievers and At-Risk Watchlist
  const topPerformers = [...studentPerformance]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 5);

  const atRiskWatchlist = studentPerformance
    .filter(s => s.risk_level !== 'healthy')
    .sort((a, b) => a.overall_score - b.overall_score);

  return {
    course,
    summary: {
      student_count: studentCount,
      total_modules: modules.length,
      total_lessons: lessons.length,
      syllabus_coverage_rate: syllabusCoverageRate,
      target_sessions: targetSessionsTotal,
      conducted_sessions: conductedSessions,
      pacing_status: pacingStatus,
      pacing_variance: pacingVariance,
      class_avg_score: classAvgScore,
      class_quiz_avg: classQuizAvg,
      class_assignment_avg: classAssignmentAvg,
      class_attendance_avg: classAttendanceAvg,
      pass_rate: passRate,
    },
    syllabus: {
      modules: enrichedModules,
      total_lessons: lessons.length,
      syllabus_coverage_rate: syllabusCoverageRate,
    },
    target_schedule: {
      target_weeks: targetWeeks,
      current_week: currentWeek,
      target_sessions_total: targetSessionsTotal,
      expected_sessions_to_date: expectedSessionsToDate,
      conducted_sessions: conductedSessions,
      pacing_status: pacingStatus,
      pacing_variance: pacingVariance,
      milestones,
    },
    result_analysis: {
      grade_distribution: gradeDistribution,
      quizzes: quizzes.map(q => ({
        id: q.id,
        title: q.title,
        max_score: q.max_score,
        due_at: q.due_at,
        status: q.status,
        attempts_count: Number(q.attempts_count) || 0,
        avg_score: q.avg_score ? Math.round(Number(q.avg_score) * 10) / 10 : 0,
        max_score_achieved: q.max_score_achieved ? Number(q.max_score_achieved) : 0,
        min_score_achieved: q.min_score_achieved ? Number(q.min_score_achieved) : 0,
        avg_percentage: (q.avg_score && q.max_score > 0) ? Math.round((Number(q.avg_score) / q.max_score) * 100) : 0,
      })),
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        max_score: a.max_score,
        due_at: a.due_at,
        status: a.status,
        submission_count: Number(a.submission_count) || 0,
        graded_count: Number(a.graded_count) || 0,
        avg_score: a.avg_score ? Math.round(Number(a.avg_score) * 10) / 10 : 0,
        max_score_achieved: a.max_score_achieved ? Number(a.max_score_achieved) : 0,
        min_score_achieved: a.min_score_achieved ? Number(a.min_score_achieved) : 0,
        avg_percentage: (a.avg_score && a.max_score > 0) ? Math.round((Number(a.avg_score) / a.max_score) * 100) : 0,
      })),
      top_performers: topPerformers,
      at_risk_watchlist: atRiskWatchlist,
      student_roster: studentPerformance,
    },
  };
}

export async function getTeacherCourseAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const teacherId = req.user!.id;

  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ id: string }>(`
      SELECT id FROM courses WHERE id = ? AND (
        created_by = ? OR id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?)
      )
    `, [courseId, teacherId, teacherId]);

    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'Unauthorized to view analytics for this course' });
      return;
    }
  }

  const analytics = await computeCourseAnalytics(courseId);
  if (!analytics) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  res.json({
    success: true,
    data: analytics,
  });
}

export async function getTeacherAnalytics(req: AuthRequest, res: Response): Promise<void> {
  const teacherId = req.user!.id;
  const targetCourseId = req.query.courseId as string | undefined;

  // Total courses assigned or created
  let coursesQuery = `
    SELECT c.id, c.title, c.description, c.created_at, s.name as subject_name, s.code as subject_code,
           CAST((SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') AS INTEGER) as student_count,
           CAST((SELECT COUNT(*) FROM assignments WHERE course_id = c.id) AS INTEGER) as assignment_count,
           CAST((SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) AS INTEGER) as quiz_count,
           CAST((SELECT COUNT(*) FROM modules WHERE course_id = c.id) AS INTEGER) as module_count,
           CAST((SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) AS INTEGER) as lesson_count,
           CAST((SELECT COUNT(*) FROM attendance_sessions WHERE course_id = c.id) AS INTEGER) as session_count
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
  `;

  let courses: any[] = [];
  if (req.user?.role === 'admin') {
    coursesQuery += ` ORDER BY c.created_at DESC`;
    courses = await query<any>(coursesQuery);
  } else {
    coursesQuery += `
      WHERE c.id IN (
        SELECT course_id FROM course_teachers WHERE teacher_id = ?
        UNION
        SELECT id FROM courses WHERE created_by = ?
      )
      ORDER BY c.created_at DESC
    `;
    courses = await query<any>(coursesQuery, [teacherId, teacherId]);
  }

  const totalStudents = courses.reduce((acc, c) => acc + (c.student_count || 0), 0);

  // Pending submissions to grade
  const pendingGrading = await getOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE a.course_id IN (
      SELECT course_id FROM course_teachers WHERE teacher_id = ?
      UNION
      SELECT id FROM courses WHERE created_by = ?
    ) AND s.status = 'submitted'
  `, [teacherId, teacherId]);

  // Compute selected course analytics (explicit query param, or first course default)
  const selectedCourseId = targetCourseId || (courses.length > 0 ? courses[0].id : null);
  let selectedCourseAnalytics = null;
  if (selectedCourseId) {
    selectedCourseAnalytics = await computeCourseAnalytics(selectedCourseId);
  }

  // Cross-course Flagged Students
  const lowScorers = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.student_id, c.title as course_title,
           qa.score, qa.max_score, 'Low Quiz Score (< 60%)' as reason
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    JOIN profiles p ON qa.student_id = p.id
    WHERE (c.created_by = ? OR c.id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?))
      AND qa.max_score > 0 AND (qa.score / qa.max_score) < 0.6
    LIMIT 6
  `, [teacherId, teacherId]);

  res.json({
    success: true,
    data: {
      total_courses: courses.length,
      total_students: totalStudents,
      pending_grading_count: pendingGrading?.count || 0,
      courses,
      selected_course_analytics: selectedCourseAnalytics,
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
