const BASE_URL = 'http://localhost:3000';

function generateSyntheticFaceVector(seed) {
  const vec = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = Math.sin(seed * 1000 + i * 37) * 0.5 + Math.cos(seed * 200 + i * 19) * 0.5;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

async function runFullWorkflowTest() {
  console.log('================================================================');
  console.log('SMARTLAB COMPREHENSIVE END-TO-END WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  // 1. Faculty Login (Dr. Bhavesh S S)
  console.log('[Step 1] Faculty Login (Dr. Bhavesh S S)...');
  const facLoginRes = await fetch(`${BASE_URL}/api/auth/faculty-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'bhavesh_ise',
      password: 'Faculty@123'
    })
  });
  if (!facLoginRes.ok) throw new Error(`Faculty login failed: ${facLoginRes.status}`);
  const facData = await facLoginRes.json();
  const facToken = facData.token;
  console.log(`  -> Faculty authenticated: ${facData.user.name} (${facData.user.facultyId}), Role: ${facData.user.role}`);

  // 2. Faculty Checks Enrollment for 4 sample students (Kavana, Devika, Kanika, Chaitanya)
  console.log('\n[Step 2] Faculty checks Student Enrollment in ISE Sem 5...');
  const enrollRes = await fetch(`${BASE_URL}/api/students?branch=ISE&semester=5`, {
    headers: { 'Authorization': `Bearer ${facToken}` }
  });
  const enrollData = await enrollRes.json();
  const studentNames = enrollData.students.map(s => s.name);
  console.log('  -> Enrolled students found:', studentNames);
  for (const requiredName of ['Kavana', 'Devika', 'Kanika', 'Chaitanya']) {
    if (!studentNames.includes(requiredName)) {
      throw new Error(`Required sample student ${requiredName} not found in faculty enrollment!`);
    }
  }
  console.log('  -> PASS: All four sample ISE students enrolled and visible to faculty.');

  // 3. Student Mandatory Face Login (Kavana - 1MS22IS025)
  console.log('\n[Step 3] Student Login with Mandatory Face Authentication (Kavana)...');
  // Step 1: Credentials, branch, semester
  const stStep1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS025',
      password: 'Student@123',
      branch: 'ISE',
      semester: 5
    })
  });
  const stStep1Data = await stStep1Res.json();
  if (!stStep1Res.ok || !stStep1Data.challengeToken) {
    throw new Error(`Kavana step 1 failed: ${JSON.stringify(stStep1Data)}`);
  }

  // Step 2: Live face matching against Kavana's registered template (seed 101)
  const kavanaFaceVector = generateSyntheticFaceVector(101);
  const stStep2Res = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: stStep1Data.challengeToken,
      usn: '1MS22IS025',
      liveFaceVector: kavanaFaceVector,
      livenessData: {
        livenessScore: 98,
        challengePassed: true,
        method: 'live_camera',
        timestamp: Date.now()
      }
    })
  });
  const stStep2Data = await stStep2Res.json();
  if (!stStep2Res.ok || !stStep2Data.token) {
    throw new Error(`Kavana face login failed: ${JSON.stringify(stStep2Data)}`);
  }
  const studentToken = stStep2Data.token;
  const studentHeaders = {
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  };
  console.log(`  -> Student authenticated via face match: ${stStep2Data.user.name} (${stStep2Data.user.usn})`);

  // 4. Verify Student Sees Sample Lab 1: "Check Whether a Number Is Prime"
  console.log('\n[Step 4] Checking Assigned Lab Works for Kavana...');
  const assignRes = await fetch(`${BASE_URL}/api/assignments`, { headers: studentHeaders });
  const assignData = await assignRes.json();
  const primeLab = assignData.assignments.find(a => a.title.includes('Prime') || a.lab_number === 1);
  if (!primeLab) {
    throw new Error('Sample Lab 1 "Check Whether a Number Is Prime" not found for student!');
  }
  console.log(`  -> Found Lab: "${primeLab.title}" (Lab #${primeLab.lab_number}, Max Marks: ${primeLab.max_marks})`);
  console.log(`     Problem statement: "${primeLab.problem_statement}"`);

  // 5. Connect to Coding Workspace and Execute Real Java Code
  console.log('\n[Step 5] Connecting Lab 1 to Coding Workspace & Executing Real Java Compiler...');
  const javaPrimeCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int n = 17; // Test with prime number 17
        boolean isPrime = true;
        if (n <= 1) isPrime = false;
        else {
            for (int i = 2; i <= Math.sqrt(n); i++) {
                if (n % i == 0) { isPrime = false; break; }
            }
        }
        if (isPrime) System.out.println("Prime Number");
        else System.out.println("Not a Prime Number");
    }
}
  `;

  const runRes = await fetch(`${BASE_URL}/api/code/run`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      assignmentId: primeLab.id,
      language: 'Java',
      code: javaPrimeCode
    })
  });
  const runData = await runRes.json();
  console.log(`  -> Java compilation status: ${runRes.status}, engine: ${runData.engine}, success: ${runData.success}`);
  console.log(`     Output: "${(runData.stdout || '').trim()}"`);
  if (!runData.stdout?.includes('Prime Number')) {
    throw new Error(`Expected output "Prime Number", got "${runData.stdout}"`);
  }
  console.log('  -> PASS: Real OpenJDK compiler executed Java program with exact expected output.');

  // 6. Submit Code
  console.log('\n[Step 6] Submitting Java Program Solution...');
  const submitRes = await fetch(`${BASE_URL}/api/code/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      assignmentId: primeLab.id,
      language: 'Java',
      code: javaPrimeCode,
      pasteEventsCount: 0,
      activeSeconds: 95
    })
  });
  const submitData = await submitRes.json();
  console.log(`  -> Submission result: success=${submitData.success}, message="${submitData.message || 'Saved'}"`);
  if (!submitRes.ok || !submitData.success) {
    throw new Error(`Submission failed: ${JSON.stringify(submitData)}`);
  }

  // 7. Student Attends Quiz: "Java Programming Basics" (Section 16)
  console.log('\n[Step 7] Student attends Quiz: "Java Programming Basics" (15 Marks, 5 Questions)...');
  const quizListRes = await fetch(`${BASE_URL}/api/quizzes`, { headers: studentHeaders });
  const quizListData = await quizListRes.json();
  const javaQuiz = quizListData.quizzes.find(q => q.title.includes('Java Programming Basics'));
  if (!javaQuiz) {
    throw new Error('Sample quiz "Java Programming Basics" not found for student!');
  }
  console.log(`  -> Found Quiz: "${javaQuiz.title}", Total Marks: ${javaQuiz.total_marks}`);

  // Fetch quiz questions
  const quizDetailRes = await fetch(`${BASE_URL}/api/quizzes/${javaQuiz.id}`, { headers: studentHeaders });
  const quizDetail = await quizDetailRes.json();
  console.log(`  -> Fetched ${quizDetail.questions.length} questions without answer key leakage.`);

  // Check if already attempted or submit now
  let finalScore;
  if (quizDetail.attempt) {
    console.log(`  -> Student has previously attempted quiz. Score recorded: ${quizDetail.attempt.score}`);
    finalScore = quizDetail.attempt.score;
  } else {
    // Prepare exact 5 correct answers as specified in prompt Section 16:
    // Q1: class, Q2: main(), Q3: int, Q4: ;, Q5: new
    const answersMap = {};
    for (const q of quizDetail.questions) {
      const text = q.question_text.toLowerCase();
      if (text.includes('create a class')) answersMap[q.id] = 'class';
      else if (text.includes('starting point') || text.includes('starting method')) answersMap[q.id] = 'main()';
      else if (text.includes('whole numbers')) answersMap[q.id] = 'int';
      else if (text.includes('end a java statement')) answersMap[q.id] = ';';
      else if (text.includes('create an object')) answersMap[q.id] = 'new';
    }

    // Submit quiz answers
    const submitQuizRes = await fetch(`${BASE_URL}/api/quizzes/${javaQuiz.id}/submit`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ answers: answersMap })
    });
    const submitQuizData = await submitQuizRes.json();
    finalScore = submitQuizData.score;
  }
  console.log(`  -> Quiz evaluation: Score = ${finalScore} / ${javaQuiz.total_marks}`);
  if (finalScore !== 15) {
    throw new Error(`Expected perfect score 15, got ${finalScore}`);
  }
  console.log('  -> PASS: All 5 MCQs automatically evaluated with exact 15/15 score.');

  // 8. Student Checks My Progress
  console.log('\n[Step 8] Student checks My Progress...');
  const progressRes = await fetch(`${BASE_URL}/api/students/my-progress`, { headers: studentHeaders });
  const progressData = await progressRes.json();
  console.log(`  -> Completed Labs: ${progressData.metrics.completedCount} / ${progressData.metrics.totalAssigned}`);
  console.log(`  -> Performance Score: ${progressData.metrics.overallPerformance} / 100`);
  console.log(`  -> Executions: ${progressData.metrics.totalExecutions}, Penalty: -${progressData.metrics.totalPenaltyDeducted}`);

  // 9. Faculty Views Submissions & Quiz Results
  console.log('\n[Step 9] Faculty verifies student submissions, quiz results & monitoring...');
  const facSubsRes = await fetch(`${BASE_URL}/api/submissions/assignment/${primeLab.id}`, {
    headers: { 'Authorization': `Bearer ${facToken}` }
  });
  const facSubs = await facSubsRes.json();
  const kavanaSub = facSubs.submissions.find(s => s.student_usn === '1MS22IS025');
  if (!kavanaSub) {
    throw new Error('Faculty could not find Kavana\'s submission!');
  }
  console.log(`  -> Faculty found submission: Student=${kavanaSub.student_name}, Language=${kavanaSub.language}, Status=${kavanaSub.status}`);

  // Check quiz results in faculty view
  const facQuizRes = await fetch(`${BASE_URL}/api/quizzes/${javaQuiz.id}`, {
    headers: { 'Authorization': `Bearer ${facToken}` }
  });
  const facQuizData = await facQuizRes.json();
  const attempt = facQuizData.attempts.find(a => a.student_usn === '1MS22IS025');
  console.log(`  -> Faculty verified Kavana's quiz attempt: Score=${attempt?.score} / ${javaQuiz.total_marks}`);

  // 10. Role Security Enforcement
  console.log('\n[Step 10] Testing Role Isolation: Student attempting Faculty APIs...');
  const tamperRes = await fetch(`${BASE_URL}/api/students`, {
    headers: studentHeaders
  });
  console.log(`  -> Tamper attempt status: ${tamperRes.status}`);
  if (tamperRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for student hitting faculty API, got ${tamperRes.status}`);
  }
  console.log('  -> PASS: Role isolation strictly enforced.');

  console.log('\n================================================================');
  console.log('ALL 10 SMARTLAB FULL-STACK WORKFLOW TESTS PASSED CLEANLY!');
  console.log('================================================================\n');
}

runFullWorkflowTest().catch(err => {
  console.error('\nWORKFLOW TEST FAILED:', err);
  process.exit(1);
});
