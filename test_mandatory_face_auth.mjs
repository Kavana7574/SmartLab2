import { DatabaseSync } from 'node:sqlite';

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

async function runFaceAuthTestSuite() {
  console.log('================================================================');
  console.log('SMARTLAB MANDATORY FACE AUTHENTICATION & SECURITY TEST SUITE');
  console.log('================================================================\n');

  const testNewUsn = `1MS24CS${Math.floor(100 + Math.random() * 900)}`;
  const testNewPassword = 'SecureStudent@2026';
  const testNewFaceVector = generateSyntheticFaceVector(4242);
  const otherPersonFaceVector = generateSyntheticFaceVector(8888);

  // -------------------------------------------------------------------------
  // Case 1: New student registers and captures their face (Compulsory enrollment)
  // -------------------------------------------------------------------------
  console.log(`[Case 1] New student registration with compulsory face enrollment (USN: ${testNewUsn})...`);
  
  // 1a: Attempt registration WITHOUT face template (Must fail)
  const failRegRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Aarav Patel',
      usn: testNewUsn,
      password: testNewPassword,
      confirmPassword: testNewPassword,
      branch: 'CSE',
      semester: 3
      // No faceVector
    })
  });
  if (failRegRes.status === 400) {
    console.log('  -> PASS: Registration without face vector was correctly rejected with HTTP 400.');
  } else {
    throw new Error(`Registration without face vector should have failed, got status ${failRegRes.status}`);
  }

  // 1b: Complete registration with face capture
  const regRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Aarav Patel',
      usn: testNewUsn,
      password: testNewPassword,
      confirmPassword: testNewPassword,
      branch: 'CSE',
      semester: 3,
      faceVector: testNewFaceVector,
      qualityScore: 97
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok || !regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  console.log(`  -> Response message: "${regData.message}"`);
  if (!regData.message.includes('Face Registration Successful')) {
    throw new Error(`Expected "Face Registration Successful" message, got: ${regData.message}`);
  }
  console.log('  -> PASS: Case 1 - Student registered and 128-D face template saved successfully.');

  // -------------------------------------------------------------------------
  // Case 2: Same student logs in with the correct face – access granted
  // -------------------------------------------------------------------------
  console.log('\n[Case 2] Same student logs in with correct face (USN: ' + testNewUsn + ')...');
  // Step 1: verify credentials, branch, and semester
  const step1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: testNewUsn,
      password: testNewPassword,
      branch: 'CSE',
      semester: 3
    })
  });
  const step1Data = await step1Res.json();
  if (!step1Res.ok || !step1Data.challengeToken) {
    throw new Error(`Step 1 failed: ${JSON.stringify(step1Data)}`);
  }
  console.log(`  -> Step 1 & 2 passed: Challenge token generated (${step1Data.challengeToken.slice(0, 8)}...)`);

  // Step 2: verify matching live face
  const step2Res = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: step1Data.challengeToken,
      usn: testNewUsn,
      liveFaceVector: testNewFaceVector,
      livenessData: {
        livenessScore: 95,
        challengePassed: true,
        method: 'live_camera',
        timestamp: Date.now()
      }
    })
  });
  const step2Data = await step2Res.json();
  if (!step2Res.ok || !step2Data.token || !step2Data.matched) {
    throw new Error(`Step 2 matching failed: ${JSON.stringify(step2Data)}`);
  }
  console.log(`  -> Step 2 passed: Face matched! Token issued for ${step2Data.user.name} (${step2Data.user.usn})`);
  console.log('  -> PASS: Case 2 - Access granted with correct face.');

  // -------------------------------------------------------------------------
  // Case 3: Another person uses the student's USN and password – access denied
  // (e.g. Someone enters Kavana's credentials, but Devika's or intruder's face is presented)
  // -------------------------------------------------------------------------
  console.log('\n[Case 3] Another person enters Kavana\'s USN (1MS22IS025) and password, but presents another face...');
  // Step 1 for Kavana
  const kavanaStep1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS025',
      password: 'Student@123',
      branch: 'ISE',
      semester: 5
    })
  });
  const kavanaStep1 = await kavanaStep1Res.json();
  if (!kavanaStep1Res.ok) throw new Error('Kavana step 1 failed');

  // Step 2: Present Devika's face vector (seed 18) for Kavana's account (seed 25)
  const devikaFaceVector = generateSyntheticFaceVector(18);
  const impostorStep2Res = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: kavanaStep1.challengeToken,
      usn: '1MS22IS025',
      liveFaceVector: devikaFaceVector
    })
  });
  const impostorStep2 = await impostorStep2Res.json();
  console.log(`  -> Status: ${impostorStep2Res.status}, Error: "${impostorStep2.error}"`);
  if (impostorStep2Res.status !== 401 || !impostorStep2.error.includes('Face Verification Failed')) {
    throw new Error(`Impostor face should have been blocked with 401 and "Face Verification Failed", got: ${JSON.stringify(impostorStep2)}`);
  }
  console.log('  -> PASS: Case 3 - Another person\'s face was strictly blocked.');

  // -------------------------------------------------------------------------
  // Case 4: Incorrect password – access denied
  // -------------------------------------------------------------------------
  console.log('\n[Case 4] Attempt login with incorrect password...');
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS025',
      password: 'WrongPassword123!',
      branch: 'ISE',
      semester: 5
    })
  });
  const wrongPassData = await wrongPassRes.json();
  console.log(`  -> Status: ${wrongPassRes.status}, Error: "${wrongPassData.error}"`);
  if (wrongPassRes.status !== 401 || !wrongPassData.error.toLowerCase().includes('password')) {
    throw new Error('Incorrect password was not blocked with 401!');
  }
  console.log('  -> PASS: Case 4 - Incorrect password was strictly denied.');

  // -------------------------------------------------------------------------
  // Case 5: Incorrect branch or semester – access denied
  // -------------------------------------------------------------------------
  console.log('\n[Case 5] Attempt login with incorrect branch or semester...');
  // 5a: Wrong Branch
  const wrongBranchRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS025', // Registered as ISE
      password: 'Student@123',
      branch: 'CSE', // Wrong
      semester: 5
    })
  });
  const wrongBranchData = await wrongBranchRes.json();
  console.log(`  -> Wrong branch status: ${wrongBranchRes.status}, Error: "${wrongBranchData.error}"`);
  if (wrongBranchRes.status !== 401 || !wrongBranchData.error.toLowerCase().includes('branch/semester')) {
    throw new Error('Wrong branch was not blocked!');
  }

  // 5b: Wrong Semester
  const wrongSemRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS025', // Registered as Sem 5
      password: 'Student@123',
      branch: 'ISE',
      semester: 7 // Wrong
    })
  });
  const wrongSemData = await wrongSemRes.json();
  console.log(`  -> Wrong semester status: ${wrongSemRes.status}, Error: "${wrongSemData.error}"`);
  if (wrongSemRes.status !== 401 || !wrongSemData.error.toLowerCase().includes('branch/semester')) {
    throw new Error('Wrong semester was not blocked!');
  }
  console.log('  -> PASS: Case 5 - Incorrect branch and semester were strictly denied.');

  // -------------------------------------------------------------------------
  // Case 6: Face does not match – access denied with exact required message
  // -------------------------------------------------------------------------
  console.log('\n[Case 6] Face does not match – verifying exact error response...');
  const kanikaStep1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS022', // Kanika
      password: 'Student@123',
      branch: 'ISE',
      semester: 5
    })
  });
  const kanikaStep1 = await kanikaStep1Res.json();
  const mismatchFaceRes = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: kanikaStep1.challengeToken,
      usn: '1MS22IS022',
      liveFaceVector: otherPersonFaceVector // Random face
    })
  });
  const mismatchData = await mismatchFaceRes.json();
  console.log(`  -> Status: ${mismatchFaceRes.status}, Error: "${mismatchData.error}"`);
  const expectedMsg = "Face Verification Failed. The registered student could not be verified. Please try again.";
  if (mismatchFaceRes.status !== 401 || mismatchData.error !== expectedMsg) {
    throw new Error(`Expected exact error "${expectedMsg}", got "${mismatchData.error}"`);
  }
  console.log('  -> PASS: Case 6 - Exact required error message displayed and login blocked.');

  // -------------------------------------------------------------------------
  // Case 7: Camera unavailable / no face vector provided – login blocked
  // -------------------------------------------------------------------------
  console.log('\n[Case 7] Camera unavailable or no face vector provided...');
  const chaitanyaStep1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: '1MS22IS015',
      password: 'Student@123',
      branch: 'ISE',
      semester: 5
    })
  });
  const chaitanyaStep1 = await chaitanyaStep1Res.json();
  const noCamRes = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: chaitanyaStep1.challengeToken,
      usn: '1MS22IS015',
      liveFaceVector: null // Camera unavailable
    })
  });
  const noCamData = await noCamRes.json();
  console.log(`  -> Status: ${noCamRes.status}, Error: "${noCamData.error}"`);
  if (noCamRes.status !== 400 && noCamRes.status !== 401) {
    throw new Error('Missing face vector was not blocked!');
  }
  console.log('  -> PASS: Case 7 - Missing camera stream / face vector blocked with clear explanation.');

  // -------------------------------------------------------------------------
  // Case 8: Student cannot bypass authentication using another route or API
  // -------------------------------------------------------------------------
  console.log('\n[Case 8] Student cannot bypass authentication using another route or API...');
  
  // 8a: Access /api/assignments without token
  const unauthAssignRes = await fetch(`${BASE_URL}/api/assignments`);
  if (unauthAssignRes.status !== 401) {
    throw new Error(`Direct unauthenticated call to /api/assignments should return 401, got ${unauthAssignRes.status}`);
  }
  console.log('  -> /api/assignments returned 401 Unauthorized.');

  // 8b: Access /api/code/run without token
  const unauthRunRes = await fetch(`${BASE_URL}/api/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentId: 'lab-1', language: 'Java', code: 'class A{}' })
  });
  if (unauthRunRes.status !== 401) {
    throw new Error(`Direct unauthenticated call to /api/code/run should return 401, got ${unauthRunRes.status}`);
  }
  console.log('  -> /api/code/run returned 401 Unauthorized.');

  // 8c: Access /api/quizzes without token
  const unauthQuizRes = await fetch(`${BASE_URL}/api/quizzes`);
  if (unauthQuizRes.status !== 401) {
    throw new Error(`Direct unauthenticated call to /api/quizzes should return 401, got ${unauthQuizRes.status}`);
  }
  console.log('  -> /api/quizzes returned 401 Unauthorized.');

  // 8d: Student attempts to access faculty-only re-enrollment without faculty credentials
  const unauthReenrollRes = await fetch(`${BASE_URL}/api/auth/re-enroll-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usn: testNewUsn, faceVector: testNewFaceVector })
  });
  if (unauthReenrollRes.status !== 401) {
    throw new Error(`Direct call to /api/auth/re-enroll-face should return 401, got ${unauthReenrollRes.status}`);
  }
  console.log('  -> /api/auth/re-enroll-face returned 401 Unauthorized.');
  console.log('  -> PASS: Case 8 - Student cannot bypass authentication through any route or API.');

  console.log('\n================================================================');
  console.log('ALL 8 MANDATORY FACE AUTHENTICATION TEST CASES PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runFaceAuthTestSuite().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
