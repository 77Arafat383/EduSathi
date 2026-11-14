import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { initDb, run } from '../src/repositories/db';

let studentToken = '';
let teacherToken = '';
let adminToken = '';

beforeAll(async () => {
  await initDb();
  // Clean previous test attempt records to ensure idempotency
  await run("DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = 'qiz_web_1' AND student_id = 'usr_student_1')");
  await run("DELETE FROM quiz_attempts WHERE quiz_id = 'qiz_web_1' AND student_id = 'usr_student_1'");

  // Login admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@edusathi.edu', password: 'Admin@123' });
  adminToken = adminRes.body.data.token;

  // Login teacher
  const teacherRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'dr.rahim@edusathi.edu', password: 'Teacher@123' });
  teacherToken = teacherRes.body.data.token;

  // Login student
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student.saiful@edusathi.edu', password: 'Student@123' });
  studentToken = studentRes.body.data.token;
}, 30000);

describe('1. Health Check Endpoint', () => {
  it('should return 200 OK with status and service name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('EduSathi Backend API');
  });
});

describe('2. Authentication & Authorization Security', () => {
  it('should reject invalid login credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@edusathi.edu', password: 'WrongPassword999' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject forgot password for non-existent email with 404', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: 'nobody_exists_12345@edusathi.edu',
        new_password: 'NewSecurePassword@123',
      });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should allow user to reset password via verification code and log in with new password', async () => {
    // 1. Create a dedicated test user
    const resetTestEmail = `verify_reset_user_${Date.now()}@edusathi.edu`;
    const origPassword = 'OriginalPass@123';
    const newPassword = 'BrandNewPassword@456';

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Verification Reset User',
        email: resetTestEmail,
        password: origPassword,
      });
    expect(regRes.status).toBe(201);

    // 2. Request password reset code
    const sendCodeRes = await request(app)
      .post('/api/auth/forgot-password/send-code')
      .send({ email: resetTestEmail });
    expect(sendCodeRes.status).toBe(200);
    expect(sendCodeRes.body.success).toBe(true);
    expect(sendCodeRes.body.preview_code).toBeDefined();
    const verificationCode = sendCodeRes.body.preview_code;

    // 3. Test invalid verification code rejection
    const invalidVerifyRes = await request(app)
      .post('/api/auth/forgot-password/verify')
      .send({
        email: resetTestEmail,
        code: '000000',
        new_password: newPassword,
      });
    expect(invalidVerifyRes.status).toBe(400);
    expect(invalidVerifyRes.body.code).toBe('INVALID_CODE');

    // 4. Verify with correct code and set new password
    const validVerifyRes = await request(app)
      .post('/api/auth/forgot-password/verify')
      .send({
        email: resetTestEmail,
        code: verificationCode,
        new_password: newPassword,
      });
    expect(validVerifyRes.status).toBe(200);
    expect(validVerifyRes.body.success).toBe(true);

    // 5. Old password must fail
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: resetTestEmail,
        password: origPassword,
      });
    expect(oldLoginRes.status).toBe(401);

    // 6. New password must succeed
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: resetTestEmail,
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.success).toBe(true);
    expect(newLoginRes.body.data.user.email).toBe(resetTestEmail);
  });

  it('should allow user to reset password via forgot-password route with verification code', async () => {
    // 1. Create a dedicated test user
    const resetTestEmail = `reset_user_${Date.now()}@edusathi.edu`;
    const origPassword = 'OriginalPass@123';
    const newPassword = 'BrandNewPassword@456';

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Reset Test User',
        email: resetTestEmail,
        password: origPassword,
      });
    expect(regRes.status).toBe(201);

    // 2. Request code via /api/auth/forgot-password without code
    const requestCodeRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: resetTestEmail,
      });
    expect(requestCodeRes.status).toBe(200);
    expect(requestCodeRes.body.success).toBe(true);
    expect(requestCodeRes.body.preview_code).toBeDefined();
    const code = requestCodeRes.body.preview_code;

    // 3. Complete password reset via /api/auth/forgot-password with code
    const resetRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({
        email: resetTestEmail,
        code,
        new_password: newPassword,
      });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // 4. Log in with old password (must fail)
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: resetTestEmail,
        password: origPassword,
      });
    expect(oldLoginRes.status).toBe(401);

    // 5. Log in with new password (must succeed)
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: resetTestEmail,
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.success).toBe(true);
    expect(newLoginRes.body.data.user.email).toBe(resetTestEmail);
  });

  it('should enforce student role during public registration (prevent privilege escalation)', async () => {
    const newEmail = `hacker_${Date.now()}@test.edu`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Privilege Attempt',
        email: newEmail,
        password: 'Password@123',
        role: 'admin', // Maliciously attempt to register as admin
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('student'); // MUST be student
  });

  it('should deny student from accessing administrator user management (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('should allow admin to access user management (200 OK)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should reject creating a student user without student_id (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Test Student No ID',
        email: `student_noid_${Date.now()}@edusathi.edu`,
        password: 'Password@123',
        role: 'student',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject creating a student user with an already existing student_id (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'Duplicate Student ID Test',
        email: `dup_student_${Date.now()}@edusathi.edu`,
        password: 'Password@123',
        role: 'student',
        student_id: 'CS-2024-001', // Existing ID in seed data
      });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already assigned');
  });

  it('should automatically assign gender-neutral person avatar when creating user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: 'New Student With Neutral Avatar',
        email: `neutral_student_${Date.now()}@edusathi.edu`,
        password: 'Password@123',
        role: 'student',
        student_id: `CS-TEST-${Date.now().toString().slice(-4)}`,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatar_url).toContain('data:image/svg+xml');
  });
});

