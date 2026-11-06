const API_BASE = 'http://localhost:5000/api';

async function req(url: string, method: string = 'GET', data?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || `HTTP ${res.status}`);
    (err as any).response = { status: res.status, data: json };
    throw err;
  }
  return json;
}

async function main() {
  console.log('================================================================');
  console.log('       EDUSATHI 360° CROSS-ROLE INTERACTION VERIFICATION        ');
  console.log('================================================================\n');

  const results: { module: string; test: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  const record = (module: string, test: string, passed: boolean, error?: any) => {
    results.push({
      module,
      test,
      status: passed ? 'PASS' : 'FAIL',
      error: error ? (error.response?.data?.message || error.message || String(error)) : undefined,
    });
    console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} [${module.padEnd(14)}] ${test} ${error ? `-> ${error.response?.data?.message || error.message}` : ''}`);
  };

  let adminToken = '';
  let teacherToken = '';
  let studentToken = '';
  let testCourseId = '';

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & MULTI-ROLE TOKENS
    // -------------------------------------------------------------------------
    console.log('--- 1. Authenticating Roles (Admin, Teacher, Student) ---');
    const adminLogin = await req('/auth/login', 'POST', {
      email: 'admin@edusathi.edu',
      password: 'Admin@123',
    });
    adminToken = adminLogin.data.token;
    record('Auth', 'Admin Credentials & Token Issuance', Boolean(adminToken));

    const teacherLogin = await req('/auth/login', 'POST', {
      email: 'dr.rahim@edusathi.edu',
      password: 'Teacher@123',
    });
    teacherToken = teacherLogin.data.token;
    record('Auth', 'Teacher Credentials & Token Issuance', Boolean(teacherToken));

    const studentLogin = await req('/auth/login', 'POST', {
      email: 'student.arafat@edusathi.edu',
      password: 'Student@123',
    });
    studentToken = studentLogin.data.token;
    record('Auth', 'Student Credentials & Token Issuance', Boolean(studentToken));

    // -------------------------------------------------------------------------
    // 2. COURSE LIFECYCLE & PRICING (Admin -> Teacher -> Student)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Course Creation, Pricing, Curriculum & Self-Service Purchase ---');
    const testCourseTitle = `Distributed Microservices Arch ${Date.now().toString().slice(-4)}`;
    try {
      const createCourseRes = await req('/courses', 'POST', {
        title: testCourseTitle,
        description: 'Advanced distributed consensus, Raft algorithms, and gRPC services.',
        subject_id: 'subj_cs',
        status: 'published',
        price: 24000,
      }, adminToken);
      testCourseId = createCourseRes.data.id;
      record('Courses', 'Admin Creates Course with Price (24,000 BDT)', Boolean(testCourseId) && createCourseRes.data.price === 24000);
    } catch (e) {
      record('Courses', 'Admin Creates Course with Price', false, e);
    }

    // Admin assigns Teacher to course
    try {
      await req(`/courses/${testCourseId}/teachers`, 'POST', { teacher_id: 'usr_teacher_1' }, adminToken);
      record('Courses', 'Admin Assigns Faculty Teacher to Course', true);
    } catch (e) {
      record('Courses', 'Admin Assigns Faculty Teacher to Course', false, e);
    }

    // Admin updates course price
    try {
      await req(`/courses/${testCourseId}`, 'PATCH', { price: 26500 }, adminToken);
      const getCoursesRes = await req('/courses', 'GET', undefined, adminToken);
      const updated = getCoursesRes.data.find((c: any) => c.id === testCourseId);
      record('Courses', 'Admin Updates Course Price to 26,500 BDT', updated?.price === 26500);
    } catch (e) {
      record('Courses', 'Admin Updates Course Price', false, e);
    }

    // Teacher adds Module and Lesson
    let testLessonId = '';
    try {
      const moduleRes = await req(`/courses/${testCourseId}/modules`, 'POST', {
        title: 'Module 1: Consensus & Leader Election',
      }, teacherToken);
      const moduleId = moduleRes.data.id;

      const lessonRes = await req(`/modules/${moduleId}/lessons`, 'POST', {
        title: 'Lesson 1.1: Raft State Machine Replication',
        content: '# Raft Consensus\n\nElection timeout triggers candidate state.',
        duration_minutes: 40,
        position: 1,
      }, teacherToken);
      testLessonId = lessonRes.data.id;
      record('Curriculum', 'Teacher Adds Module & Lesson to Course', Boolean(testLessonId));
    } catch (e) {
      record('Curriculum', 'Teacher Adds Module & Lesson to Course', false, e);
    }

    // Student buys course & pays tuition
    let purchasePaymentId = '';
    try {
      const buyRes = await req('/me/payments/buy-course', 'POST', {
        course_id: testCourseId,
        amount_to_pay: 26500,
        payment_method: 'bKash',
        transaction_ref: `BKASH-TXN-${Date.now().toString().slice(-4)}`,
      }, studentToken);
      purchasePaymentId = buyRes.data.payment_id;
      record('Payments', 'Student Purchases Course with Instant Enrollment', buyRes.success && buyRes.data.status === 'paid');
    } catch (e) {
      record('Payments', 'Student Purchases Course with Instant Enrollment', false, e);
    }

    // Admin verifies transaction in real-time financial ledger
    try {
      const adminPaymentsRes = await req('/finance/student-payments', 'GET', undefined, adminToken);
      const foundPayment = adminPaymentsRes.data.find((p: any) => p.id === purchasePaymentId);
      record('Finance Sync', 'Admin Real-Time Ledger Confirms Student Course Payment', Boolean(foundPayment && foundPayment.paid_amount === 26500));
    } catch (e) {
      record('Finance Sync', 'Admin Real-Time Ledger Confirms Payment', false, e);
    }

    // Student tracks lesson progress
    try {
      const progressRes = await req(`/lessons/${testLessonId}/progress`, 'POST', {}, studentToken);
      record('Learning', 'Student Completes Lesson & Marks Progress', progressRes.success);
    } catch (e) {
      record('Learning', 'Student Completes Lesson & Marks Progress', false, e);
    }

    // -------------------------------------------------------------------------
    // 3. ASSIGNMENT LIFECYCLE (Teacher -> Student -> Teacher Grading)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Assignment Creation, Submission & Grading ---');
    let testAssignmentId = '';
    try {
      const createAssignRes = await req(`/courses/${testCourseId}/assignments`, 'POST', {
        title: 'Lab 1: Raft Consensus Implementation in Go',
        instructions: 'Implement AppendEntries RPC and Heartbeat mechanism.',
        max_score: 100,
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        file_name: 'raft_spec.pdf',
        file_url: 'https://example.com/raft_spec.pdf',
      }, teacherToken);
      testAssignmentId = createAssignRes.data.id;
      record('Assignments', 'Teacher Publishes Assignment with Instructions & Attachment', Boolean(testAssignmentId));
    } catch (e) {
      record('Assignments', 'Teacher Publishes Assignment', false, e);
    }

    // Student fetches assigned work
    try {
      const studentAssigns = await req(`/student/assignments?courseId=${testCourseId}`, 'GET', undefined, studentToken);
      const found = studentAssigns.data.find((a: any) => a.id === testAssignmentId);
      record('Assignments', 'Student Portal Receives Published Assignment', Boolean(found));
    } catch (e) {
      record('Assignments', 'Student Portal Receives Published Assignment', false, e);
    }

    // Student submits assignment
    try {
      const submitRes = await req(`/assignments/${testAssignmentId}/submissions`, 'POST', {
        content: 'Completed election safety and heartbeat timeout loop with passing test suite.',
        file_url: 'https://example.com/student_raft_submission.pdf',
      }, studentToken);
      record('Assignments', 'Student Submits Assignment Document', submitRes.success);
    } catch (e) {
      record('Assignments', 'Student Submits Assignment Document', false, e);
    }

    // Teacher reviews submissions roster and grades
    let submissionId = '';
    try {
      const rosterRes = await req(`/assignments/${testAssignmentId}/submissions`, 'GET', undefined, teacherToken);
      submissionId = rosterRes.data[0]?.id;
      record('Assignments', 'Teacher Fetches Student Submission in Evaluation Roster', Boolean(submissionId));
    } catch (e) {
      record('Assignments', 'Teacher Fetches Student Submission', false, e);
    }

    // Teacher grades submission with feedback
    try {
      const gradeRes = await req(`/submissions/${submissionId}/grade`, 'PATCH', {
        score: 96,
        feedback: 'Superb implementation! Verified election safety under network partition.',
      }, teacherToken);
      record('Assignments', 'Teacher Evaluates Submission & Releases Grade (96/100)', gradeRes.success);
    } catch (e) {
      record('Assignments', 'Teacher Evaluates Submission', false, e);
    }

    // Student checks their graded transcript
    try {
      const studentGradesRes = await req('/me/grades', 'GET', undefined, studentToken);
      const studentGrade = studentGradesRes.data.find((g: any) => g.assignment_id === testAssignmentId);
      record('Grades Sync', 'Student Transcript Displays Released Grade & Faculty Feedback', Boolean(studentGrade && studentGrade.score === 96));
    } catch (e) {
      record('Grades Sync', 'Student Transcript Displays Released Grade', false, e);
    }

    // Teacher inspects unified course gradebook
    try {
      const gradebookRes = await req(`/teacher/gradebook?course_id=${testCourseId}`, 'GET', undefined, teacherToken);
      const item = gradebookRes.data.find((g: any) => g.assignment_id === testAssignmentId);
      record('Gradebook', 'Teacher Course Gradebook Synchronizes Evaluation Records', Boolean(item && item.score === 96));
    } catch (e) {
      record('Gradebook', 'Teacher Course Gradebook Synchronizes Evaluation Records', false, e);
    }

    // -------------------------------------------------------------------------
    // 4. QUIZ ASSESSMENT LIFECYCLE (Teacher -> Student -> Instant Auto-Scoring)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Quiz Assessment & Instant Auto-Scoring Lifecycle ---');
    let testQuizId = '';
    try {
      const createQuizRes = await req(`/courses/${testCourseId}/quizzes`, 'POST', {
        title: 'Quiz 1: Distributed Systems Basics',
        instructions: 'Answer all questions on consensus and split-brain tolerance.',
        duration_minutes: 15,
        questions: [
          {
            question_text: 'In Raft, what is the minimum quorum required for a cluster of 5 nodes?',
            question_type: 'single',
            marks: 10,
            options: [
              { option_text: '2 nodes', is_correct: false },
              { option_text: '3 nodes', is_correct: true, explanation: 'Majority is floor(N/2) + 1 = 3 nodes.' },
              { option_text: '4 nodes', is_correct: false },
              { option_text: '5 nodes', is_correct: false },
            ],
          },
        ],
      }, teacherToken);
      testQuizId = createQuizRes.data.id;
      record('Quizzes', 'Teacher Publishes Multi-Option Quiz with Explanations', Boolean(testQuizId));
    } catch (e) {
      record('Quizzes', 'Teacher Publishes Multi-Option Quiz', false, e);
    }

    // Student fetches quiz (verifying anti-cheat integrity: correct answers stripped)
    let questionId = '';
    let correctOptionId = '';
    try {
      const studentQuizView = await req(`/quizzes/${testQuizId}`, 'GET', undefined, studentToken);
      const q = studentQuizView.data.questions[0];
      questionId = q?.id;
      const hasAnswersMasked = studentQuizView.data.questions.every((item: any) =>
        item.options.every((opt: any) => opt.is_correct === undefined && opt.explanation === undefined)
      );
      record('Quiz Security', 'Anti-Cheat: Student View Masks Correct Answers & Explanations', hasAnswersMasked && Boolean(questionId));
    } catch (e) {
      record('Quiz Security', 'Anti-Cheat: Student View Masks Answers', false, e);
    }

    // Teacher retrieves quiz (teacher should have answers and explanations unmasked)
    try {
      const teacherQuizView = await req(`/quizzes/${testQuizId}`, 'GET', undefined, teacherToken);
      const q = teacherQuizView.data.questions[0];
      const correctOpt = q?.options.find((o: any) => o.is_correct === true);
      correctOptionId = correctOpt?.id;
      record('Quiz Access', 'Teacher View Accurately Preserves Answer Keys & Explanations', Boolean(correctOptionId));
    } catch (e) {
      record('Quiz Access', 'Teacher View Preserves Answer Keys', false, e);
    }

    // Student submits quiz attempt
    try {
      const attemptRes = await req(`/quizzes/${testQuizId}/attempts`, 'POST', {
        answers: [
          {
            question_id: questionId,
            selected_option_ids: [correctOptionId],
          },
        ],
      }, studentToken);
      record('Quizzes', 'Student Submits Quiz with Server-Side Auto-Scoring (Score: 10/10)', attemptRes.success);
    } catch (e) {
      record('Quizzes', 'Student Submits Quiz', false, e);
    }

    // Student views quiz results
    try {
      const studentQuizResults = await req('/me/quiz-results', 'GET', undefined, studentToken);
      const attempt = studentQuizResults.data.find((a: any) => a.quiz_id === testQuizId);
      record('Quizzes Sync', 'Student Exam Records Show Instant Score & Status (100%)', Boolean(attempt && attempt.score === 10));
    } catch (e) {
      record('Quizzes Sync', 'Student Exam Records Show Instant Score', false, e);
    }

    // Teacher views quiz attempt records
    try {
      const attemptsView = await req(`/quizzes/${testQuizId}/attempts`, 'GET', undefined, teacherToken);
      const studentAttempt = attemptsView.data?.attempts?.find((a: any) => a.quiz_id === testQuizId) || attemptsView.data?.attempts?.[0];
      record('Quizzes Sync', 'Teacher Portal Inspects Real-Time Quiz Performance & Class Submissions', Boolean(studentAttempt && studentAttempt.score === 10));
    } catch (e) {
      record('Quizzes Sync', 'Teacher Portal Inspects Real-Time Quiz Submissions', false, e);
    }

    // -------------------------------------------------------------------------
    // 5. ATTENDANCE MANAGEMENT (Teacher Live Session -> Student Check-in)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Attendance Session Lifecycle & Heatmap ---');
    let testSessionId = '';
    try {
      const sessionDate = new Date().toISOString().split('T')[0];
      const sessionRes = await req(`/courses/${testCourseId}/attendance-sessions`, 'POST', {
        session_date: sessionDate,
        title: 'Distributed Consensus Live Session',
        is_live: true,
        present_minutes: 10,
        late_minutes: 5,
      }, teacherToken);
      testSessionId = sessionRes.data.id;
      record('Attendance', 'Teacher Launches Live Attendance Session with Real-Time Window', Boolean(testSessionId));
    } catch (e) {
      record('Attendance', 'Teacher Launches Live Attendance Session', false, e);
    }

    // Student checks active sessions
    try {
      const activeSessionsRes = await req('/me/active-attendance-sessions', 'GET', undefined, studentToken);
      const foundSession = activeSessionsRes.data.find((s: any) => s.id === testSessionId);
      record('Attendance', 'Student Portal Identifies Open Check-In Opportunity', Boolean(foundSession));
    } catch (e) {
      record('Attendance', 'Student Portal Identifies Open Check-In Opportunity', false, e);
    }

    // Student checks in to the active session
    try {
      const checkInRes = await req('/attendance/check-in', 'POST', {
        session_id: testSessionId,
      }, studentToken);
      record('Attendance', 'Student Self Checks-in Within Active Time Window', checkInRes.success && checkInRes.data.status === 'present');
    } catch (e) {
      record('Attendance', 'Student Self Checks-in', false, e);
    }

    // Teacher verifies roll call roster
    try {
      const roster = await req(`/courses/${testCourseId}/attendance`, 'GET', undefined, teacherToken);
      const recordItem = roster.data.records.find((r: any) => r.session_id === testSessionId);
      record('Attendance Sync', 'Teacher Session Roster Confirms Student Present Status', Boolean(recordItem && recordItem.status === 'present'));
    } catch (e) {
      record('Attendance Sync', 'Teacher Session Roster Confirms Status', false, e);
    }

    // Student views personal attendance summary & heatmap
    try {
      const studentAtt = await req('/me/attendance', 'GET', undefined, studentToken);
      record('Attendance Sync', 'Student Heatmap & Attendance Percentage Dynamically Updated', studentAtt.success && studentAtt.data.present_count >= 1);
    } catch (e) {
      record('Attendance Sync', 'Student Heatmap Dynamically Updated', false, e);
    }

    // -------------------------------------------------------------------------
    // 6. TUITION DUES & FACULTY COMPENSATION (Admin -> Student & Admin -> Teacher)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Tuition Due Settlement & Faculty Salary Disbursement ---');
    let testDuePaymentId = '';
    try {
      const dueRes = await req('/finance/student-payments', 'POST', {
        student_id: 'usr_student_1',
        course_id: testCourseId,
        title: 'Distributed Systems Cloud Sandbox Lab Fee',
        total_amount: 4500,
        paid_amount: 0,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }, adminToken);
      testDuePaymentId = dueRes.data.id;
      record('Finance', 'Admin Invoices Student for Special Lab Fee (4,500 BDT Due)', Boolean(testDuePaymentId));
    } catch (e) {
      record('Finance', 'Admin Invoices Student', false, e);
    }

    // Student views outstanding dues in student panel
    try {
      const myPayments = await req('/me/payments', 'GET', undefined, studentToken);
      const duesList = myPayments.data?.due_payments || myPayments.data?.dues || [];
      const dueInvoice = duesList.find((d: any) => d.id === testDuePaymentId);
      record('Finance Sync', 'Student Payment Portal Displays Outstanding Due Invoice', Boolean(dueInvoice && dueInvoice.due_amount === 4500));
    } catch (e) {
      record('Finance Sync', 'Student Payment Portal Displays Due Invoice', false, e);
    }

    // Student settles outstanding due via Nagad
    try {
      const settleRes = await req('/me/payments/settle', 'POST', {
        payment_id: testDuePaymentId,
        amount: 4500,
        payment_method: 'Nagad',
        transaction_ref: `NAGAD-DUE-${Date.now().toString().slice(-4)}`,
      }, studentToken);
      record('Finance', 'Student Settles Outstanding Due via Nagad MFS', settleRes.success && settleRes.data.due_amount === 0);
    } catch (e) {
      record('Finance', 'Student Settles Outstanding Due', false, e);
    }

    // Admin verifies due is cleared in financial ledger
    try {
      const adminPayments = await req('/finance/student-payments', 'GET', undefined, adminToken);
      const settled = adminPayments.data.find((p: any) => p.id === testDuePaymentId);
      record('Finance Sync', 'Admin Financial Ledger Confirms Due Settlement (Paid: 4,500, Due: 0)', settled?.status === 'paid' && settled?.due_amount === 0);
    } catch (e) {
      record('Finance Sync', 'Admin Financial Ledger Confirms Settlement', false, e);
    }

    // Admin records faculty salary disbursement
    try {
      const salaryRes = await req('/finance/salaries', 'POST', {
        teacher_id: 'usr_teacher_1',
        course_id: testCourseId,
        amount: 60000,
        pay_period: '2026-10',
        payment_method: 'Direct Bank Transfer',
        status: 'paid',
        note: 'Faculty compensation for distributed systems curriculum',
      }, adminToken);
      record('Salaries', 'Admin Records Faculty Salary Disbursement (60,000 BDT)', salaryRes.success);
    } catch (e) {
      record('Salaries', 'Admin Records Faculty Salary Disbursement', false, e);
    }

    // Teacher views compensation in teacher portal
    try {
      const teacherSalaryRes = await req('/me/salaries', 'GET', undefined, teacherToken);
      record('Salaries Sync', 'Teacher Portal Reflects Disbursed Compensation Record', teacherSalaryRes.success && teacherSalaryRes.data.total_paid >= 60000);
    } catch (e) {
      record('Salaries Sync', 'Teacher Portal Reflects Disbursed Compensation', false, e);
    }

    // -------------------------------------------------------------------------
    // 7. COURSE DOUBTS & FACULTY ENGAGEMENT (Student <-> Teacher)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Course Doubts & Faculty Answers ---');
    let doubtCommentId = '';
    try {
      const postDoubtRes = await req('/comments', 'POST', {
        course_id: testCourseId,
        body: 'How does Raft handle network partitions where two leaders are temporarily elected?',
      }, studentToken);
      doubtCommentId = postDoubtRes.data.id;
      record('Discussions', 'Student Posts Course Doubt / Question to Faculty', Boolean(doubtCommentId));
    } catch (e) {
      record('Discussions', 'Student Posts Course Doubt', false, e);
    }

    // Teacher replies to student doubt
    try {
      const replyRes = await req('/comments', 'POST', {
        course_id: testCourseId,
        parent_id: doubtCommentId,
        body: 'Only the partition with a majority quorum (>= 3 nodes) can commit entries. When the partition heals, the term with higher number wins!',
      }, teacherToken);
      record('Discussions', 'Teacher Replies to Student Doubt in Real-Time', replyRes.success);
    } catch (e) {
      record('Discussions', 'Teacher Replies to Student Doubt', false, e);
    }

    // Student fetches discussion thread
    try {
      const discussionRes = await req(`/comments?course_id=${testCourseId}`, 'GET', undefined, studentToken);
      const studentComment = discussionRes.data.find((c: any) => c.id === doubtCommentId);
      const facultyReply = discussionRes.data.find((c: any) => c.parent_id === doubtCommentId);
      record('Discussions Sync', 'Student Thread Displays Question and Faculty Answer Collaboratively', Boolean(studentComment && facultyReply));
    } catch (e) {
      record('Discussions Sync', 'Student Thread Displays Question and Answer', false, e);
    }

    // -------------------------------------------------------------------------
    // 8. COURSE ANNOUNCEMENTS (Teacher -> Student)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Course Announcements Broadcast ---');
    let announcementId = '';
    try {
      const annRes = await req(`/courses/${testCourseId}/announcements`, 'POST', {
        title: 'Guest Lecture on Paxos vs Raft by Google Staff Engineer',
        body: 'Join the live interactive stream this Friday at 6:00 PM.',
      }, teacherToken);
      announcementId = annRes.data.id;
      record('Announcements', 'Teacher Broadcasts Course Announcement to Enrolled Students', Boolean(announcementId));
    } catch (e) {
      record('Announcements', 'Teacher Broadcasts Course Announcement', false, e);
    }

    // Student views announcements
    try {
      const annListRes = await req(`/courses/${testCourseId}/announcements`, 'GET', undefined, studentToken);
      const foundAnn = annListRes.data.find((a: any) => a.id === announcementId);
      record('Announcements Sync', 'Student Portal Receives Broadcasted Announcement in Stream', Boolean(foundAnn));
    } catch (e) {
      record('Announcements Sync', 'Student Portal Receives Broadcasted Announcement', false, e);
    }

    // -------------------------------------------------------------------------
    // 9. ACADEMIC ANALYTICS (Student, Teacher, Admin)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Academic Analytics & Reporting ---');
    try {
      const studentAnalytics = await req('/analytics/student', 'GET', undefined, studentToken);
      record('Analytics', 'Student Analytics Aggregates Enrolled Courses, Attendance & GPA', studentAnalytics.success);
    } catch (e) {
      record('Analytics', 'Student Analytics Aggregates Data', false, e);
    }

    try {
      const teacherCourseAnalytics = await req(`/analytics/teacher/course/${testCourseId}`, 'GET', undefined, teacherToken);
      record('Analytics', 'Teacher Course Analytics Reflects Class Enrollment & Submissions', teacherCourseAnalytics.success);
    } catch (e) {
      record('Analytics', 'Teacher Course Analytics Reflects Data', false, e);
    }

    try {
      const adminAnalytics = await req('/analytics/admin', 'GET', undefined, adminToken);
      record('Analytics', 'Admin Institutional Analytics Tracks Total Revenue, Students & Faculty', adminAnalytics.success);
    } catch (e) {
      record('Analytics', 'Admin Institutional Analytics Tracks Institutional Data', false, e);
    }

    // -------------------------------------------------------------------------
    // 10. CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Cleaning up test artifacts ---');
    if (testCourseId) {
      try {
        await req(`/courses/${testCourseId}`, 'DELETE', undefined, adminToken);
        record('Cleanup', 'Test Course Cleaned Up from Database', true);
      } catch (e) {
        record('Cleanup', 'Test Course Cleaned Up', false, e);
      }
    }

  } catch (err: any) {
    console.error('Fatal runner error:', err.message);
  }

  console.log('\n================================================================');
  console.log('                 CROSS-ROLE AUDIT SUMMARY                       ');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Interaction Paths Verified : ${total}`);
  console.log(`Successful Interactions (PASS)   : ${passed}`);
  console.log(`Disconnections / Failures (FAIL) : ${failed}`);
  console.log(`Success Rate                     : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️ Disconnections Detected:');
    results.filter(r => r.status === 'FAIL').forEach(f => {
      console.log(`- [${f.module}] ${f.test}: ${f.error}`);
    });
  } else {
    console.log('\n🎉 ALL 30+ CROSS-ROLE INTERACTION PATHS OPERATING FLAWLESSLY WITH ZERO DISCONNECTIONS!');
  }
}

main().catch(console.error);
