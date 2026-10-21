import { Response } from 'express';
import { query, run, getOne } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function listComments(req: AuthRequest, res: Response): Promise<void> {
  const { course_id, assignment_id, quiz_id } = req.query;

  let sql = `
    SELECT c.*, p.full_name as author_name, p.role as author_role, p.avatar_url as author_avatar
    FROM comments c
    JOIN profiles p ON c.author_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (course_id) {
    sql += ' AND c.course_id = ?';
    params.push(course_id);
  }
  if (assignment_id) {
    sql += ' AND c.assignment_id = ?';
    params.push(assignment_id);
  }
  if (quiz_id) {
    sql += ' AND c.quiz_id = ?';
    params.push(quiz_id);
  }

  sql += ' ORDER BY c.created_at ASC';

  const comments = await query(sql, params);
  res.json({
    success: true,
    data: comments,
  });
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { course_id, assignment_id, quiz_id, parent_id, body } = req.body;
  const authorId = req.user!.id;

  const id = `cmt_${Date.now()}`;
  await run(
    `INSERT INTO comments (id, course_id, assignment_id, quiz_id, parent_id, author_id, body)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, course_id || null, assignment_id || null, quiz_id || null, parent_id || null, authorId, body]
  );

  const created = await getOne<any>(`
    SELECT c.*, p.full_name as author_name, p.role as author_role, p.avatar_url as author_avatar
    FROM comments c
    JOIN profiles p ON c.author_id = p.id
    WHERE c.id = ?
  `, [id]);

  res.status(201).json({
    success: true,
    message: 'Comment posted',
    data: created,
  });
}
