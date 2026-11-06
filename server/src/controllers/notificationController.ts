import { Response } from 'express';
import { query, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

// Permitted notification categories for administrators (salary requests, payments, and system governance)
// Other classroom/course-level notifications are strictly ignored for administrators.
const ADMIN_ALLOWED_TYPES = [
  'salary_request',
  'new_payment',
  'payment_received',
  'student_payment',
  'salary_disbursed',
  'admin_alert',
  'system_alert'
];

// Permitted notification categories for teachers (student submissions, salary disbursements, discussions, teacher alerts)
// Irrelevant administrative payment clearing, student quiz score notifications for other students, etc. are ignored for teachers.
const TEACHER_ALLOWED_TYPES = [
  'submission',
  'assignment_submitted',
  'salary_disbursed',
  'salary_request',
  'comment',
  'doubt',
  'teacher_alert',
  'faculty_alert',
  'system_alert',
  'enrollment'
];

export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const isTeacher = req.user!.role === 'teacher';

  let sql = 'SELECT * FROM notifications WHERE recipient_id = ?';
  const params: any[] = [userId];

  if (isAdmin) {
    sql += ` AND type IN (${ADMIN_ALLOWED_TYPES.map(() => '?').join(',')})`;
    params.push(...ADMIN_ALLOWED_TYPES);
  } else if (isTeacher) {
    sql += ` AND type IN (${TEACHER_ALLOWED_TYPES.map(() => '?').join(',')})`;
    params.push(...TEACHER_ALLOWED_TYPES);
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const notifications = await query<any>(sql, params);

  res.json({
    success: true,
    data: notifications,
  });
}

export async function markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
  const { notificationId } = req.params;
  const userId = req.user!.id;

  await run(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_id = ?',
    [notificationId, userId]
  );

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'admin';
  const isTeacher = req.user!.role === 'teacher';

  let sql = 'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND read_at IS NULL';
  const params: any[] = [userId];

  if (isAdmin) {
    sql += ` AND type IN (${ADMIN_ALLOWED_TYPES.map(() => '?').join(',')})`;
    params.push(...ADMIN_ALLOWED_TYPES);
  } else if (isTeacher) {
    sql += ` AND type IN (${TEACHER_ALLOWED_TYPES.map(() => '?').join(',')})`;
    params.push(...TEACHER_ALLOWED_TYPES);
  }

  await run(sql, params);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}
