import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { initDb } from '../src/repositories/db';

let studentToken = '';
let teacherToken = '';
let adminToken = '';

beforeAll(async () => {
  await initDb();

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
    .send({ email: 'student.arafat@edusathi.edu', password: 'Student@123' });
  studentToken = studentRes.body.data.token;
});

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
