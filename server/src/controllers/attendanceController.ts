import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function createAttendanceSession(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { session_date, title, present_minutes, late_minutes, is_live, records } = req.body;
  const teacherId = req.user!.id;

  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      `SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?
       UNION
       SELECT created_by as teacher_id FROM courses WHERE id = ? AND created_by = ?`,
      [courseId, teacherId, courseId, teacherId]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to record attendance for this course' });
      return;
    }
  }

  const course = await getOne<{ id: string; title: string }>('SELECT id, title FROM courses WHERE id = ?', [courseId]);
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  const sessionId = `att_${Date.now()}`;
  const now = Date.now();
  const isLiveSession = Boolean(is_live);

  let presentUntil: string | null = null;
  let lateUntil: string | null = null;
  const status = isLiveSession ? 'active' : 'completed';

  if (isLiveSession) {
    const presMin = Number(present_minutes) || 5;
    const lateMin = Number(late_minutes) || 5;
    presentUntil = new Date(now + presMin * 60000).toISOString();
    lateUntil = new Date(now + (presMin + lateMin) * 60000).toISOString();
  }

  await run(
    `INSERT INTO attendance_sessions (id, course_id, session_date, created_by, title, status, present_until, late_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, courseId, session_date, teacherId, title || `Class Session ${session_date}`, status, presentUntil, lateUntil]
  );

  // Fetch all enrolled students
  const enrolledStudents = await query<{ student_id: string }>(
    `SELECT student_id FROM enrollments WHERE course_id = ? AND status = 'active'`,
    [courseId]
  );

  if (isLiveSession) {
    for (const st of enrolledStudents) {
      const recId = `rec_${Date.now()}_${st.student_id}`;
      await run(
        `INSERT INTO attendance_records (id, session_id, student_id, status, marked_by)
         VALUES (?, ?, ?, 'absent', ?)
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
        [recId, sessionId, st.student_id, teacherId]
      );

      // Send live attendance notification
      await run(
        `INSERT INTO notifications (id, recipient_id, type, title, message, link)
         VALUES (?, ?, 'attendance', ?, ?, ?)`,
        [
          `notif_${Date.now()}_${st.student_id}`,
          st.student_id,
          'Live Attendance Open!',
          `Attendance check-in is now live for "${course.title}". Check in before the timer expires!`,
          '/student/attendance'
        ]
      );
    }
  } else if (Array.isArray(records)) {
    for (const r of records) {
      const recId = `rec_${Date.now()}_${r.student_id}`;
      await run(
        `INSERT INTO attendance_records (id, session_id, student_id, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
        [recId, sessionId, r.student_id, r.status, teacherId]
      );
    }
  }

  res.status(201).json({
    success: true,
    message: isLiveSession ? 'Live attendance session launched successfully' : 'Attendance recorded successfully',
    data: {
      id: sessionId,
      status,
      present_until: presentUntil,
      late_until: lateUntil,
    },
  });
}

export async function getCourseAttendance(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const sessions = await query<any>(`
    SELECT s.*,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'present') AS INTEGER) as present_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'late') AS INTEGER) as late_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'absent') AS INTEGER) as absent_count,
           CAST((SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) AS INTEGER) as total_marked
    FROM attendance_sessions s
    WHERE s.course_id = ?
    ORDER BY s.session_date DESC, s.created_at DESC
  `, [courseId]);

  // Enrolled students in roll-wise order
  const students = await query<any>(`
    SELECT p.id, p.full_name, p.student_id as student_code, p.email, p.avatar_url, p.department
    FROM enrollments e
    JOIN profiles p ON e.student_id = p.id
    WHERE e.course_id = ? AND e.status = 'active'
    ORDER BY p.student_id ASC, p.full_name ASC
  `, [courseId]);

  // All attendance records for this course sessions
  const records = await query<any>(`
    SELECT ar.session_id, ar.student_id, ar.status, ar.created_at
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    WHERE s.course_id = ?
  `, [courseId]);

  res.json({
    success: true,
    data: {
      sessions,
      students,
      records,
    },
  });
}

export async function updateAttendanceSession(req: AuthRequest, res: Response): Promise<void> {
  const { sessionId } = req.params;
  const { records, status } = req.body;
  const teacherId = req.user!.id;

  const session = await getOne<any>('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
  if (!session) {
    res.status(404).json({ success: false, message: 'Attendance session not found' });
    return;
  }

  if (status) {
    await run('UPDATE attendance_sessions SET status = ? WHERE id = ?', [status, sessionId]);
  }

  if (Array.isArray(records)) {
    for (const r of records) {
      const recId = `rec_${Date.now()}_${r.student_id}`;
      await run(
        `INSERT INTO attendance_records (id, session_id, student_id, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
        [recId, sessionId, r.student_id, r.status, teacherId]
      );
    }
  }

  res.json({
    success: true,
    message: 'Attendance session updated successfully',
  });
}

