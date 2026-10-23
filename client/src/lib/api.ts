const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('edusathi_token');
}

export function setToken(token: string): void {
  localStorage.setItem('edusathi_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('edusathi_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data.data as T;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (profile: any) => request<any>('/me/profile', { method: 'PATCH', body: JSON.stringify(profile) }),

  // Users (Admin)
  getUsers: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/users${q}`);
  },
  createUser: (user: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: string, payload: any) => request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Subjects
  getSubjects: () => request<any[]>('/subjects'),
  createSubject: (subj: any) => request<any>('/subjects', { method: 'POST', body: JSON.stringify(subj) }),

  // Courses
  getCourses: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/courses${q}`);
  },
  getCourse: (courseId: string) => request<any>(`/courses/${courseId}`),
  createCourse: (course: any) => request<any>('/courses', { method: 'POST', body: JSON.stringify(course) }),
  updateCourse: (courseId: string, payload: any) => request<any>(`/courses/${courseId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCourse: (courseId: string) => request<any>(`/courses/${courseId}`, { method: 'DELETE' }),
  enrollCourse: (courseId: string, studentId?: string) => request<any>(`/courses/${courseId}/enroll`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) }),
  getCourseTeachers: (courseId: string) => request<any[]>(`/courses/${courseId}/teachers`),
  assignCourseTeacher: (courseId: string, teacherId: string) => request<any>(`/courses/${courseId}/teachers`, { method: 'POST', body: JSON.stringify({ teacher_id: teacherId }) }),
  removeCourseTeacher: (courseId: string, teacherId: string) => request<any>(`/courses/${courseId}/teachers/${teacherId}`, { method: 'DELETE' }),
  getCourseStudents: (courseId: string) => request<any[]>(`/courses/${courseId}/students`),
  getCourseStudentsPerformance: (courseId: string) => request<any>(`/courses/${courseId}/students-performance`),
  unenrollCourseStudent: (courseId: string, studentId: string) => request<any>(`/courses/${courseId}/students/${studentId}`, { method: 'DELETE' }),
  getMyCourses: () => request<any[]>('/me/courses'),

  // Modules & Lessons
  addModule: (courseId: string, title: string) => request<any>(`/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify({ title }) }),
  addLesson: (moduleId: string, lesson: any) => request<any>(`/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(lesson) }),
  markLessonProgress: (lessonId: string) => request<any>(`/lessons/${lessonId}/progress`, { method: 'POST' }),

  // Quizzes
  createQuiz: (courseId: string, quiz: any) => request<any>(`/courses/${courseId}/quizzes`, { method: 'POST', body: JSON.stringify(quiz) }),
  getCourseQuizzes: (courseId: string) => request<any[]>(`/courses/${courseId}/quizzes`),
  getTeacherQuizzes: () => request<any[]>('/teacher/quizzes'),
  getQuiz: (quizId: string) => request<any>(`/quizzes/${quizId}`),
  submitQuizAttempt: (quizId: string, answers: any) => request<any>(`/quizzes/${quizId}/attempts`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getQuizAttempts: (quizId: string) => request<any>(`/quizzes/${quizId}/attempts`),
  getMyQuizResults: () => request<any[]>('/me/quiz-results'),

  // Assignments
  createAssignment: (courseId: string, asg: any) => request<any>(`/courses/${courseId}/assignments`, { method: 'POST', body: JSON.stringify(asg) }),
  getCourseAssignments: (courseId: string) => request<any[]>(`/courses/${courseId}/assignments`),
  getTeacherAssignments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/teacher/assignments${q}`);
  },
  getAssignment: (assignmentId: string) => request<any>(`/assignments/${assignmentId}`),
  submitAssignment: (assignmentId: string, payload: any) => request<any>(`/assignments/${assignmentId}/submissions`, { method: 'POST', body: JSON.stringify(payload) }),
  getAssignmentSubmissions: (assignmentId: string) => request<any[]>(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId: string, grade: any) => request<any>(`/submissions/${submissionId}/grade`, { method: 'PATCH', body: JSON.stringify(grade) }),
  getMyGrades: () => request<any[]>('/me/grades'),
  getGradebook: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/teacher/gradebook${q}`);
  },

  // Attendance
  createAttendanceSession: (courseId: string, session: any) => request<any>(`/courses/${courseId}/attendance-sessions`, { method: 'POST', body: JSON.stringify(session) }),
  getCourseAttendance: (courseId: string) => request<any>(`/courses/${courseId}/attendance`),
  getMyAttendance: () => request<any>('/me/attendance'),

  // Analytics
  getStudentAnalytics: () => request<any>('/analytics/student'),
  getTeacherAnalytics: () => request<any>('/analytics/teacher'),
  getAdminAnalytics: () => request<any>('/analytics/admin'),

  // Announcements & Discussions
  getAnnouncements: (courseId: string) => request<any[]>(`/courses/${courseId}/announcements`),
  createAnnouncement: (courseId: string, payload: any) => request<any>(`/courses/${courseId}/announcements`, { method: 'POST', body: JSON.stringify(payload) }),
  getComments: (params: Record<string, string>) => {
    const q = '?' + new URLSearchParams(params).toString();
    return request<any[]>(`/comments${q}`);
  },
  createComment: (payload: any) => request<any>('/comments', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // AI Assistant
  askAiAssistant: (payload: { prompt: string; course_id?: string; mode?: string }) => request<any>('/ai/study-assistant', { method: 'POST', body: JSON.stringify(payload) }),

  // Finance & Salaries
  getTeacherSalaries: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/finance/salaries${q}`);
  },
  getTeacherSalariesSummary: () => request<any>('/finance/salaries/summary'),
  recordTeacherSalary: (payload: any) => request<any>('/finance/salaries', { method: 'POST', body: JSON.stringify(payload) }),
  getTeacherFinanceDetails: (teacherId: string) => request<any>(`/finance/teachers/${teacherId}/compensation`),

  // Student Payments & Dues
  getStudentPayments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/finance/student-payments${q}`);
  },
  getStudentPaymentsSummary: () => request<any>('/finance/student-payments/summary'),
  recordStudentPayment: (payload: any) => request<any>('/finance/student-payments', { method: 'POST', body: JSON.stringify(payload) }),
  settleStudentPayment: (paymentId: string, payload: any) => request<any>(`/finance/student-payments/${paymentId}/pay`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getStudentFinanceDetails: (studentId: string) => request<any>(`/finance/students/${studentId}/ledger`),

  // Self-Service Finance
  getMyStudentPayments: () => request<any>('/me/payments'),
  getMyTeacherSalaries: () => request<any>('/me/salaries'),
};
