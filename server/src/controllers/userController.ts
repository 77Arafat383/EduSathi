import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export const DEFAULT_NEUTRAL_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="%23F1F5F9"/><circle cx="64" cy="48" r="22" fill="%2364748B"/><path d="M26 108c0-20.987 17.013-38 38-38s38 17.013 38 38v4H26v-4z" fill="%2364748B"/></svg>';

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const { role, status, search } = req.query;

  let sql = `
    SELECT p.id, p.full_name, p.email, p.role, p.status, p.avatar_url, p.student_id, p.department, p.created_at,
           (SELECT COUNT(*) FROM course_teachers WHERE teacher_id = p.id) as assigned_courses_count,
           (SELECT COUNT(*) FROM enrollments WHERE student_id = p.id AND status = 'active') as enrolled_courses_count,
           (SELECT COALESCE(SUM(amount), 0) FROM teacher_salaries WHERE teacher_id = p.id AND status = 'paid') as total_salary_paid,
           (SELECT COALESCE(SUM(due_amount), 0) FROM student_payments WHERE student_id = p.id AND status != 'paid') as total_due_amount,
           (SELECT COALESCE(SUM(paid_amount), 0) FROM student_payments WHERE student_id = p.id) as total_tuition_paid,
           (SELECT COALESCE(SUM(total_amount), 0) FROM student_payments WHERE student_id = p.id) as total_tuition_invoiced
    FROM profiles p
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role) {
    sql += ' AND p.role = ?';
    params.push(role);
  }

  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (p.full_name LIKE ? OR p.email LIKE ? OR p.student_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY p.created_at DESC';

  const users = await query(sql, params);
  res.json({
    success: true,
    data: users,
  });
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const { full_name, email, password, role, student_id, department, avatar_url } = req.body;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role specified' });
    return;
  }

  // If creating a student user, require unique student_id
  if (role === 'student') {
    if (!student_id || !String(student_id).trim()) {
      res.status(400).json({
        success: false,
        message: 'Student ID is required when adding a student.',
      });
      return;
    }

    const cleanStudentId = String(student_id).trim();
    const existingStudent = await getOne<{ id: string; full_name: string }>(
      'SELECT id, full_name FROM profiles WHERE role = ? AND LOWER(student_id) = LOWER(?)',
      ['student', cleanStudentId]
    );

    if (existingStudent) {
      res.status(409).json({
        success: false,
        message: `Student ID "${cleanStudentId}" is already assigned to ${existingStudent.full_name}. A student must maintain a unique ID.`,
      });
      return;
    }
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await getOne<{ id: string }>('SELECT id FROM profiles WHERE email = ?', [cleanEmail]);
  if (existing) {
    res.status(409).json({ success: false, message: 'Email is already registered' });
    return;
  }

  const id = `usr_${role}_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password || 'EduSathi@2026', 10);
  const userAvatar = avatar_url || DEFAULT_NEUTRAL_AVATAR;
  const cleanStudentId = role === 'student' ? String(student_id).trim() : (student_id || null);

  await run(
    `INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    [id, full_name, cleanEmail, passwordHash, role, userAvatar, cleanStudentId, department || null]
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { id, full_name, email: cleanEmail, role, avatar_url: userAvatar, student_id: cleanStudentId, department },
  });
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { full_name, role, status, department, student_id } = req.body;

  const user = await getOne<{ id: string; role: string }>('SELECT id, role FROM profiles WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Prevent self-lockout or deactivation
  if (req.user?.id === id && status === 'inactive') {
    res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    return;
  }

  const targetRole = role || user.role;
  if (targetRole === 'student' && student_id) {
    const cleanStudentId = String(student_id).trim();
    const existingStudent = await getOne<{ id: string }>(
      'SELECT id FROM profiles WHERE role = ? AND LOWER(student_id) = LOWER(?) AND id != ?',
      ['student', cleanStudentId, id]
    );
    if (existingStudent) {
      res.status(409).json({
        success: false,
        message: `Student ID "${cleanStudentId}" is already assigned to another student.`,
      });
      return;
    }
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
    [full_name, role, status, department, student_id ? String(student_id).trim() : student_id, id]
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
