import { Response } from 'express';
import { query, getOne, run } from '../repositories/db';
import { AuthRequest } from '../middleware/auth';
import {
  getAvailableModelsList,
  getLiveAiCredentials,
  executeAiQuery,
} from '../services/aiService';

export async function listAvailableModels(req: AuthRequest, res: Response): Promise<void> {
  const models = getAvailableModelsList();
  const creds = getLiveAiCredentials();
  res.json({
    success: true,
    data: {
      models,
      defaultModel: creds.defaultModel,
    },
  });
}

export async function askStudyAssistant(req: AuthRequest, res: Response): Promise<void> {
  const { prompt, course_id, mode, history, model, provider } = req.body;
  const studentId = req.user!.id;

  // 1. Gather authorized context for this student
  const enrolledCourses = await query<{ id: string; title: string }>(`
    SELECT c.id, c.title
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = ? AND e.status = 'active'
  `, [studentId]);

  let courseContext = '';
  if (course_id) {
    const course = await getOne<any>('SELECT title, description FROM courses WHERE id = ?', [course_id]);
    const lessons = await query<{ title: string; content: string }>(`
      SELECT l.title, l.content
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = ?
      LIMIT 3
    `, [course_id]);
    if (course) {
      courseContext = `Active Course: ${course.title}. Lessons: ${lessons.map(l => l.title).join(', ')}.`;
    }
  } else {
    courseContext = `Enrolled Courses: ${enrolledCourses.map(c => c.title).join(', ')}.`;
  }

  // Recent quiz attempts for performance grounding
  const recentAttempts = await query<{ title: string; score: number; max_score: number }>(`
    SELECT q.title, qa.score, qa.max_score
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_id = ?
    ORDER BY qa.submitted_at DESC
    LIMIT 3
  `, [studentId]);

  const performanceContext = recentAttempts.length > 0
    ? `Recent Quiz Performance: ${recentAttempts.map(a => `${a.title}: ${a.score}/${a.max_score}`).join('; ')}`
    : 'No recent quiz attempts found.';

  // Upcoming deadlines
  const upcomingAssignments = await query<{ title: string; due_at: string }>(`
    SELECT a.title, a.due_at
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = ? AND a.due_at >= CURRENT_TIMESTAMP
    LIMIT 3
  `, [studentId]);

  const deadlinesContext = upcomingAssignments.length > 0
    ? `Upcoming Deadlines: ${upcomingAssignments.map(a => `${a.title} due ${a.due_at}`).join('; ')}`
    : 'No pressing deadlines.';

  const systemInstruction = `You are EduSathi's intelligent AI Study Assistant.
You communicate directly, naturally, and helpfully with the student.
You can answer any questions, explain concepts clearly with intuitive analogies, help solve academic and programming problems, draft revision schedules, generate custom practice questions, and clarify course topics.
Always format your responses with clean Markdown (using headings, bold key terms, bullet points, and syntax-highlighted code blocks where applicable).
${courseContext ? `\nStudent Academic Context:\n- ${courseContext}\n- ${performanceContext}\n- ${deadlinesContext}\n(Use this context to personalize your advice when relevant, but always answer the student's questions directly without refusing or unnecessarily restricting topics.)` : ''}`;

  // 2. Try executing with AI service (Gemini, OpenAI, Groq, DeepSeek with auto-fallback)
  try {
    const aiResult = await executeAiQuery({
      prompt,
      systemInstruction,
      history,
      requestedModel: model,
      requestedProvider: provider,
    });

    res.json({
      success: true,
      data: {
        reply: aiResult.reply,
        source: aiResult.source,
        model: aiResult.model,
        provider: aiResult.provider,
        switched: aiResult.switched,
        notice: aiResult.notice,
      },
    });
    return;
  } catch (err: any) {
    if (err.message !== 'NO_API_KEY_CONFIGURED') {
      console.warn('[AI Assistant] All remote models/keys failed, falling back to rule-based engine:', err.message);
    }
  }

  // 3. Transparent, curriculum-grounded fallback (Honest disclosure as required by Section 10.4)
  let fallbackReply = '';
  const lowerPrompt = prompt.toLowerCase();

  if (mode === 'practice_questions' || lowerPrompt.includes('practice') || lowerPrompt.includes('question')) {
    fallbackReply = `### 📚 Practice Questions for Revision

Here are targeted practice questions based on your curriculum:

1. **Question 1:** Why is idempotency critical in REST API design, and which HTTP methods guarantee it?
   * *Hint:* Consider network retries and unexpected client timeouts.
2. **Question 2:** Explain the difference between Authentication (401) and Authorization (403) with a real-world LMS example.
3. **Question 3:** What is Broken Object Level Authorization (BOLA), and how does verifying user ownership prevent unauthorized grade access?
4. **Question 4:** How does database indexing on foreign keys (e.g., \`course_id\` in \`enrollments\`) optimize relational query execution?

*Tip: Write down your answers and check against your course lesson materials in Module 1!*`;
  } else if (mode === 'revision_plan' || lowerPrompt.includes('plan') || lowerPrompt.includes('revision') || lowerPrompt.includes('schedule')) {
    fallbackReply = `### 🗓️ Recommended 3-Day Revision Plan

Based on your enrolled courses (${enrolledCourses.map(c => c.title).slice(0, 2).join(', ')}) and pending tasks:

* **Day 1: Architectural Foundations**
  * Review **RESTful Principles & Stateless Authentication** (60 mins)
  * Read lesson: *Securing API Endpoints with JWT & RBAC*
  * Self-test with Quiz 1 practice questions

* **Day 2: Relational Schema & Performance**
  * Review database design patterns and foreign key constraints (45 mins)
  * Prepare submission drafts for upcoming assignments: ${upcomingAssignments.map(a => a.title).join(', ') || 'Current Module Work'}

* **Day 3: Synthesis & Verification**
  * Build a quick end-to-end integration test
  * Confirm all questions under discussion threads are reviewed

*(Plan generated by EduSathi Academic Context Engine)*`;
  } else if (lowerPrompt.includes('explain') || mode === 'explain') {
    fallbackReply = `### 💡 Concept Explanation

**Concept Breakdown:**
${prompt.replace(/^explain\s+/i, '')}

1. **High-Level Analogy:**
   Think of this concept like a well-organized university registry. Every request must be stamped with verified credentials (JWT), routed to the appropriate department (Controller), validated against university regulations (Zod Schema), and recorded in the permanent ledger (PostgreSQL).

2. **Core Takeaway:**
   Always prioritize security, explicit type-safety, and modular architecture. Avoid trusting client-supplied permissions or IDs directly without server-side validation.

3. **Curriculum Recommendation:**
   Review your course lessons under *Modern Client-Server Architecture* for detailed code snippets.`;
  } else {
    fallbackReply = `### 🤖 EduSathi Study Guidance

I reviewed your active curriculum (${enrolledCourses.map(c => c.title).join(', ')}):

- **Academic Status:** ${performanceContext}
- **Deadlines:** ${deadlinesContext}

**Recommendations:**
1. Review lessons with pending completion in your courses.
2. Attempt any open multiple-choice quizzes to reinforce core concepts.
3. Don't hesitate to post doubts under the course discussion board for teacher feedback!

*Note: AI provider key is currently in local development mode. Add AI_API_KEY in .env to enable live direct generation.*`;
  }

  res.json({
    success: true,
    data: {
      reply: fallbackReply,
      source: 'curriculum-rules-engine',
      disclaimer: 'Generated via EduSathi verified curriculum context engine (AI API key optional).',
    },
  });
}
