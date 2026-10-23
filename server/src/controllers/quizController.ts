import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';

export async function createQuiz(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;
  const { title, instructions, max_score, duration_minutes, due_at, status, results_released, questions } = req.body;

  // Verify teacher ownership or admin
  if (req.user?.role !== 'admin') {
    const isTeacher = await getOne<{ teacher_id: string }>(
      'SELECT teacher_id FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
      [courseId, req.user?.id]
    );
    if (!isTeacher) {
      res.status(403).json({ success: false, message: 'You are not authorized to create quizzes in this course' });
      return;
    }
  }

  const computedMaxScore = Number(max_score) || questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0) || 1;
  const quizId = `qiz_${Date.now()}`;
  await run(
    `INSERT INTO quizzes (id, course_id, title, instructions, max_score, duration_minutes, due_at, status, results_released)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quizId,
      courseId,
      title,
      instructions || null,
      computedMaxScore,
      Number(duration_minutes) || 0,
      due_at || null,
      status || 'published',
      results_released !== undefined ? Boolean(results_released) : true
    ]
  );

  let qPos = 1;
  for (const q of questions) {
    const qId = `qq_${Date.now()}_${qPos}`;
    await run(
      `INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, marks, image_url, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [qId, quizId, q.question_text, q.question_type || 'single', Number(q.marks) || 1, q.image_url || null, qPos++]
    );

    let optPos = 1;
    for (const opt of q.options) {
      const optId = `opt_${Date.now()}_${optPos++}`;
      await run(
        `INSERT INTO quiz_options (id, question_id, option_text, is_correct, explanation)
         VALUES (?, ?, ?, ?, ?)`,
        [optId, qId, opt.option_text, Boolean(opt.is_correct), opt.explanation || null]
      );
    }
  }

  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: { id: quizId, title },
  });
}

export async function getQuiz(req: AuthRequest, res: Response): Promise<void> {
  const { quizId } = req.params;

  const quiz = await getOne<any>('SELECT * FROM quizzes WHERE id = ?', [quizId]);
  if (!quiz) {
    res.status(404).json({ success: false, message: 'Quiz not found' });
    return;
  }

  // Check previous student attempt
  let studentAttempt: any = null;
  if (req.user?.role === 'student') {
    studentAttempt = await getOne<any>(
      'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY submitted_at DESC',
      [quizId, req.user.id]
    );

    if (studentAttempt) {
      // Attach student's submitted answers
      const userAnswers = await query<any>(
        'SELECT question_id, selected_option_ids, is_correct, score_awarded FROM quiz_answers WHERE attempt_id = ?',
        [studentAttempt.id]
      );
      studentAttempt.answers = userAnswers.map(a => ({
        question_id: a.question_id,
        selected_option_ids: JSON.parse(a.selected_option_ids || '[]'),
        is_correct: Boolean(a.is_correct),
        score_awarded: a.score_awarded,
      }));
    }
  }

  const isTeacherOrAdmin = req.user?.role === 'teacher' || req.user?.role === 'admin';
  const showAnswers = isTeacherOrAdmin || Boolean(studentAttempt);

  const questions = await query<any>(
    'SELECT id, question_text, question_type, marks, image_url, position FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC',
    [quizId]
  );

  for (const q of questions) {
    if (showAnswers) {
      q.options = await query<any>(
        'SELECT id, option_text, is_correct, explanation FROM quiz_options WHERE question_id = ?',
        [q.id]
      );
    } else {
      // SECURITY: Strip is_correct and explanation during quiz attempt!
      q.options = await query<any>(
        'SELECT id, option_text FROM quiz_options WHERE question_id = ?',
        [q.id]
      );
    }
  }

  res.json({
    success: true,
    data: {
      ...quiz,
      questions,
      previous_attempt: studentAttempt,
    },
  });
}

