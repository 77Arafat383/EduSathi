import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function createAttendanceSession(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { session_date, title, records } = req.body;
  const teacherId = req.user!.id;

  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
      [courseId, teacherId]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to record attendance for this course' });
      return;
    }
  }

  const sessionId = `att_${Date.now()}`;
  await run(
    `INSERT INTO attendance_sessions (id, course_id, session_date, created_by, title)
     VALUES (?, ?, ?, ?, ?)`,
    [sessionId, courseId, session_date, teacherId, title || `Class Session ${session_date}`]
  );

  // Insert records
  if (Array.isArray(records)) {
    for (const r of records) {
      const recId = `rec_${Date.now()}_${r.student_id}`;
      await run(
        `INSERT OR REPLACE INTO attendance_records (id, session_id, student_id, status, marked_by)
         VALUES (?, ?, ?, ?, ?)`,
        [recId, sessionId, r.student_id, r.status, teacherId]
      );
    }
  }

  res.status(201).json({
    success: true,
    message: 'Attendance recorded successfully',
    data: { id: sessionId },
  });
}

export async function getCourseAttendance(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const sessions = await query<any>(`
    SELECT s.*,
           (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'present') as present_count,
           (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'late') as late_count,
           (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'absent') as absent_count,
           (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) as total_marked
    FROM attendance_sessions s
    WHERE s.course_id = ?
    ORDER BY s.session_date DESC
  `, [courseId]);

  // Also get enrolled students list for the teacher attendance sheet
  const students = await query<any>(`
    SELECT p.id, p.full_name, p.student_id as student_code, p.email, p.avatar_url
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    WHERE e.course_id = ? AND e.status = 'active'
    ORDER BY p.full_name ASC
  `, [courseId]);

  res.json({
    success: true,
    data: {
      sessions,
      students,
    },
  });
}

export async function getMyAttendance(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  const records = await query<any>(`
    SELECT ar.id, ar.status, s.session_date, s.title as session_title, c.title as course_title, c.id as course_id
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    JOIN courses c ON s.course_id = c.id
    WHERE ar.student_id = ?
    ORDER BY s.session_date DESC
  `, [studentId]);

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;

  // Standard formula: Present counts as 1.0, Late counts as 0.5 or 1.0 (counted as attended with flag)
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  // Day-by-day map for attendance heatmap grid (YYYY-MM-DD -> status)
  const dayMap: Record<string, string> = {};
  for (const r of records) {
    dayMap[r.session_date] = r.status;
  }

  res.json({
    success: true,
    data: {
      total_sessions: total,
      present_count: present,
      late_count: late,
      absent_count: absent,
      percentage,
      records,
      day_map: dayMap,
    },
  });
}
