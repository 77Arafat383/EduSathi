import { Response } from 'express';
import { query, run, getOne } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listSubjects(req: AuthRequest, res: Response): Promise<void> {
  const subjects = await query<any>(`
    SELECT s.*, (SELECT COUNT(*) FROM courses WHERE subject_id = s.id) as course_count
    FROM subjects s
    ORDER BY s.name ASC
  `);

  res.json({
    success: true,
    data: subjects,
  });
}

export async function createSubject(req: AuthRequest, res: Response): Promise<void> {
  const { name, code, description } = req.body;

  const existing = await getOne<{ id: string }>('SELECT id FROM subjects WHERE code = ?', [code]);
  if (existing) {
    res.status(409).json({ success: false, message: 'Subject code already exists' });
    return;
  }

  const id = `subj_${Date.now()}`;
  await run(
    `INSERT INTO subjects (id, name, code, description, status) VALUES (?, ?, ?, ?, 'active')`,
    [id, name, code, description || null]
  );

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: { id, name, code },
  });
}