describe('3. Course & Quiz Assessment Scoring', () => {
  it('should fetch course details for enrolled student', async () => {
    const res = await request(app)
      .get('/api/courses/crs_web_dev')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain('Web Development');
    expect(res.body.data.is_enrolled).toBe(true);
  });

  it('should strip correct answers when student fetches an active quiz', async () => {
    const res = await request(app)
      .get('/api/quizzes/qiz_web_1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    const questions = res.body.data.questions;
    expect(questions.length).toBeGreaterThan(0);
    // Ensure is_correct is NOT leaked to student
    for (const q of questions) {
      for (const opt of q.options) {
        expect(opt.is_correct).toBeUndefined();
      }
    }
  });

  it('should evaluate and score quiz attempt server-side', async () => {
    const res = await request(app)
      .post('/api/quizzes/qiz_web_1/attempts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          { question_id: 'qq_2', selected_option_ids: ['opt_2_1'] }, // Correct answer: BOLA
          { question_id: 'qq_3', selected_option_ids: ['opt_3_1'] }, // Correct answer: .env
          { question_id: 'qq_4', selected_option_ids: ['opt_4_1'] }, // Correct answer: 401
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBeGreaterThanOrEqual(30);
  });
});

describe('4. Attendance & Analytics Integrity', () => {
  it('should return calculated attendance stats for student', async () => {
    const res = await request(app)
      .get('/api/me/attendance')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('percentage');
    expect(res.body.data).toHaveProperty('day_map');
    expect(res.body.data.total_sessions).toBeGreaterThan(0);
  });

  it('should return live student dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/student')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('enrolled_courses');
    expect(res.body.data).toHaveProperty('course_completion_pct');
    expect(res.body.data).toHaveProperty('overall_attendance_pct');
  });
});