export async function studentCheckIn(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;
  const { session_id } = req.body;

  if (!session_id) {
    res.status(400).json({ success: false, message: 'Session ID is required' });
    return;
  }

  const session = await getOne<any>('SELECT * FROM attendance_sessions WHERE id = ?', [session_id]);
  if (!session) {
    res.status(404).json({ success: false, message: 'Attendance session not found' });
    return;
  }

  const enrollment = await getOne<{ id: string }>(
    `SELECT id FROM enrollments WHERE course_id = ? AND student_id = ? AND status = 'active'`,
    [session.course_id, studentId]
  );
  if (!enrollment) {
    res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    return;
  }

  if (session.status !== 'active') {
    res.status(400).json({ success: false, message: 'This attendance session is no longer active' });
    return;
  }

  const now = Date.now();
  const presentDeadline = session.present_until ? new Date(session.present_until).getTime() : 0;
  const lateDeadline = session.late_until ? new Date(session.late_until).getTime() : 0;

  let attendanceStatus: 'present' | 'late' | 'absent' = 'present';

  if (presentDeadline && now <= presentDeadline) {
    attendanceStatus = 'present';
  } else if (lateDeadline && now <= lateDeadline) {
    attendanceStatus = 'late';
  } else {
    await run(
      `INSERT INTO attendance_records (id, session_id, student_id, status, marked_by)
       VALUES (?, ?, ?, 'absent', ?)
       ON CONFLICT (session_id, student_id)
       DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
      [`rec_${Date.now()}_${studentId}`, session_id, studentId, session.created_by]
    );
    res.status(400).json({
      success: false,
      message: 'The attendance window has closed. You have been marked absent for this session.',
    });
    return;
  }

  const recId = `rec_${Date.now()}_${studentId}`;
  await run(
    `INSERT INTO attendance_records (id, session_id, student_id, status, marked_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (session_id, student_id)
     DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
    [recId, session_id, studentId, attendanceStatus, studentId]
  );

  res.json({
    success: true,
    message: attendanceStatus === 'present'
      ? 'Checked in successfully! You are marked PRESENT.'
      : 'Checked in during late window. You are marked LATE.',
    data: {
      status: attendanceStatus,
      session_id,
    },
  });
}

export async function getMyActiveAttendanceSessions(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  const activeSessions = await query<any>(`
    SELECT s.id, s.course_id, s.session_date, s.title, s.status, s.present_until, s.late_until,
           c.title as course_title,
           ar.status as my_status
    FROM attendance_sessions s
    JOIN courses c ON s.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    LEFT JOIN attendance_records ar ON s.id = ar.session_id AND ar.student_id = ?
    WHERE e.student_id = ? AND e.status = 'active' AND s.status = 'active'
    ORDER BY s.created_at DESC
  `, [studentId, studentId]);

  res.json({
    success: true,
    data: activeSessions,
  });
}

function formatDateToYMD(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val);
  if (str.includes('T')) {
    const dObj = new Date(str);
    if (!isNaN(dObj.getTime())) {
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const d = String(dObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return str.split('T')[0];
  }
  return str.slice(0, 10);
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

  const sanitizedRecords = records.map(r => ({
    ...r,
    session_date: formatDateToYMD(r.session_date),
  }));

  const total = sanitizedRecords.length;
  const present = sanitizedRecords.filter(r => r.status === 'present').length;
  const late = sanitizedRecords.filter(r => r.status === 'late').length;
  const absent = sanitizedRecords.filter(r => r.status === 'absent').length;

  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  const dayMap: Record<string, string> = {};
  const dayDetails: Record<string, {
    date: string;
    status: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalClasses: number;
    sessions: Array<{
      courseTitle: string;
      courseId: string;
      sessionTitle: string;
      status: string;
    }>;
  }> = {};

  for (const r of sanitizedRecords) {
    const dStr = r.session_date;
    if (!dStr) continue;

    if (!dayDetails[dStr]) {
      dayDetails[dStr] = {
        date: dStr,
        status: 'none',
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        totalClasses: 0,
        sessions: [],
      };
    }

    const day = dayDetails[dStr];
    day.totalClasses += 1;
    if (r.status === 'present') day.presentCount += 1;
    else if (r.status === 'late') day.lateCount += 1;
    else if (r.status === 'absent') day.absentCount += 1;

    day.sessions.push({
      courseTitle: r.course_title,
      courseId: r.course_id,
      sessionTitle: r.session_title,
      status: r.status,
    });
  }

  for (const dStr of Object.keys(dayDetails)) {
    const day = dayDetails[dStr];
    if (day.totalClasses === 0) {
      day.status = 'none';
    } else if (day.presentCount === day.totalClasses) {
      day.status = 'present';
    } else if (day.absentCount === day.totalClasses) {
      day.status = 'absent';
    } else if (day.lateCount === day.totalClasses) {
      day.status = 'late';
    } else if (day.presentCount > day.absentCount) {
      day.status = 'present_leaning';
    } else if (day.absentCount > day.presentCount) {
      day.status = 'absent_leaning';
    } else {
      day.status = 'balanced';
    }
    dayMap[dStr] = day.status;
  }

  res.json({
    success: true,
    data: {
      total_sessions: total,
      present_count: present,
      late_count: late,
      absent_count: absent,
      percentage,
      records: sanitizedRecords,
      day_map: dayMap,
      day_details: dayDetails,
    },
  });
}

