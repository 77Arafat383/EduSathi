import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function createAssignment(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { title, instructions, max_score, due_at, submission_type, status, file_url, file_name } = req.body;

  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
      [courseId, req.user?.id]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to create assignments in this course' });
      return;
    }
  }

  const id = `asg_${Date.now()}`;
  await run(
    `INSERT INTO assignments (id, course_id, title, instructions, max_score, due_at, submission_type, status, file_url, file_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, courseId, title, instructions, max_score || 100, due_at || null, submission_type || 'text_or_link', status || 'published', file_url || null, file_name || null]
  );

  // Notify enrolled students
  const enrolledStudents = await query<{ student_id: string }>(
    `SELECT student_id FROM enrollments WHERE course_id = ? AND status = 'active'`,
    [courseId]
  );
  for (const s of enrolledStudents) {
    await run(
      `INSERT INTO notifications (id, recipient_id, type, title, message, link)
       VALUES (?, ?, 'assignment', ?, ?, ?)`,
      [`notif_${Date.now()}_${s.student_id}`, s.student_id, `New Assignment: ${title}`, `A new assignment has been published with due date: ${due_at || 'TBD'}`, `/student/assignments/${id}`]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: { id, title },
  });
}

export async function listAssignments(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const assignments = await query<any>(`
    SELECT a.*, c.title as course_title,
           (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.course_id = ?
    ORDER BY a.created_at DESC
  `, [courseId]);

  res.json({
    success: true,
    data: assignments,
  });
}

export async function listTeacherAssignments(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.query;
  let sql = `
    SELECT a.*, c.title as course_title,
           (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count,
           (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND status = 'graded') as graded_count
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (req.user?.role === 'teacher') {
    conditions.push(`(c.id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?) OR c.created_by = ?)`);
    params.push(req.user.id, req.user.id);
  }

  if (courseId && courseId !== 'all') {
    conditions.push(`a.course_id = ?`);
    params.push(courseId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ');
  }

  sql += ` ORDER BY a.created_at DESC`;

  const assignments = await query<any>(sql, params);
  res.json({
    success: true,
    data: assignments,
  });
}

export async function getAssignment(req: AuthRequest, res: Response): Promise<void> {
  const { assignmentId } = req.params;

  const assignment = await getOne<any>(`
    SELECT a.*, c.title as course_title, c.id as course_id
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `, [assignmentId]);

  if (!assignment) {
    res.status(404).json({ success: false, message: 'Assignment not found' });
    return;
  }

  let submission: any = null;
  if (req.user?.role === 'student') {
    submission = await getOne<any>(`
      SELECT s.*, g.score, g.feedback, g.score as grade_score, g.feedback as grade_feedback, g.released_at as grade_released_at
      FROM submissions s
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE s.assignment_id = ? AND s.student_id = ?
    `, [assignmentId, req.user.id]);
  }

  res.json({
    success: true,
    data: {
      ...assignment,
      my_submission: submission,
    },
  });
}

export async function submitAssignment(req: AuthRequest, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  const { content, file_url } = req.body;
  const studentId = req.user!.id;

  const assignment = await getOne<any>('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  if (!assignment) {
    res.status(404).json({ success: false, message: 'Assignment not found' });
    return;
  }

  // Check enrollment
  const enrollment = await getOne<{ id: string }>(
    'SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?',
    [assignment.course_id, studentId]
  );
  if (!enrollment) {
    res.status(403).json({ success: false, message: 'You must be enrolled in the course to submit this assignment' });
    return;
  }

  const existing = await getOne<{ id: string }>('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?', [assignmentId, studentId]);

  if (existing) {
    await run(
      `UPDATE submissions SET content = ?, file_url = ?, submitted_at = CURRENT_TIMESTAMP, status = 'submitted' WHERE id = ?`,
      [content, file_url || null, existing.id]
    );
  } else {
    const id = `sub_${Date.now()}`;
    await run(
      `INSERT INTO submissions (id, assignment_id, student_id, content, file_url, status)
       VALUES (?, ?, ?, ?, ?, 'submitted')`,
      [id, assignmentId, studentId, content, file_url || null]
    );
  }

  // Notify course teachers
  const teachers = await query<{ teacher_id: string }>(
    'SELECT teacher_id FROM course_teachers WHERE course_id = ?',
    [assignment.course_id]
  );
  for (const t of teachers) {
    await run(
      `INSERT INTO notifications (id, recipient_id, type, title, message, link)
       VALUES (?, ?, 'submission', ?, ?, ?)`,
      [`notif_${Date.now()}_${t.teacher_id}`, t.teacher_id, 'New Submission Received', `${req.user?.full_name} submitted work for: ${assignment.title}`, '/teacher/gradebook']
    );
  }

  res.json({
    success: true,
    message: 'Assignment submitted successfully',
  });
}

export async function listSubmissions(req: AuthRequest, res: Response): Promise<void> {
  const { assignmentId } = req.params;

  const submissions = await query<any>(`
    SELECT s.*, p.full_name as student_name, p.email as student_email, p.student_id as student_code, p.avatar_url,
           g.score as grade_score, g.feedback as grade_feedback, g.released_at as grade_released_at
    FROM submissions s
    JOIN profiles p ON s.student_id = p.id
    LEFT JOIN grades g ON s.id = g.submission_id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at DESC
  `, [assignmentId]);

  res.json({
    success: true,
    data: submissions,
  });
}

export async function gradeSubmission(req: AuthRequest, res: Response): Promise<void> {
  const { submissionId } = req.params;
  const { score, feedback } = req.body;
  const teacherId = req.user!.id;

  const submission = await getOne<any>(`
    SELECT s.*, a.max_score, a.title as assignment_title, a.course_id
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.id = ?
  `, [submissionId]);

  if (!submission) {
    res.status(404).json({ success: false, message: 'Submission not found' });
    return;
  }

  // Validate score bounds
  if (score < 0 || score > submission.max_score) {
    res.status(400).json({
      success: false,
      message: `Score must be between 0 and maximum marks (${submission.max_score})`,
    });
    return;
  }

  // Check teacher assignment authorization
  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      `SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?
       UNION
       SELECT created_by as teacher_id FROM courses WHERE id = ? AND created_by = ?`,
      [submission.course_id, teacherId, submission.course_id, teacherId]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to grade this submission' });
      return;
    }
  }

  const existingGrade = await getOne<{ id: string }>('SELECT id FROM grades WHERE submission_id = ?', [submissionId]);
  if (existingGrade) {
    await run(
      `UPDATE grades SET score = ?, feedback = ?, graded_by = ?, released_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [score, feedback || null, teacherId, existingGrade.id]
    );
  } else {
    const id = `grd_${Date.now()}`;
    await run(
      `INSERT INTO grades (id, submission_id, graded_by, score, feedback)
       VALUES (?, ?, ?, ?, ?)`,
      [id, submissionId, teacherId, score, feedback || null]
    );
  }

  await run(`UPDATE submissions SET status = 'graded' WHERE id = ?`, [submissionId]);

  // In-app notification to student
  await run(
    `INSERT INTO notifications (id, recipient_id, type, title, message, link)
     VALUES (?, ?, 'grade_released', ?, ?, ?)`,
    [`notif_${Date.now()}_${submission.student_id}`, submission.student_id, 'Assignment Grade Released', `Your submission for "${submission.assignment_title}" has been graded: ${score}/${submission.max_score}`, `/student/assignments/${submission.assignment_id}`]
  );

  res.json({
    success: true,
    message: 'Grade and feedback recorded successfully',
    data: { score, feedback },
  });
}

export async function getStudentGrades(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  const grades = await query<any>(`
    SELECT g.*, a.title as assignment_title, a.max_score, c.title as course_title,
           p.full_name as graded_by_name
    FROM grades g
    JOIN submissions s ON g.submission_id = s.id
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    LEFT JOIN profiles p ON g.graded_by = p.id
    WHERE s.student_id = ?
    ORDER BY g.released_at DESC
  `, [studentId]);

  res.json({
    success: true,
    data: grades,
  });
}

export async function getGradebook(req: AuthRequest, res: Response): Promise<void> {
  const { course_id } = req.query;

  let sql = `
    SELECT s.id as submission_id, s.submitted_at, s.status, s.content, s.file_url,
           a.id as assignment_id, a.title as assignment_title, a.max_score,
           c.id as course_id, c.title as course_title,
           p.id as student_id, p.full_name as student_name, p.student_id as student_code, p.avatar_url,
           g.score, g.feedback, g.released_at
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    JOIN profiles p ON s.student_id = p.id
    LEFT JOIN grades g ON s.id = g.submission_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.user?.role === 'teacher') {
    sql += ` AND c.id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?)`;
    params.push(req.user.id);
  }

  if (course_id) {
    sql += ` AND c.id = ?`;
    params.push(course_id);
  }

  sql += ` ORDER BY s.submitted_at DESC`;

  const rows = await query(sql, params);
  res.json({
    success: true,
    data: rows,
  });
}
