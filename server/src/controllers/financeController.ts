import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

// --- 1. Teacher Salaries Management ---

export async function listTeacherSalaries(req: AuthRequest, res: Response): Promise<void> {
  const { teacher_id, pay_period, status, search } = req.query;

  let sql = `
    SELECT s.*, p.full_name as teacher_name, p.email as teacher_email,
           p.avatar_url as teacher_avatar, p.department as teacher_department,
           c.title as course_title, s2.name as subject_name, s2.code as subject_code
    FROM teacher_salaries s
    JOIN profiles p ON s.teacher_id = p.id
    LEFT JOIN courses c ON s.course_id = c.id
    LEFT JOIN subjects s2 ON c.subject_id = s2.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (teacher_id) {
    sql += ' AND s.teacher_id = ?';
    params.push(teacher_id);
  }

  if (pay_period) {
    sql += ' AND s.pay_period = ?';
    params.push(pay_period);
  }

  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (p.full_name LIKE ? OR p.email LIKE ? OR s.transaction_ref LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY s.payment_date DESC, s.created_at DESC';

  const salaries = await query(sql, params);
  res.json({ success: true, data: salaries });
}

export async function getTeacherSalariesSummary(req: AuthRequest, res: Response): Promise<void> {
  const summary = await getOne<any>(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_disbursed,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_disbursements,
      COUNT(DISTINCT teacher_id) as faculty_on_payroll,
      COUNT(id) as total_payout_records
    FROM teacher_salaries
  `);

  res.json({ success: true, data: summary });
}

