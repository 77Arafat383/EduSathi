import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  student_id: z.string().optional(),
  department: z.string().optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title is required'),
  description: z.string().optional(),
  subject_id: z.string().optional(),
  banner_url: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

export const createQuizSchema = z.object({
  title: z.string().min(3, 'Quiz title is required'),
  instructions: z.string().optional(),
  max_score: z.number().positive().default(100),
  due_at: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed']).default('published'),
  results_released: z.boolean().default(true),
  questions: z.array(z.object({
    question_text: z.string().min(1, 'Question text is required'),
    question_type: z.enum(['single', 'multiple']).default('single'),
    marks: z.number().positive().default(10),
    options: z.array(z.object({
      option_text: z.string().min(1, 'Option text is required'),
      is_correct: z.boolean(),
      explanation: z.string().optional(),
    })).min(2, 'At least 2 options required'),
  })).min(1, 'At least 1 question is required'),
});

export const submitQuizAttemptSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string(),
    selected_option_ids: z.array(z.string()),
  })),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Assignment title is required'),
  instructions: z.string().min(5, 'Instructions are required'),
  max_score: z.number().positive().default(100),
  due_at: z.string().optional(),
  submission_type: z.string().default('text_or_link'),
  status: z.enum(['draft', 'published', 'closed']).default('published'),
});

export const submitAssignmentSchema = z.object({
  content: z.string().min(2, 'Submission content or link is required'),
  file_url: z.string().optional(),
});

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0, 'Score cannot be negative'),
  feedback: z.string().optional(),
});

export const createAttendanceSessionSchema = z.object({
  session_date: z.string(),
  title: z.string().optional(),
  records: z.array(z.object({
    student_id: z.string(),
    status: z.enum(['present', 'absent', 'late']),
  })),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  body: z.string().min(5, 'Body content is required'),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty'),
  assignment_id: z.string().optional(),
  quiz_id: z.string().optional(),
  parent_id: z.string().optional(),
});

export const aiAssistantPromptSchema = z.object({
  prompt: z.string().min(2, 'Prompt is required').max(2000, 'Prompt too long'),
  course_id: z.string().optional(),
  mode: z.enum(['explain', 'practice_questions', 'revision_plan', 'chat']).default('chat'),
});
