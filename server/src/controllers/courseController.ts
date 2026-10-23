import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listCourses(req: AuthRequest, res: Response): Promise<void> {
  const { search, subject_id, status } = req.query;

  let sql = `
    SELECT c.*, s.name as subject_name, s.code as subject_code,
           COALESCE(
             (SELECT p2.full_name FROM course_teachers ct JOIN profiles p2 ON ct.teacher_id = p2.id WHERE ct.course_id = c.id AND p2.role = 'teacher' LIMIT 1),
             p.full_name
           ) as teacher_name,
           COALESCE(
             (SELECT p2.avatar_url FROM course_teachers ct JOIN profiles p2 ON ct.teacher_id = p2.id WHERE ct.course_id = c.id AND p2.role = 'teacher' LIMIT 1),
             p.avatar_url
           ) as teacher_avatar,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
           (SELECT COUNT(*) FROM course_teachers ct JOIN profiles p3 ON ct.teacher_id = p3.id WHERE ct.course_id = c.id AND p3.role = 'teacher') as teacher_count
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Students only see published courses unless explicitly enrolled
  if (req.user?.role === 'student') {
    sql += ` AND c.status = 'published'`;
  } else if (status) {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  if (subject_id) {
    sql += ` AND c.subject_id = ?`;
    params.push(subject_id);
  }

  if (search) {
    sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY c.created_at DESC`;

  const courses = await query(sql, params);
  res.json({
    success: true,
    data: courses,
  });
}

export async function getCourse(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const course = await getOne<any>(`
    SELECT c.*, s.name as subject_name, s.code as subject_code,
           p.full_name as teacher_name, p.email as teacher_email, p.avatar_url as teacher_avatar,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE c.id = ?
  `, [courseId]);

  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  // Check enrollment if student
  let isEnrolled = false;
  let completedLessonIds: string[] = [];

  if (req.user?.role === 'student') {
    const enrollment = await getOne<{ id: string }>(
      `SELECT id FROM enrollments WHERE course_id = ? AND student_id = ? AND status = 'active'`,
      [courseId, req.user.id]
    );
    isEnrolled = Boolean(enrollment);

    // Get completed lessons
    const progress = await query<{ lesson_id: string }>(
      'SELECT lesson_id FROM lesson_progress WHERE student_id = ?',
      [req.user.id]
    );
    completedLessonIds = progress.map(p => p.lesson_id);
  }

  // Fetch modules and lessons
  const modules = await query<any>(
    'SELECT * FROM modules WHERE course_id = ? ORDER BY position ASC, created_at ASC',
    [courseId]
  );

  for (const mod of modules) {
    mod.lessons = await query<any>(
      'SELECT id, title, content, position, published_at FROM lessons WHERE module_id = ? ORDER BY position ASC',
      [mod.id]
    );
  }

  // Fetch quizzes
  const quizzes = await query<any>(
    `SELECT id, title, instructions, max_score, due_at, status FROM quizzes WHERE course_id = ? AND status != 'draft' ORDER BY created_at DESC`,
    [courseId]
  );

  // Fetch assignments
  const assignments = await query<any>(
    `SELECT id, title, instructions, max_score, due_at, submission_type, status FROM assignments WHERE course_id = ? AND status != 'draft' ORDER BY created_at DESC`,
    [courseId]
  );

  // Fetch announcements
  const announcements = await query<any>(
    `SELECT a.*, p.full_name as author_name, p.avatar_url as author_avatar
     FROM announcements a
     LEFT JOIN profiles p ON a.author_id = p.id
     WHERE a.course_id = ?
     ORDER BY a.published_at DESC`,
    [courseId]
  );

  res.json({
    success: true,
    data: {
      ...course,
      is_enrolled: isEnrolled,
      completed_lesson_ids: completedLessonIds,
      modules,
      quizzes,
      assignments,
      announcements,
    },
  });
}

export async function createCourse(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, subject_id, banner_url, status } = req.body;

  const id = `crs_${Date.now()}`;
  const createdBy = req.user!.id;

  await run(
    `INSERT INTO courses (id, title, description, subject_id, status, created_by, banner_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, title, description || null, subject_id || null, status || 'published', createdBy, banner_url || null]
  );

  // Add author to course_teachers
  await run(`INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)`, [id, createdBy]);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { id, title },
  });
}

export async function updateCourse(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { title, description, subject_id, status, banner_url } = req.body;

  // Verify ownership or admin
  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
      [courseId, req.user?.id]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this course' });
      return;
    }
  }

  await run(
    `UPDATE courses SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       subject_id = COALESCE(?, subject_id),
       status = COALESCE(?, status),
       banner_url = COALESCE(?, banner_url),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description, subject_id, status, banner_url, courseId]
  );

  res.json({
    success: true,
    message: 'Course updated successfully',
  });
}