export async function recordTeacherSalary(req: AuthRequest, res: Response): Promise<void> {
  const { teacher_id, course_id, amount, pay_period, payment_date, payment_method, transaction_ref, status, note } = req.body;

  if (!teacher_id || !amount || !pay_period) {
    res.status(400).json({ success: false, message: 'Teacher ID, amount, and pay period are required' });
    return;
  }

  const teacher = await getOne<{ id: string; role: string }>('SELECT id, role FROM profiles WHERE id = ?', [teacher_id]);
  if (!teacher || teacher.role !== 'teacher') {
    res.status(404).json({ success: false, message: 'Teacher profile not found' });
    return;
  }

  const id = `sal_${Date.now()}`;
  const pDate = payment_date || new Date().toISOString().split('T')[0];
  const pMethod = payment_method || 'Bank Transfer';
  const pStatus = status || 'paid';
  const txRef = transaction_ref || `TRX-${Date.now().toString().slice(-6)}`;

  await run(
    `INSERT INTO teacher_salaries (id, teacher_id, course_id, amount, payment_date, pay_period, payment_method, transaction_ref, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, teacher_id, course_id || null, Number(amount), pDate, pay_period, pMethod, txRef, pStatus, note || null]
  );

  res.status(201).json({
    success: true,
    message: 'Teacher salary disbursement recorded successfully',
    data: { id, transaction_ref: txRef },
  });
}

export async function getTeacherFinanceDetails(req: AuthRequest, res: Response): Promise<void> {
  const { teacherId } = req.params;

  const teacher = await getOne<any>(
    "SELECT id, full_name, email, avatar_url, department, status, created_at FROM profiles WHERE id = ? AND role = 'teacher'",
    [teacherId]
  );

  if (!teacher) {
    res.status(404).json({ success: false, message: 'Teacher not found' });
    return;
  }

  // Assigned courses with student count
  const assignedCourses = await query<any>(`
    SELECT c.id, c.title, c.description, c.status, c.banner_url, s.name as subject_name, s.code as subject_code,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count
    FROM courses c
    JOIN course_teachers ct ON c.id = ct.course_id
    LEFT JOIN subjects s ON c.subject_id = s.id
    WHERE ct.teacher_id = ?
    ORDER BY c.created_at DESC
  `, [teacherId]);

  // Salary disbursements history
  const salaries = await query<any>(
    'SELECT * FROM teacher_salaries WHERE teacher_id = ? ORDER BY payment_date DESC, created_at DESC',
    [teacherId]
  );

  const totalPaid = salaries
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  res.json({
    success: true,
    data: {
      profile: teacher,
      teacher,
      assigned_courses: assignedCourses,
      salary_history: salaries,
      salaries,
      total_salary_paid: totalPaid,
      salary_summary: {
        total_paid_ytd: totalPaid,
        disbursements_count: salaries.length,
      },
    },
  });
}

// --- 2. Student Payments & Dues Management ---

export async function listStudentPayments(req: AuthRequest, res: Response): Promise<void> {
  const { student_id, status, has_due, search } = req.query;

  let sql = `
    SELECT sp.*, p.full_name as student_name, p.email as student_email,
           p.student_id as student_identifier, p.avatar_url as student_avatar,
           p.department as student_department,
           c.title as course_title
    FROM student_payments sp
    JOIN profiles p ON sp.student_id = p.id
    LEFT JOIN courses c ON sp.course_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (student_id) {
    sql += ' AND sp.student_id = ?';
    params.push(student_id);
  }

  if (status) {
    sql += ' AND sp.status = ?';
    params.push(status);
  }

  if (has_due === 'true') {
    sql += ' AND sp.due_amount > 0';
  }

  if (search) {
    sql += ' AND (p.full_name LIKE ? OR p.email LIKE ? OR p.student_id LIKE ? OR sp.transaction_ref LIKE ? OR sp.title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY sp.created_at DESC';

  const payments = await query(sql, params);
  res.json({ success: true, data: payments });
}

export async function getStudentPaymentsSummary(req: AuthRequest, res: Response): Promise<void> {
  const summary = await getOne<any>(`
    SELECT
      COALESCE(SUM(total_amount), 0) as total_invoiced,
      COALESCE(SUM(paid_amount), 0) as total_collected,
      COALESCE(SUM(due_amount), 0) as total_outstanding_due,
      COUNT(CASE WHEN due_amount > 0 THEN 1 END) as pending_dues_count,
      COUNT(DISTINCT student_id) as total_students_billed
    FROM student_payments
  `);

  res.json({ success: true, data: summary });
}

export async function recordStudentPayment(req: AuthRequest, res: Response): Promise<void> {
  const { student_id, course_id, title, total_amount, paid_amount, due_date, payment_method, transaction_ref, note } = req.body;

  if (!student_id || !title || total_amount === undefined) {
    res.status(400).json({ success: false, message: 'Student ID, title, and total amount are required' });
    return;
  }

  const student = await getOne<{ id: string; role: string }>('SELECT id, role FROM profiles WHERE id = ?', [student_id]);
  if (!student || student.role !== 'student') {
    res.status(404).json({ success: false, message: 'Student profile not found' });
    return;
  }

  const total = Number(total_amount);
  const paid = Number(paid_amount || 0);
  const due = Math.max(0, total - paid);

  let status = 'due';
  if (paid >= total) {
    status = 'paid';
  } else if (paid > 0) {
    status = 'partial';
  }

  const id = `pay_${Date.now()}`;
  const txRef = transaction_ref || `INV-${Date.now().toString().slice(-6)}`;
  const pDate = paid > 0 ? new Date().toISOString() : null;

  await run(
    `INSERT INTO student_payments (id, student_id, course_id, title, total_amount, paid_amount, due_amount, payment_date, due_date, payment_method, transaction_ref, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, student_id, course_id || null, title, total, paid, due, pDate, due_date || null, payment_method || 'Bank Transfer', txRef, status, note || null]
  );

  res.status(201).json({
    success: true,
    message: 'Student tuition/payment record created successfully',
    data: { id, transaction_ref: txRef, due_amount: due },
  });
}

export async function settleStudentPayment(req: AuthRequest, res: Response): Promise<void> {
  const { paymentId } = req.params;
  const { additional_paid, payment_method, transaction_ref } = req.body;

  const existing = await getOne<any>('SELECT * FROM student_payments WHERE id = ?', [paymentId]);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Payment record not found' });
    return;
  }

  const addPay = Number(additional_paid || 0);
  const newPaid = Number(existing.paid_amount) + addPay;
  const newDue = Math.max(0, Number(existing.total_amount) - newPaid);

  let status = 'due';
  if (newDue <= 0) {
    status = 'paid';
  } else if (newPaid > 0) {
    status = 'partial';
  }

  await run(
    `UPDATE student_payments SET
       paid_amount = ?,
       due_amount = ?,
       status = ?,
       payment_date = CURRENT_TIMESTAMP,
       payment_method = COALESCE(?, payment_method),
       transaction_ref = COALESCE(?, transaction_ref)
     WHERE id = ?`,
    [newPaid, newDue, status, payment_method || null, transaction_ref || null, paymentId]
  );

  res.json({
    success: true,
    message: 'Payment recorded and dues updated successfully',
    data: { id: paymentId, paid_amount: newPaid, due_amount: newDue, status },
  });
}

export async function getStudentFinanceDetails(req: AuthRequest, res: Response): Promise<void> {
  const { studentId } = req.params;

  const student = await getOne<any>(
    "SELECT id, full_name, email, avatar_url, student_id, department, status, created_at FROM profiles WHERE id = ? AND role = 'student'",
    [studentId]
  );

  if (!student) {
    res.status(404).json({ success: false, message: 'Student not found' });
    return;
  }

  // Enrolled courses with completion
  const enrolledCourses = await query<any>(`
    SELECT c.id, c.title, c.banner_url, e.enrolled_at, s.name as subject_name,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as total_lessons,
           (SELECT COUNT(*) FROM lesson_progress lp 
            JOIN lessons l ON lp.lesson_id = l.id 
            JOIN modules m ON l.module_id = m.id 
            WHERE m.course_id = c.id AND lp.student_id = ?) as completed_lessons
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    WHERE e.student_id = ? AND e.status = 'active'
    ORDER BY e.enrolled_at DESC
  `, [studentId, studentId]);

  const coursesWithProgress = enrolledCourses.map(c => {
    const total = c.total_lessons || 0;
    const completed = c.completed_lessons || 0;
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...c, progress_pct };
  });

  // Payments and Invoices
  const payments = await query<any>(`
    SELECT sp.*, c.title as course_title
    FROM student_payments sp
    LEFT JOIN courses c ON sp.course_id = c.id
    WHERE sp.student_id = ?
    ORDER BY sp.created_at DESC
  `, [studentId]);

  const totalInvoiced = payments.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + (Number(p.due_amount) || 0), 0);

  res.json({
    success: true,
    data: {
      profile: student,
      student,
      enrolled_courses: coursesWithProgress,
      payment_history: payments,
      payments,
      financial_summary: {
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        total_due_available: totalDue,
        has_due: totalDue > 0,
      },
    },
  });
}

// --- 3. Self-Service Endpoints ---

export async function getMyStudentPayments(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  const payments = await query<any>(`
    SELECT sp.*, c.title as course_title, c.banner_url as course_banner, c.price as course_price
    FROM student_payments sp
    LEFT JOIN courses c ON sp.course_id = c.id
    WHERE sp.student_id = ?
    ORDER BY sp.created_at DESC
  `, [studentId]);

  const totalInvoiced = payments.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + (Number(p.due_amount) || 0), 0);
  const duePayments = payments.filter((p: any) => Number(p.due_amount) > 0);

  // Also fetch all available published courses with enrollment status and pricing for self-service purchase
  const availableCourses = await query<any>(`
    SELECT c.*, s.name as subject_name, s.code as subject_code,
           COALESCE(
             (SELECT p2.full_name FROM course_teachers ct JOIN profiles p2 ON ct.teacher_id = p2.id WHERE ct.course_id = c.id AND p2.role = 'teacher' LIMIT 1),
             p.full_name
           ) as teacher_name,
           COALESCE(
             (SELECT p2.avatar_url FROM course_teachers ct JOIN profiles p2 ON ct.teacher_id = p2.id WHERE ct.course_id = c.id AND p2.role = 'teacher' LIMIT 1),
             p.avatar_url
           ) as teacher_avatar,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND student_id = ? AND status = 'active') as is_enrolled,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = c.id) as quiz_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
    FROM courses c
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN profiles p ON c.created_by = p.id
    WHERE c.status = 'published'
    ORDER BY c.created_at DESC
  `, [studentId]);

  res.json({
    success: true,
    data: {
      payments,
      due_payments: duePayments,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_due_available: totalDue,
      has_due: totalDue > 0,
      available_courses: availableCourses.map(c => ({
        ...c,
        is_enrolled: Boolean(c.is_enrolled),
        price: Number(c.price || 15000.00),
      })),
    },
  });
}

export async function settleMyStudentPayment(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;
  const { payment_id, amount, payment_method, transaction_ref, note } = req.body;

  if (!payment_id) {
    res.status(400).json({ success: false, message: 'Payment ID is required' });
    return;
  }

  const existing = await getOne<any>('SELECT * FROM student_payments WHERE id = ? AND student_id = ?', [payment_id, studentId]);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Payment invoice not found or unauthorized' });
    return;
  }

  const currentDue = Number(existing.due_amount || 0);
  if (currentDue <= 0) {
    res.status(400).json({ success: false, message: 'This invoice has already been fully paid and has no outstanding due' });
    return;
  }

  const payAmount = amount !== undefined && Number(amount) > 0 ? Math.min(Number(amount), currentDue) : currentDue;
  const newPaid = Number(existing.paid_amount || 0) + payAmount;
  const newDue = Math.max(0, Number(existing.total_amount) - newPaid);

  let status = 'due';
  if (newDue <= 0) {
    status = 'paid';
  } else if (newPaid > 0) {
    status = 'partial';
  }

  const txRef = transaction_ref || `TRX-${Date.now().toString().slice(-6)}`;
  const pMethod = payment_method || existing.payment_method || 'bKash';

  await run(
    `UPDATE student_payments SET
       paid_amount = ?,
       due_amount = ?,
       status = ?,
       payment_date = CURRENT_TIMESTAMP,
       payment_method = ?,
       transaction_ref = ?,
       note = COALESCE(?, note)
     WHERE id = ?`,
    [newPaid, newDue, status, pMethod, txRef, note || null, payment_id]
  );

  res.json({
    success: true,
    message: `Payment of ৳${payAmount.toLocaleString()} processed successfully. Outstanding due is now ৳${newDue.toLocaleString()}.`,
    data: {
      id: payment_id,
      paid_amount: newPaid,
      due_amount: newDue,
      status,
      payment_method: pMethod,
      transaction_ref: txRef,
    },
  });
}

export async function purchaseCoursePayment(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;
  const { course_id, amount_to_pay, payment_method, transaction_ref, note } = req.body;

  if (!course_id) {
    res.status(400).json({ success: false, message: 'Course ID is required' });
    return;
  }

  const course = await getOne<any>('SELECT * FROM courses WHERE id = ?', [course_id]);
  if (!course) {
    res.status(404).json({ success: false, message: 'Course not found' });
    return;
  }

  // Check existing active enrollment
  const existingEnrollment = await getOne<any>(
    'SELECT id, status FROM enrollments WHERE course_id = ? AND student_id = ?',
    [course_id, studentId]
  );

  if (existingEnrollment && existingEnrollment.status === 'active') {
    // Check if there is already a payment or if user already owns it
    const existingPayment = await getOne<any>(
      'SELECT id, due_amount, status FROM student_payments WHERE course_id = ? AND student_id = ? ORDER BY created_at DESC LIMIT 1',
      [course_id, studentId]
    );
    if (existingPayment && Number(existingPayment.due_amount) === 0) {
      res.status(400).json({ success: false, message: 'You are already actively enrolled and fully paid for this course.' });
      return;
    }
  }

  const coursePrice = Number(course.price || 15000.00);
  const paidAmount = amount_to_pay !== undefined && Number(amount_to_pay) >= 0 ? Math.min(Number(amount_to_pay), coursePrice) : coursePrice;
  const dueAmount = Math.max(0, coursePrice - paidAmount);

  let status = 'due';
  if (dueAmount <= 0) {
    status = 'paid';
  } else if (paidAmount > 0) {
    status = 'partial';
  }

  const paymentId = `pay_${Date.now()}`;
  const txRef = transaction_ref || `ENR-${Date.now().toString().slice(-6)}`;
  const pMethod = payment_method || 'bKash';
  const pDate = paidAmount > 0 ? new Date().toISOString() : null;
  const title = `Tuition Fee: ${course.title}`;

  // 1. Record in student_payments (Updates Admin Panel instantly!)
  await run(
    `INSERT INTO student_payments (
       id, student_id, course_id, title, total_amount, paid_amount, due_amount,
       payment_date, due_date, payment_method, transaction_ref, status, note
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      paymentId,
      studentId,
      course_id,
      title,
      coursePrice,
      paidAmount,
      dueAmount,
      pDate,
      dueAmount > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      pMethod,
      txRef,
      status,
      note || `Direct student enrollment & fee clearance for ${course.title}.`,
    ]
  );

  // 2. Ensure student is actively enrolled
  let enrollmentId = existingEnrollment?.id;
  if (!existingEnrollment) {
    enrollmentId = `enr_${Date.now()}`;
    await run(
      `INSERT INTO enrollments (id, course_id, student_id, status) VALUES (?, ?, ?, 'active')`,
      [enrollmentId, course_id, studentId]
    );
  } else if (existingEnrollment.status !== 'active') {
    await run('UPDATE enrollments SET status = ? WHERE id = ?', ['active', existingEnrollment.id]);
  }

  res.status(201).json({
    success: true,
    message: `Enrollment and payment completed successfully for ${course.title}!`,
    data: {
      payment_id: paymentId,
      enrollment_id: enrollmentId,
      course_id,
      course_title: course.title,
      total_amount: coursePrice,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      status,
      transaction_ref: txRef,
      payment_method: pMethod,
    },
  });
}

