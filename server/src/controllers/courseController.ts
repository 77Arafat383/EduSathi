import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listCourses(req: AuthRequest, res: Response): Promise<void> {
  const { search, subject_id, status } = req.query;

  let sql = `
    SELECT c.*, s.name as subject_name, s.code as subject_code,
           p.full_name as teacher_name, p.avatar_url as teacher_avatar,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count
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