export async function enrollCourse(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const studentId = req.body.student_id || req.user?.id;

  const course = await getOne<{ id: string }>('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const existing = await getOne<{ id: string }>(
    'SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?',
    [courseId, studentId]
  );

  if (existing) {
    res.status(409).json({ success: false, message: 'Already enrolled in this course' });
    return;
  }

  const id = `enr_${Date.now()}`;
  await run(
    `INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, 'active')`,
    [id, courseId, studentId]
  );

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: { id, course_id: courseId },
  });
}

export async function getMyCourses(req: AuthRequest, res: Response): Promise<void> {
  if (req.user?.role === 'admin') {
    const courses = await query<any>(`
      SELECT c.*, s.name as subject_name, s.code as subject_code,
             p.full_name as teacher_name, p.avatar_url as teacher_avatar,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
             (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
             (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count,
             (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count
      FROM courses c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN profiles p ON c.created_by = p.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: courses });
    return;
  }

  if (req.user?.role === 'teacher') {
    const courses = await query<any>(`
      SELECT c.*, s.name as subject_name,
             (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
             (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
             (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count
      FROM courses c
      JOIN course_teachers ct ON c.id = ct.course_id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE ct.teacher_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({ success: true, data: courses });
    return;
  }

  // Student courses with completion calculation
  const courses = await query<any>(`
    SELECT c.*, s.name as subject_name, p.full_name as teacher_name,
           e.enrolled_at,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as total_lessons,
           (SELECT COUNT(*) FROM lesson_progress lp 
            JOIN lessons l ON lp.lesson_id = l.id 
            JOIN modules m ON l.module_id = m.id 
            WHERE m.course_id = c.id AND lp.student_id = ?) as completed_lessons
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE e.student_id = ? AND e.status = 'active'
    ORDER BY e.enrolled_at DESC
  `, [req.user?.id, req.user?.id]);

  const mapped = courses.map(c => {
    const total = c.total_lessons || 0;
    const completed = c.completed_lessons || 0;
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...c,
      progress_pct,
    };
  });

  res.json({
    success: true,
    data: mapped,
  });
}

export async function addModule(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { title } = req.body;

  const id = `mod_${Date.now()}`;
  await run(
    'INSERT INTO modules (id, course_id, title) VALUES (?, ?, ?)',
    [id, courseId, title]
  );

  res.status(201).json({
    success: true,
    message: 'Module added successfully',
    data: { id, title },
  });
}

export async function addLesson(req: AuthRequest, res: Response): Promise<void> {
  const { moduleId } = req.params;
  const { title, content } = req.body;

  const id = `les_${Date.now()}`;
  await run(
    'INSERT INTO lessons (id, module_id, title, content) VALUES (?, ?, ?, ?)',
    [id, moduleId, title, content || '']
  );

  res.status(201).json({
    success: true,
    message: 'Lesson added successfully',
    data: { id, title },
  });
}

export async function markLessonProgress(req: AuthRequest, res: Response): Promise<void> {
  const { lessonId } = req.params;
  const studentId = req.user?.id;

  await run(
    `INSERT INTO lesson_progress (student_id, lesson_id, completed_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`,
    [studentId, lessonId]
  );

  res.json({
    success: true,
    message: 'Lesson marked as complete',
  });
}

export async function deleteCourse(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
      [courseId, req.user?.id]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this course' });
      return;
    }
  }

  await run('DELETE FROM courses WHERE id = ?', [courseId]);

  res.json({
    success: true,
    message: 'Course deleted successfully',
  });
}

export async function getCourseTeachers(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const teachers = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.avatar_url, p.department, p.status, ct.assigned_at
    FROM course_teachers ct
    JOIN profiles p ON ct.teacher_id = p.id
    WHERE ct.course_id = ? AND p.role = 'teacher'
    ORDER BY ct.assigned_at ASC
  `, [courseId]);

  res.json({ success: true, data: teachers });
}

export async function assignCourseTeacher(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { teacher_id } = req.body;

  if (!teacher_id) {
    res.status(400).json({ success: false, message: 'Teacher ID is required' });
    return;
  }

  const course = await getOne<{ id: string }>('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const teacher = await getOne<{ id: string; role: string }>('SELECT id, role FROM profiles WHERE id = ?', [teacher_id]);
  if (!teacher || teacher.role !== 'teacher') {
    res.status(404).json({ success: false, message: 'Teacher profile not found' });
    return;
  }

  const existing = await getOne<{ teacher_id: string }>(
    'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
    [courseId, teacher_id]
  );
  if (existing) {
    res.status(409).json({ success: false, message: 'Teacher already assigned to this course' });
    return;
  }

  await run('INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)', [courseId, teacher_id]);
  res.status(201).json({ success: true, message: 'Teacher assigned to course successfully' });
}

export async function removeCourseTeacher(req: AuthRequest, res: Response): Promise<void> {
  const { courseId, teacherId } = req.params;
  await run('DELETE FROM course_teachers WHERE course_id = ? AND teacher_id = ?', [courseId, teacherId]);
  res.json({ success: true, message: 'Teacher removed from course successfully' });
}

export async function getCourseStudents(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const students = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.avatar_url, p.student_id, p.department,
           e.id as enrollment_id, e.status as enrollment_status, e.enrolled_at,
           (SELECT COUNT(*) FROM lesson_progress lp 
            JOIN lessons l ON lp.lesson_id = l.id 
            JOIN modules m ON l.module_id = m.id 
            WHERE m.course_id = ? AND lp.student_id = p.id) as completed_lessons,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?) as total_lessons
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    WHERE e.course_id = ?
    ORDER BY e.enrolled_at DESC
  `, [courseId, courseId, courseId]);

  const mapped = students.map(s => {
    const total = s.total_lessons || 0;
    const completed = s.completed_lessons || 0;
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...s, progress_pct };
  });

  res.json({ success: true, data: mapped });
}