export async function getMyTeacherSalaries(req: AuthRequest, res: Response): Promise<void> {
  const teacherId = req.user!.id;

  // 1. Fetch all salary records with course and subject details
  const salaries = await query<any>(`
    SELECT s.*, 
           c.title as course_title, 
           s2.name as subject_name, 
           s2.code as subject_code
    FROM teacher_salaries s
    LEFT JOIN courses c ON s.course_id = c.id
    LEFT JOIN subjects s2 ON c.subject_id = s2.id
    WHERE s.teacher_id = ?
    ORDER BY s.payment_date DESC, s.created_at DESC
  `, [teacherId]);

  // 2. Fetch all assigned courses for this teacher
  const assignedCourses = await query<any>(`
    SELECT c.id, c.title, c.description, c.status, c.banner_url, s.name as subject_name, s.code as subject_code,
           (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as student_count,
           (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lesson_count,
           (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id) as quiz_count,
           (SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id) as assignment_count
    FROM courses c
    JOIN course_teachers ct ON c.id = ct.course_id
    LEFT JOIN subjects s ON c.subject_id = s.id
    WHERE ct.teacher_id = ?
    ORDER BY c.created_at DESC
  `, [teacherId]);

  const teacher = await getOne<any>(
    "SELECT id, full_name, email, avatar_url, department, status, created_at FROM profiles WHERE id = ?",
    [teacherId]
  );

  const totalPaid = salaries
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const pendingAmount = salaries
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  res.json({
    success: true,
    data: {
      profile: teacher,
      salaries,
      assigned_courses: assignedCourses,
      total_paid: totalPaid,
      pending_amount: pendingAmount,
      total_disbursements: salaries.length,
      latest_disbursement: salaries.length > 0 ? salaries[0] : null,
    },
  });
}
