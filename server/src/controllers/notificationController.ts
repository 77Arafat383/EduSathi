import { Response } from 'express';
import { query, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const notifications = await query<any>(
    'SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );

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

  await run(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND read_at IS NULL',
    [userId]
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}