describe('5. Teacher Salary Disbursements & Main Cash Reconciliation', () => {
  let createdSalaryId = '';

  it('should record a pending salary disbursement', async () => {
    const res = await request(app)
      .post('/api/finance/salaries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        teacher_id: 'usr_teacher_1',
        amount: 35000,
        pay_period: 'November 2026',
        payment_method: 'BEFTN / Bank Transfer',
        status: 'pending',
        note: 'Bi-monthly instructional honorarium pending clearance',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    createdSalaryId = res.body.data.id;
  });

  it('should disburse the pending salary and update status to paid', async () => {
    const res = await request(app)
      .patch(`/api/finance/salaries/${createdSalaryId}/disburse`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('paid');
  });

  it('should reflect main cash balance and updated totals in salaries summary', async () => {
    const res = await request(app)
      .get('/api/finance/salaries/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_disbursed');
    expect(res.body.data).toHaveProperty('pending_disbursements');
    expect(res.body.data).toHaveProperty('main_cash_balance');
  });

  it('should return teacher assigned courses and updated compensation history', async () => {
    const res = await request(app)
      .get('/api/finance/teachers/usr_teacher_1/compensation')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('assigned_courses');
    expect(Array.isArray(res.body.data.assigned_courses)).toBe(true);
    expect(res.body.data.assigned_courses.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('total_salary_paid');
  });
});

describe('6. Student Multi-Course Invoicing, Auto Enrollment & Partial Payment History', () => {
  let createdPaymentId = '';

  it('should generate a multi-course tuition invoice and auto-enroll the student into new courses', async () => {
    // usr_student_3 is initially not enrolled in crs_ai_eng
    const res = await request(app)
      .post('/api/finance/student-payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id: 'usr_student_3',
        course_ids: ['crs_ai_eng'],
        title: 'Spring 2027 Advanced AI Enrollment',
        total_amount: 18000,
        paid_amount: 10000,
        due_date: '2026-12-31',
        payment_method: 'bKash Merchant',
        transaction_ref: 'TRX-INST-1001',
        note: 'First installment paid upon multi-course registration',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.due_amount).toBe(8000);
    createdPaymentId = res.body.data.id;

    // Verify student is now actively enrolled in crs_ai_eng
    const studentRes = await request(app)
      .get('/api/finance/students/usr_student_3/ledger')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(studentRes.status).toBe(200);
    const enrolledCourseIds = studentRes.body.data.enrolled_courses.map((c: any) => c.id);
    expect(enrolledCourseIds).toContain('crs_ai_eng');
  });

  it('should track partial payment installment history in official receipt and ledger', async () => {
    // 2nd installment: pay 5000 (leaves 3000 due)
    const settleRes1 = await request(app)
      .patch(`/api/finance/student-payments/${createdPaymentId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        additional_paid: 5000,
        payment_method: 'Nagad',
        transaction_ref: 'TRX-INST-1002',
        note: 'Second installment paid',
      });
    expect(settleRes1.status).toBe(200);
    expect(settleRes1.body.data.paid_amount).toBe(15000);
    expect(settleRes1.body.data.due_amount).toBe(3000);
    expect(settleRes1.body.data.status).toBe('partial');

    // 3rd installment: pay 3000 (clears the balance to 0, status becomes paid)
    const settleRes2 = await request(app)
      .patch(`/api/finance/student-payments/${createdPaymentId}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        additional_paid: 3000,
        payment_method: 'Bank Transfer (BEFTN/NPSB)',
        transaction_ref: 'TRX-INST-1003',
        note: 'Final settlement installment',
      });
    expect(settleRes2.status).toBe(200);
    expect(settleRes2.body.data.paid_amount).toBe(18000);
    expect(settleRes2.body.data.due_amount).toBe(0);
    expect(settleRes2.body.data.status).toBe('paid');

    // Fetch payments list and verify transactions array has all 3 installments
    const listRes = await request(app)
      .get(`/api/finance/student-payments?student_id=usr_student_3`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    const payment = listRes.body.data.find((p: any) => p.id === createdPaymentId);
    expect(payment).toBeDefined();
    expect(payment.status).toBe('paid');
    expect(Number(payment.paid_amount)).toBe(18000);
    expect(Number(payment.due_amount)).toBe(0);
    expect(Array.isArray(payment.transactions)).toBe(true);
    expect(payment.transactions.length).toBe(3);

    // Verify transaction 1
    expect(Number(payment.transactions[0].amount)).toBe(10000);
    expect(payment.transactions[0].payment_method).toBe('bKash Merchant');
    expect(payment.transactions[0].transaction_ref).toBe('TRX-INST-1001');
    expect(Number(payment.transactions[0].balance_due_after)).toBe(8000);

    // Verify transaction 2
    expect(Number(payment.transactions[1].amount)).toBe(5000);
    expect(payment.transactions[1].payment_method).toBe('Nagad');
    expect(payment.transactions[1].transaction_ref).toBe('TRX-INST-1002');
    expect(Number(payment.transactions[1].balance_due_after)).toBe(3000);

    // Verify transaction 3
    expect(Number(payment.transactions[2].amount)).toBe(3000);
    expect(payment.transactions[2].payment_method).toBe('Bank Transfer (BEFTN/NPSB)');
    expect(payment.transactions[2].transaction_ref).toBe('TRX-INST-1003');
    expect(Number(payment.transactions[2].balance_due_after)).toBe(0);
  });
});

describe('7. Admin Operational Notifications & Financial Alerts', () => {
  it('should deliver only admin-relevant notifications and ignore classroom/student types for admin', async () => {
    // Insert a student-only notification addressed to admin to test exclusion filter
    const testId = `notif_test_classroom_${Date.now()}`;
    await run(`INSERT INTO notifications (id, recipient_id, type, title, message) VALUES (?, ?, ?, ?, ?)`,
      [testId, 'usr_admin_1', 'grade_released', 'Irrelevant Classroom Notification', 'Student grade alert']);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Ensure irrelevant classroom notification is excluded/ignored for admin
    const irrelevantNotif = res.body.data.find((n: any) => n.id === testId);
    expect(irrelevantNotif).toBeUndefined();

    // Verify all returned notifications for admin are in allowed administrative types
    const allowedTypes = ['salary_request', 'new_payment', 'payment_received', 'student_payment', 'salary_disbursed', 'admin_alert', 'system_alert'];
    for (const notif of res.body.data) {
      expect(allowedTypes).toContain(notif.type);
    }
  });

  it('should notify admin when teacher submits a salary disbursement request', async () => {
    const reqRes = await request(app)
      .post('/api/me/salaries/request')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        course_id: 'crs_web_dev',
        amount: 45000,
        pay_period: 'November 2026',
        note: 'Lecture delivery and grading completion',
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.success).toBe(true);
    expect(reqRes.body.data.status).toBe('pending');

    // Admin checks notifications and receives the salary request notification
    const adminNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminNotifRes.status).toBe(200);
    const salaryNotif = adminNotifRes.body.data.find((n: any) => n.type === 'salary_request' && n.message.includes('November 2026'));
    expect(salaryNotif).toBeDefined();
    expect(salaryNotif.link).toBe('/admin/salaries');
  });

  it('should notify admin when student pays tuition fee or installment', async () => {
    const payRes = await request(app)
      .post('/api/me/payments/buy-course')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        course_id: 'crs_ai_eng',
        amount_to_pay: 15000,
        payment_method: 'bKash',
        transaction_ref: 'TRX-TEST-NOTIF-99',
      });

    // If already enrolled/paid, settle an existing due
    if (payRes.status !== 201) {
      await request(app)
        .post('/api/finance/student-payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 'usr_student_1',
          title: 'Special Assessment Fee',
          total_amount: 5000,
          paid_amount: 5000,
          payment_method: 'Nagad',
        });
    }

    const adminNotifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminNotifRes.status).toBe(200);
    const paymentNotifs = adminNotifRes.body.data.filter((n: any) => n.type === 'new_payment' || n.type === 'payment_received');
    expect(paymentNotifs.length).toBeGreaterThan(0);
  });

  it('should deliver only teacher-relevant notifications and ignore admin/student types for teacher', async () => {
    // Insert an admin-only payment notification addressed to teacher to verify filtering
    const testPaymentId = `notif_teacher_irrelevant_${Date.now()}`;
    await run(`INSERT INTO notifications (id, recipient_id, type, title, message) VALUES (?, ?, ?, ?, ?)`,
      [testPaymentId, 'usr_teacher_1', 'new_payment', 'Student Tuition Payment', 'Irrelevant payment for teacher']);

    // Insert a valid teacher notification (salary disbursement)
    const testDisbursedId = `notif_teacher_valid_${Date.now()}`;
    await run(`INSERT INTO notifications (id, recipient_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [testDisbursedId, 'usr_teacher_1', 'salary_disbursed', 'Compensation Cleared', 'Your salary voucher has been credited', '/teacher/salary']);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Ensure irrelevant notification is excluded/ignored for teacher
    const irrelevantNotif = res.body.data.find((n: any) => n.id === testPaymentId);
    expect(irrelevantNotif).toBeUndefined();

    // Ensure valid notification is present
    const validNotif = res.body.data.find((n: any) => n.id === testDisbursedId);
    expect(validNotif).toBeDefined();

    // Verify all returned notifications for teacher are in permitted teacher types
    const allowedTeacherTypes = ['submission', 'assignment_submitted', 'salary_disbursed', 'salary_request', 'comment', 'doubt', 'teacher_alert', 'faculty_alert', 'system_alert', 'enrollment'];
    for (const notif of res.body.data) {
      expect(allowedTeacherTypes).toContain(notif.type);
    }
  });
});
