import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { getOne, run, query } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await getOne<{
    id: string;
    full_name: string;
    email: string;
    password_hash: string;
    role: 'student' | 'teacher' | 'admin';
    status: string;
    avatar_url: string;
    student_id: string;
    department: string;
  }>('SELECT * FROM profiles WHERE email = ?', [email.toLowerCase().trim()]);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      message: 'Account is deactivated. Please contact an administrator.',
      code: 'ACCOUNT_DEACTIVATED',
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
    });
    return;
  }

  const signOptions: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    signOptions
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        student_id: user.student_id,
        department: user.department,
      },
    },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { full_name, email, password, student_id, department } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const existing = await getOne<{ id: string }>('SELECT id FROM profiles WHERE email = ?', [cleanEmail]);
  if (existing) {
    res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
      code: 'EMAIL_EXISTS',
    });
    return;
  }

  const id = `usr_std_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Enforce Student role for public registrations - prevent privilege escalation
  const role = 'student';
  const status = 'active';

  if (student_id && String(student_id).trim()) {
    const cleanStudentId = String(student_id).trim();
    const existingStudent = await getOne<{ id: string }>(
      'SELECT id FROM profiles WHERE role = ? AND LOWER(student_id) = LOWER(?)',
      ['student', cleanStudentId]
    );
    if (existingStudent) {
      res.status(409).json({
        success: false,
        message: `Student ID "${cleanStudentId}" is already assigned to another student.`,
        code: 'STUDENT_ID_EXISTS',
      });
      return;
    }
  }

  const defaultNeutralAvatar =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="%23F1F5F9"/><circle cx="64" cy="48" r="22" fill="%2364748B"/><path d="M26 108c0-20.987 17.013-38 38-38s38 17.013 38 38v4H26v-4z" fill="%2364748B"/></svg>';

  await run(
    `INSERT INTO profiles (id, full_name, email, password_hash, role, status, avatar_url, student_id, department)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, full_name, cleanEmail, passwordHash, role, status, defaultNeutralAvatar, student_id ? String(student_id).trim() : null, department || null]
  );

  const signOptions: SignOptions = { expiresIn: config.jwtExpiresIn as any };
  const token = jwt.sign(
    { id, email: cleanEmail, role },
    config.jwtSecret,
    signOptions
  );

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: {
        id,
        full_name,
        email: cleanEmail,
        role,
        student_id,
        department,
      },
    },
  });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const profile = await getOne<any>(
    'SELECT id, full_name, email, role, status, avatar_url, student_id, department, created_at FROM profiles WHERE id = ?',
    [req.user.id]
  );

  if (!profile) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Get unread notification count
  const isAdmin = req.user.role === 'admin';
  const isTeacher = req.user.role === 'teacher';
  let unreadSql = 'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND read_at IS NULL';
  if (isAdmin) {
    unreadSql += ` AND type IN ('salary_request', 'new_payment', 'payment_received', 'student_payment', 'salary_disbursed', 'admin_alert', 'system_alert')`;
  } else if (isTeacher) {
    unreadSql += ` AND type IN ('submission', 'assignment_submitted', 'salary_disbursed', 'salary_request', 'comment', 'doubt', 'teacher_alert', 'faculty_alert', 'system_alert', 'enrollment')`;
  }

  const unreadCountRow = await getOne<{ count: number }>(unreadSql, [req.user.id]);

  res.json({
    success: true,
    data: {
      ...profile,
      unread_notifications: unreadCountRow ? unreadCountRow.count : 0,
    },
  });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { full_name, avatar_url, department, student_id, email, current_password, new_password } = req.body;

  // 1. Email update
  if (email && typeof email === 'string') {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }
    const existing = await getOne<{ id: string }>(
      'SELECT id FROM profiles WHERE email = ? AND id != ?',
      [cleanEmail, req.user.id]
    );
    if (existing) {
      res.status(409).json({ success: false, message: 'Email is already registered with another account' });
      return;
    }
    await run('UPDATE profiles SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cleanEmail, req.user.id]);
  }

  // 2. Password update
  if (new_password && typeof new_password === 'string') {
    if (new_password.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      return;
    }

    const currentRecord = await getOne<{ password_hash: string }>(
      'SELECT password_hash FROM profiles WHERE id = ?',
      [req.user.id]
    );
    if (!currentRecord) {
      res.status(404).json({ success: false, message: 'User record not found' });
      return;
    }

    if (current_password) {
      const match = await bcrypt.compare(current_password, currentRecord.password_hash);
      if (!match) {
        res.status(400).json({ success: false, message: 'Current password is incorrect' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await run('UPDATE profiles SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, req.user.id]);
  }

  // 3. Name, Avatar & metadata update
  if (full_name !== undefined || avatar_url !== undefined || department !== undefined || student_id !== undefined) {
    await run(
      `UPDATE profiles SET full_name = COALESCE(?, full_name),
                           avatar_url = COALESCE(?, avatar_url),
                           department = COALESCE(?, department),
                           student_id = COALESCE(?, student_id),
                           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name ?? null, avatar_url ?? null, department ?? null, student_id ?? null, req.user.id]
    );
  }

  const updated = await getOne<any>(
    'SELECT id, full_name, email, role, status, avatar_url, student_id, department FROM profiles WHERE id = ?',
    [req.user.id]
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updated,
  });
}

export function logout(req: Request, res: Response): void {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}