export async function submitQuizAttempt(req: AuthRequest, res: Response): Promise<void> {
  const { quizId } = req.params;
  const { answers } = req.body;
  const studentId = req.user!.id;

  const quiz = await getOne<any>('SELECT * FROM quizzes WHERE id = ?', [quizId]);
  if (!quiz) {
    res.status(404).json({ success: false, message: 'Quiz not found' });
    return;
  }

  // Retrieve actual correct answers directly from database - do NOT trust client
  const allQuestions = await query<any>(
    'SELECT id, marks, question_type FROM quiz_questions WHERE quiz_id = ?',
    [quizId]
  );

  let totalScoreAwarded = 0;
  let totalMaxMarks = 0;
  const attemptId = `att_${Date.now()}`;

  // Calculate score and answers in memory first
  const answerInserts: Array<{ id: string; question_id: string; selected_ids: string; is_correct: boolean; score: number }> = [];

  for (const q of allQuestions) {
    const qMarks = Number(q.marks) || 1;
    totalMaxMarks += qMarks;

    const correctOptions = await query<{ id: string }>(
      'SELECT id FROM quiz_options WHERE question_id = ? AND is_correct = TRUE',
      [q.id]
    );
    const correctIds = new Set(correctOptions.map(o => o.id));

    // Find student answer
    const studentAns = answers.find((a: any) => a.question_id === q.id);
    const selectedIds: string[] = studentAns ? studentAns.selected_option_ids : [];

    // Check correctness:
    let isCorrect = false;
    if (selectedIds.length > 0 && selectedIds.length === correctIds.size) {
      isCorrect = selectedIds.every(id => correctIds.has(id));
    }

    const scoreAwarded = isCorrect ? qMarks : 0;
    totalScoreAwarded += scoreAwarded;

    answerInserts.push({
      id: `ans_${Date.now()}_${q.id}`,
      question_id: q.id,
      selected_ids: JSON.stringify(selectedIds),
      is_correct: isCorrect,
      score: scoreAwarded,
    });
  }

  // 1. Insert parent attempt first
  await run(
    `INSERT INTO quiz_attempts (id, quiz_id, student_id, started_at, submitted_at, score, max_score, status)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, 'completed')`,
    [attemptId, quizId, studentId, totalScoreAwarded, totalMaxMarks]
  );

  // 2. Insert child answers referencing attempt_id
  for (const item of answerInserts) {
    await run(
      `INSERT INTO quiz_answers (id, attempt_id, question_id, selected_option_ids, is_correct, score_awarded)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item.id, attemptId, item.question_id, item.selected_ids, Boolean(item.is_correct), item.score]
    );
  }

  res.status(201).json({
    success: true,
    message: 'Quiz attempt evaluated successfully',
    data: {
      attempt_id: attemptId,
      score: totalScoreAwarded,
      max_score: totalMaxMarks,
      percentage: totalMaxMarks > 0 ? Math.round((totalScoreAwarded / totalMaxMarks) * 100) : 0,
    },
  });
}

export async function getStudentQuizResults(req: AuthRequest, res: Response): Promise<void> {
  const studentId = req.user!.id;

  const results = await query<any>(`
    SELECT qa.*, q.title as quiz_title, c.title as course_title
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    WHERE qa.student_id = ?
    ORDER BY qa.submitted_at DESC
  `, [studentId]);

  res.json({
    success: true,
    data: results,
  });
}

export async function getQuizAttempts(req: AuthRequest, res: Response): Promise<void> {
  const { quizId } = req.params;

  const quiz = await getOne<any>(`
    SELECT q.*, c.title as course_title,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
    FROM quizzes q
    JOIN courses c ON q.course_id = c.id
    WHERE q.id = ?
  `, [quizId]);

  if (!quiz) {
    res.status(404).json({ success: false, message: 'Quiz not found' });
    return;
  }

  const attempts = await query<any>(`
    SELECT qa.*, p.full_name as student_name, p.email as student_email, p.student_id as student_code, p.avatar_url
    FROM quiz_attempts qa
    JOIN profiles p ON qa.student_id = p.id
    WHERE qa.quiz_id = ?
    ORDER BY qa.score DESC, qa.submitted_at DESC
  `, [quizId]);

  // Compute marks distribution brackets and statistics
  const totalAttempts = attempts.length;
  let totalScoreSum = 0;
  let highestScore = 0;
  let lowestScore = totalAttempts > 0 ? Infinity : 0;

  const distribution = {
    'A+ (90-100%)': 0,
    'A (80-89%)': 0,
    'B (70-79%)': 0,
    'C (60-69%)': 0,
    'D (50-59%)': 0,
    'F (<50%)': 0,
  };

  attempts.forEach(att => {
    const score = Number(att.score) || 0;
    const maxScore = Number(att.max_score) || Number(quiz.max_score) || 1;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    att.percentage = pct;

    totalScoreSum += score;
    if (score > highestScore) highestScore = score;
    if (score < lowestScore) lowestScore = score;

    if (pct >= 90) distribution['A+ (90-100%)']++;
    else if (pct >= 80) distribution['A (80-89%)']++;
    else if (pct >= 70) distribution['B (70-79%)']++;
    else if (pct >= 60) distribution['C (60-69%)']++;
    else if (pct >= 50) distribution['D (50-59%)']++;
    else distribution['F (<50%)']++;
  });

  if (lowestScore === Infinity) lowestScore = 0;
  const avgScore = totalAttempts > 0 ? Math.round((totalScoreSum / totalAttempts) * 10) / 10 : 0;
  const avgPercentage = quiz.max_score > 0 ? Math.round((avgScore / quiz.max_score) * 100) : 0;

  res.json({
    success: true,
    data: {
      quiz,
      attempts,
      stats: {
        total_attempts: totalAttempts,
        average_score: avgScore,
        average_percentage: avgPercentage,
        highest_score: highestScore,
        lowest_score: lowestScore,
        pass_rate: totalAttempts > 0
          ? Math.round((attempts.filter(a => (a.percentage || 0) >= 60).length / totalAttempts) * 100)
          : 0,
      },
      distribution: Object.entries(distribution).map(([bracket, count]) => ({
        bracket,
        count,
        percentage: totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0,
      })),
    },
  });
}

export async function listTeacherQuizzes(req: AuthRequest, res: Response): Promise<void> {
  const teacherId = req.user!.id;
  const isAdmin = req.user?.role === 'admin';

  let sql = `
    SELECT q.*, c.title as course_title,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
           (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count,
           (SELECT ROUND(AVG(score), 1) FROM quiz_attempts WHERE quiz_id = q.id) as avg_score,
           (SELECT MAX(score) FROM quiz_attempts WHERE quiz_id = q.id) as max_achieved_score
    FROM quizzes q
    JOIN courses c ON q.course_id = c.id
  `;

  const params: any[] = [];
  if (!isAdmin) {
    sql += ` WHERE c.id IN (SELECT course_id FROM course_teachers WHERE teacher_id = ?)`;
    params.push(teacherId);
  }

  sql += ` ORDER BY q.created_at DESC`;

  const quizzes = await query<any>(sql, params);

  res.json({
    success: true,
    data: quizzes,
  });
}

export async function listCourseQuizzes(req: AuthRequest, res: Response): Promise<void> {
  const { courseId } = req.params;

  const quizzes = await query<any>(`
    SELECT q.*,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
           (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count,
           (SELECT ROUND(AVG(score), 1) FROM quiz_attempts WHERE quiz_id = q.id) as avg_score
    FROM quizzes q
    WHERE q.course_id = ?
    ORDER BY q.created_at DESC
  `, [courseId]);

  res.json({
    success: true,
    data: quizzes,
  });
}