export async function unenrollCourseStudent(req: AuthRequest, res: Response): Promise<void> {
  const { courseId, studentId } = req.params;
  await run('DELETE FROM enrollments WHERE course_id = ? AND student_id = ?', [courseId, studentId]);
  res.json({ success: true, message: 'Student removed from course' });
}

export async function getCourseStudentsPerformance(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const teacherId = req.user!.id;

  // Verify access: teacher assigned to course, created the course, or admin
  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      `SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?
       UNION
       SELECT created_by as teacher_id FROM courses WHERE id = ? AND created_by = ?`,
      [courseId, teacherId, courseId, teacherId]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to view performance for this course' });
      return;
    }
  }

  // Fetch course details
  const course = await getOne<any>(`
    SELECT c.*, s.name as subject_name, s.code as subject_code
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    WHERE c.id = ?
  `, [courseId]);

  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  // 1. Assignments list
  const assignments = await query<any>(`
    SELECT id, title, max_score, due_at, submission_type, status, created_at
    FROM assignments
    WHERE course_id = ? AND status != 'draft'
    ORDER BY due_at ASC, created_at ASC
  `, [courseId]);

  // 2. Quizzes list
  const quizzes = await query<any>(`
    SELECT id, title, max_score, duration_minutes, due_at, status, created_at
    FROM quizzes
    WHERE course_id = ? AND status != 'draft'
    ORDER BY due_at ASC, created_at ASC
  `, [courseId]);

  // 3. Attendance sessions list
  const sessions = await query<any>(`
    SELECT id, title, session_date, created_at
    FROM attendance_sessions
    WHERE course_id = ?
    ORDER BY session_date ASC, created_at ASC
  `, [courseId]);

  // 4. Total lessons
  const totalLessonsRow = await getOne<{ count: number }>(`
    SELECT COUNT(*) as count
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ?
  `, [courseId]);
  const totalLessons = totalLessonsRow?.count || 0;

  // 5. Enrolled students
  const students = await query<any>(`
    SELECT p.id, p.full_name, p.email, p.avatar_url, p.student_id as student_code, p.department,
           e.id as enrollment_id, e.status as enrollment_status, e.enrolled_at
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    WHERE e.course_id = ?
    ORDER BY p.full_name ASC
  `, [courseId]);

  // 6. Submissions with grades
  const submissions = await query<any>(`
    SELECT s.id as submission_id, s.assignment_id, s.student_id, s.submitted_at, s.status, s.content, s.file_url,
           g.id as grade_id, g.score, g.feedback, g.released_at
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    LEFT JOIN grades g ON s.id = g.submission_id
    WHERE a.course_id = ?
  `, [courseId]);

  // 7. Quiz attempts (highest score per student per quiz)
  const attempts = await query<any>(`
    SELECT qa.id as attempt_id, qa.quiz_id, qa.student_id, qa.score, qa.max_score, qa.submitted_at, qa.status
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE q.course_id = ?
    ORDER BY qa.score DESC, qa.submitted_at DESC
  `, [courseId]);

  // 8. Attendance records
  const attendanceRecords = await query<any>(`
    SELECT ar.id, ar.session_id, ar.student_id, ar.status, s.session_date, s.title as session_title
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    WHERE s.course_id = ?
  `, [courseId]);

  // 9. Lesson progress
  const progressRows = await query<any>(`
    SELECT lp.student_id, lp.lesson_id
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = ?
  `, [courseId]);

  // Indexing maps for O(1) lookup
  const subMap = new Map<string, any>();
  for (const s of submissions) {
    subMap.set(`${s.student_id}_${s.assignment_id}`, s);
  }

  const quizAttemptMap = new Map<string, any>();
  for (const a of attempts) {
    const key = `${a.student_id}_${a.quiz_id}`;
    if (!quizAttemptMap.has(key)) {
      quizAttemptMap.set(key, a);
    }
  }

  const attMap = new Map<string, any>();
  for (const r of attendanceRecords) {
    attMap.set(`${r.student_id}_${r.session_id}`, r);
  }

  // Calculate per-student performance
  const studentsPerformance = students.map((st) => {
    // 1. Lessons progress
    let completedCount = 0;
    for (const p of progressRows) {
      if (p.student_id === st.id) completedCount++;
    }
    const progress_pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // 2. Assignments
    let submittedCount = 0;
    let gradedCount = 0;
    let sumScorePct = 0;

    const assignmentsBreakdown = assignments.map((asg) => {
      const sub = subMap.get(`${st.id}_${asg.id}`);
      const isSubmitted = Boolean(sub);
      const isGraded = Boolean(sub && sub.score !== null && sub.score !== undefined);
      if (isSubmitted) submittedCount++;
      if (isGraded) {
        gradedCount++;
        const pct = asg.max_score > 0 ? (Number(sub.score) / asg.max_score) * 100 : 0;
        sumScorePct += pct;
      }

      return {
        assignment_id: asg.id,
        title: asg.title,
        max_score: asg.max_score,
        due_at: asg.due_at,
        submission_id: sub?.submission_id || null,
        submitted_at: sub?.submitted_at || null,
        status: isGraded ? 'graded' : (isSubmitted ? 'submitted' : 'missing'),
        content: sub?.content || null,
        file_url: sub?.file_url || null,
        score: isGraded ? sub.score : null,
        score_pct: isGraded && asg.max_score > 0 ? Math.round((sub.score / asg.max_score) * 100) : null,
        feedback: sub?.feedback || null,
        released_at: sub?.released_at || null,
      };
    });

    const assignment_avg_pct = gradedCount > 0 ? Math.round(sumScorePct / gradedCount) : 0;

    // 3. Quizzes
    let quizAttemptedCount = 0;
    let sumQuizPct = 0;

    const quizzesBreakdown = quizzes.map((q) => {
      const att = quizAttemptMap.get(`${st.id}_${q.id}`);
      const hasAttempt = Boolean(att);
      if (hasAttempt) {
        quizAttemptedCount++;
        const pct = att.max_score > 0 ? (Number(att.score) / att.max_score) * 100 : 0;
        sumQuizPct += pct;
      }

      return {
        quiz_id: q.id,
        title: q.title,
        max_score: q.max_score,
        due_at: q.due_at,
        attempt_id: att?.attempt_id || null,
        submitted_at: att?.submitted_at || null,
        status: hasAttempt ? 'completed' : 'unattempted',
        score: hasAttempt ? att.score : null,
        score_pct: hasAttempt && att.max_score > 0 ? Math.round((att.score / att.max_score) * 100) : null,
      };
    });

    const quiz_avg_pct = quizAttemptedCount > 0 ? Math.round(sumQuizPct / quizAttemptedCount) : 0;

    // 4. Attendance
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    const attendanceBreakdown = sessions.map((sess) => {
      const rec = attMap.get(`${st.id}_${sess.id}`);
      const status = rec ? rec.status : 'unmarked';
      if (status === 'present') presentCount++;
      else if (status === 'late') lateCount++;
      else if (status === 'absent') absentCount++;
      else unmarkedCount++;

      return {
        session_id: sess.id,
        session_date: sess.session_date,
        session_title: sess.title,
        status,
      };
    });

    const totalSessions = sessions.length;
    const attendance_pct = totalSessions > 0
      ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
      : 100;

    // 5. Composite Performance Score
    let overall_pct = 0;
    const hasAssignments = assignments.length > 0;
    const hasQuizzes = quizzes.length > 0;

    if (hasAssignments && hasQuizzes) {
      overall_pct = Math.round(
        assignment_avg_pct * 0.40 +
        quiz_avg_pct * 0.35 +
        attendance_pct * 0.15 +
        progress_pct * 0.10
      );
    } else if (hasAssignments) {
      overall_pct = Math.round(
        assignment_avg_pct * 0.60 +
        attendance_pct * 0.25 +
        progress_pct * 0.15
      );
    } else if (hasQuizzes) {
      overall_pct = Math.round(
        quiz_avg_pct * 0.60 +
        attendance_pct * 0.25 +
        progress_pct * 0.15
      );
    } else {
      overall_pct = Math.round(
        attendance_pct * 0.70 +
        progress_pct * 0.30
      );
    }

    // Letter grade
    let grade_letter = 'A';
    if (overall_pct >= 90) grade_letter = 'A+';
    else if (overall_pct >= 80) grade_letter = 'A';
    else if (overall_pct >= 70) grade_letter = 'B';
    else if (overall_pct >= 60) grade_letter = 'C';
    else if (overall_pct >= 50) grade_letter = 'D';
    else grade_letter = 'F';

    // Performance tier
    let performance_tier: 'top_performer' | 'on_track' | 'needs_attention' | 'at_risk' = 'on_track';
    if (overall_pct < 50 || attendance_pct < 60) {
      performance_tier = 'at_risk';
    } else if (overall_pct < 70 || attendance_pct < 75) {
      performance_tier = 'needs_attention';
    } else if (overall_pct >= 85 && attendance_pct >= 80) {
      performance_tier = 'top_performer';
    }

    return {
      student_id: st.id,
      full_name: st.full_name,
      student_code: st.student_code || st.id,
      email: st.email,
      avatar_url: st.avatar_url,
      department: st.department,
      enrollment_id: st.enrollment_id,
      enrolled_at: st.enrolled_at,

      // Summary KPIs
      overall_pct,
      grade_letter,
      performance_tier,
      progress_pct,
      completed_lessons: completedCount,
      total_lessons: totalLessons,

      assignment_avg_pct,
      submitted_assignments: submittedCount,
      graded_assignments: gradedCount,
      total_assignments: assignments.length,
      assignments_breakdown: assignmentsBreakdown,

      quiz_avg_pct,
      attempted_quizzes: quizAttemptedCount,
      total_quizzes: quizzes.length,
      quizzes_breakdown: quizzesBreakdown,

      attendance_pct,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      unmarked_count: unmarkedCount,
      total_sessions: totalSessions,
      attendance_breakdown: attendanceBreakdown,
    };
  });

  // Class aggregates
  const totalEnrolled = studentsPerformance.length;
  const avgOverall = totalEnrolled > 0
    ? Math.round(studentsPerformance.reduce((acc, s) => acc + s.overall_pct, 0) / totalEnrolled)
    : 0;
  const avgAssignment = totalEnrolled > 0
    ? Math.round(studentsPerformance.reduce((acc, s) => acc + s.assignment_avg_pct, 0) / totalEnrolled)
    : 0;
  const avgQuiz = totalEnrolled > 0
    ? Math.round(studentsPerformance.reduce((acc, s) => acc + s.quiz_avg_pct, 0) / totalEnrolled)
    : 0;
  const avgAttendance = totalEnrolled > 0
    ? Math.round(studentsPerformance.reduce((acc, s) => acc + s.attendance_pct, 0) / totalEnrolled)
    : 100;
  const avgProgress = totalEnrolled > 0
    ? Math.round(studentsPerformance.reduce((acc, s) => acc + s.progress_pct, 0) / totalEnrolled)
    : 0;

  const topPerformers = studentsPerformance.filter((s) => s.performance_tier === 'top_performer').length;
  const atRisk = studentsPerformance.filter((s) => s.performance_tier === 'at_risk').length;
  const needsAttention = studentsPerformance.filter((s) => s.performance_tier === 'needs_attention').length;

  res.json({
    success: true,
    data: {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        subject_name: course.subject_name,
        subject_code: course.subject_code,
        banner_url: course.banner_url,
        total_lessons: totalLessons,
        total_assignments: assignments.length,
        total_quizzes: quizzes.length,
        total_sessions: sessions.length,
      },
      summary: {
        total_enrolled: totalEnrolled,
        class_avg_overall_pct: avgOverall,
        class_avg_assignment_pct: avgAssignment,
        class_avg_quiz_pct: avgQuiz,
        class_avg_attendance_pct: avgAttendance,
        class_avg_progress_pct: avgProgress,
        top_performers_count: topPerformers,
        at_risk_count: atRisk,
        needs_attention_count: needsAttention,
      },
      students: studentsPerformance,
    },
  });
}

