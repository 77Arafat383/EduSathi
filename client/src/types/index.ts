export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  avatar_url?: string;
  student_id?: string;
  department?: string;
  created_at?: string;
  unread_notifications?: number;
  assigned_courses_count?: number;
  enrolled_courses_count?: number;
  total_salary_paid?: number;
  total_due_amount?: number;
  total_tuition_paid?: number;
  total_tuition_invoiced?: number;
}

export interface TeacherSalary {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  teacher_email?: string;
  teacher_avatar?: string;
  teacher_department?: string;
  course_id?: string;
  course_title?: string;
  subject_name?: string;
  subject_code?: string;
  amount: number;
  payment_date: string;
  pay_period: string;
  payment_method: string;
  transaction_ref?: string;
  status: 'paid' | 'pending' | 'processing';
  note?: string;
  created_at?: string;
}

export interface StudentPayment {
  id: string;
  student_id: string;
  student_name?: string;
  student_identifier?: string;
  student_email?: string;
  student_avatar?: string;
  student_department?: string;
  course_id?: string;
  course_title?: string;
  title: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_date?: string;
  due_date?: string;
  payment_method?: string;
  transaction_ref?: string;
  status: 'paid' | 'partial' | 'due' | 'overdue';
  note?: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  course_count?: number;
}

export type CourseCategory = Subject;

export interface Course {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  status: 'draft' | 'published' | 'archived';
  created_by?: string;
  teacher_name?: string;
  teacher_avatar?: string;
  teacher_email?: string;
  banner_url?: string;
  price?: number;
  student_count?: number;
  teacher_count?: number;
  lesson_count?: number;
  quiz_count?: number;
  assignment_count?: number;
  progress_pct?: number;
  is_enrolled?: boolean;
  completed_lesson_ids?: string[];
  modules?: Module[];
  quizzes?: Quiz[];
  assignments?: Assignment[];
  announcements?: Announcement[];
  created_at?: string;
}

export interface CourseTeacher {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  department?: string;
  status: string;
  assigned_at?: string;
}

export interface CourseStudent {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  student_id?: string;
  department?: string;
  enrollment_id: string;
  enrollment_status: string;
  enrolled_at: string;
  completed_lessons?: number;
  total_lessons?: number;
  progress_pct?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string;
  position: number;
  published_at?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  instructions?: string;
  max_score: number;
  duration_minutes?: number;
  due_at?: string;
  status: 'draft' | 'published' | 'closed';
  results_released: boolean;
  questions?: QuizQuestion[];
  previous_attempt?: QuizAttempt;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  marks: number;
  image_url?: string;
  position: number;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct?: boolean;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  avatar_url?: string;
  score: number;
  max_score: number;
  percentage?: number;
  status: string;
  submitted_at: string;
  quiz_title?: string;
  course_title?: string;
  answers?: Array<{
    question_id: string;
    selected_option_ids: string[];
    is_correct?: boolean;
    score_awarded?: number;
  }>;
}

export interface Assignment {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  instructions: string;
  max_score: number;
  due_at?: string;
  submission_type: string;
  status: 'draft' | 'published' | 'closed';
  submission_count?: number;
  my_submission?: Submission;
  file_url?: string;
  file_name?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  max_score?: number;
  course_id?: string;
  course_title?: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  avatar_url?: string;
  content: string;
  file_url?: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'resubmitted';
  score?: number;
  feedback?: string;
  grade_score?: number;
  grade_feedback?: string;
  released_at?: string;
}

export interface AttendanceSummary {
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  percentage: number;
  records: AttendanceRecord[];
  day_map: Record<string, 'present' | 'absent' | 'late' | string>;
  day_details?: Record<string, any>;
}

export interface AttendanceRecord {
  id: string;
  status: 'present' | 'absent' | 'late';
  session_date: string;
  session_title: string;
  course_title: string;
  course_id: string;
}

export interface Announcement {
  id: string;
  course_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  title: string;
  body: string;
  published_at: string;
}

export interface Comment {
  id: string;
  course_id?: string;
  assignment_id?: string;
  quiz_id?: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  author_avatar?: string;
  parent_id?: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read_at?: string;
  created_at: string;
}

export interface StudentAnalytics {
  enrolled_courses: number;
  course_completion_pct: number;
  completed_lessons: number;
  total_lessons: number;
  average_quiz_score: number;
  average_assignment_score: number;
  overall_attendance_pct: number;
  quiz_history: Array<{ name: string; score: number; date: string }>;
  assignment_history: Array<{ name: string; score: number; date: string }>;
  upcoming_deadlines: Array<{ id: string; title: string; due_at: string; course_title: string }>;
}
