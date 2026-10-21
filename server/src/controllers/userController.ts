import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const { role, status, search } = req.query;

  let sql = 'SELECT id, full_name, email, role, status, avatar_url, student_id, department, created_at FROM profiles WHERE 1=1';
  const params: any[] = [];

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (full_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const users = await query(sql, params);
  res.json({
    success: true,
    data: users,
  });
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const { full_name, email, password, role, student_id, department } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role specified' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await getOne<{ id: string }>('SELECT id FROM profiles WHERE email = ?', [cleanEmail]);
  if (existing) {
    res.status(409).json({ success: false, message: 'Email is already registered' });
    return;
  }

  const id = `usr_${role}_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password || 'EduSathi@2026', 10);

  await run(
    `INSERT INTO profiles (id, full_name, email, password_hash, role, status, student_id, department)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
    [id, full_name, cleanEmail, passwordHash, role, student_id || null, department || null]
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { id, full_name, email: cleanEmail, role, student_id, department },
  });
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { full_name, role, status, department, student_id } = req.body;

  const user = await getOne<{ id: string }>('SELECT id FROM profiles WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Prevent self-lockout or deactivation
  if (req.user?.id === id && status === 'inactive') {
    res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    return;
  }

  await run(
    `UPDATE profiles SET
       full_name = COALESCE(?, full_name),
       role = COALESCE(?, role),
       status = COALESCE(?, status),
       department = COALESCE(?, department),
       student_id = COALESCE(?, student_id),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [full_name, role, status, department, student_id, id]
  );

  const updated = await getOne<any>(
    'SELECT id, full_name, email, role, status, avatar_url, student_id, department FROM profiles WHERE id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updated,
  });
}
