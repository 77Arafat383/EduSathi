import { Response } from 'express';
import { query, run, getOne } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listAnnouncements(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const announcements = await query<any>(`
    SELECT a.*, p.full_name as author_name, p.avatar_url as author_avatar
    FROM announcements a
    LEFT JOIN profiles p ON a.author_id = p.id
    WHERE a.course_id = ?
    ORDER BY a.published_at DESC
  `, [courseId]);

  res.json({
    success: true,
    data: announcements,
  });
}

export async function createAnnouncement(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { title, body } = req.body;
  const authorId = req.user!.id;

  const course = await getOne<{ title: string }>('SELECT title FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const id = `anc_${Date.now()}`;
  await run(
    `INSERT INTO announcements (id, course_id, author_id, title, body)
     VALUES (?, ?, ?, ?, ?)`,
    [id, courseId, authorId, title, body]
  );

  // Send notifications to all enrolled students
  const students = await query<{ student_id: string }>(
    `SELECT student_id FROM enrollments WHERE course_id = ? AND status = 'active'`,
    [courseId]
  );

  for (const s of students) {
    await run(
      `INSERT INTO notifications (id, recipient_id, type, title, message, link)
       VALUES (?, ?, 'announcement', ?, ?, ?)`,
      [`notif_${Date.now()}_${s.student_id}`, s.student_id, `Announcement in ${course.title}`, title, `/student/courses/${courseId}`]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Announcement published successfully',
    data: { id, title },
  });
}
