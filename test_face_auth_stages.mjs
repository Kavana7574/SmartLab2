import { DatabaseSync } from 'node:sqlite';

const BASE_URL = 'http://localhost:3000';
const db = new DatabaseSync('smartlab.db');

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

async function runFaceAuthStagesTest() {
  console.log('================================================================');
  console.log('SMARTLAB FACE AUTHENTICATION STAGE 1 & 2 VERIFICATION TEST');
  console.log('================================================================\n');

  const testUsn = `1MS24TEST${Math.floor(Math.random() * 900 + 100)}`;
  const testUsername = testUsn.toLowerCase();
  const testEmail = `${testUsername}@smartlab.edu`;
  const testPassword = 'Password@123';
  const testFaceSeed = 555;
  const testFaceVector = generateSyntheticFaceVector(testFaceSeed);

  // -------------------------------------------------------------------
  // STAGE 1: REGISTRATION TESTS
  // -------------------------------------------------------------------
  console.log('[STAGE 1] Testing Student Registration & Face Enrollment...');

  // 1.1: Registration without face vector MUST be rejected
  console.log('  1.1 Attempting registration without face enrollment (Must be rejected)...');
  const regNoFaceRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Aarav Sharma',
      usn: testUsn,
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword,
      email: testEmail,
      branch: 'CSE',
      semester: 4,
      faceVector: null // Missing
    })
  });
  const regNoFaceData = await regNoFaceRes.json();
  console.log(`      Status: ${regNoFaceRes.status}, Error: "${regNoFaceData.error}"`);
  if (regNoFaceRes.status !== 400 || !regNoFaceData.error.toLowerCase().includes('face registration is compulsory')) {
    throw new Error('Registration without face template was not blocked!');
  }
  console.log('      -> PASS: Registration without face template strictly blocked.');

  // 1.2: Complete registration with all 8 fields + face template
  console.log('  1.2 Registering new student with Full Name, USN, Username, Password, Email, Branch, Semester + Face Template...');
  const regRes = await fetch(`${BASE_URL}/api/auth/student-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Aarav Sharma',
      usn: testUsn,
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword,
      email: testEmail,
      branch: 'CSE',
      semester: 4,
      faceVector: testFaceVector,
      qualityScore: 98
    })
  });
  const regData = await regRes.json();
  console.log(`      Status: ${regRes.status}, Message: "${regData.message}"`);
  if (regRes.status !== 200 || !regData.message.includes('Face Registration Successful')) {
    throw new Error(`Expected "Face Registration Successful", got: ${JSON.stringify(regData)}`);
  }
  console.log('      -> PASS: "Face Registration Successful" received.');

  // 1.3: Verify backend storage in SQLite
  const storedTemplate = db.prepare('SELECT usn, template_data, quality_score FROM face_templates WHERE usn = ?').get(testUsn);
  if (!storedTemplate) {
    throw new Error(`Face template not found in database for USN: ${testUsn}`);
  }
  const parsedVector = JSON.parse(storedTemplate.template_data);
  if (!Array.isArray(parsedVector) || parsedVector.length !== 128) {
    throw new Error('Stored template vector is invalid or not 128-dimensional!');
  }
  console.log(`      -> PASS: Verified 128-D biometric template securely stored in database for USN ${testUsn}.`);

  // -------------------------------------------------------------------
  // STAGE 2: LOGIN TESTS
  // -------------------------------------------------------------------
  console.log('\n[STAGE 2] Testing Student Login & Mandatory Live Face Verification...');

  // 2.1: Step 1 with wrong password
  console.log('  2.1 Login Step 1: Incorrect password (Must be rejected)...');
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: testUsn,
      password: 'WrongPassword999!',
      branch: 'CSE',
      semester: 4
    })
  });
  const wrongPassData = await wrongPassRes.json();
  console.log(`      Status: ${wrongPassRes.status}, Error: "${wrongPassData.error}"`);
  if (wrongPassRes.status !== 401 || !wrongPassData.error.toLowerCase().includes('password')) {
    throw new Error('Incorrect password was not blocked with HTTP 401!');
  }
  console.log('      -> PASS: Incorrect password blocked.');

  // 2.2: Step 1 with wrong branch / semester
  console.log('  2.2 Login Step 1: Incorrect branch/semester (Must be rejected)...');
  const wrongBranchRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: testUsn,
      password: testPassword,
      branch: 'ME', // Wrong
      semester: 4
    })
  });
  const wrongBranchData = await wrongBranchRes.json();
  console.log(`      Status: ${wrongBranchRes.status}, Error: "${wrongBranchData.error}"`);
  if (wrongBranchRes.status !== 401 || !wrongBranchData.error.includes('branch/semester')) {
    throw new Error('Incorrect branch was not blocked!');
  }
  console.log('      -> PASS: Incorrect branch/semester blocked.');

  // 2.3: Step 1 with student having no face template
  console.log('  2.3 Login Step 1: Student without registered face template...');
  // Insert temporary student without face template
  const noFaceUsn = '1MS24NOFACE';
  const salt = 'testsalt123';
  const pass = 'CorrectPass123';
  import('node:crypto').then(async (crypto) => {});
  const crypto = await import('node:crypto');
  const hash = crypto.pbkdf2Sync(pass, salt, 1000, 64, 'sha512').toString('hex');

  db.prepare(`
    INSERT OR REPLACE INTO users (id, role, name, username, password_hash, salt, email, branch, semester, usn, status, created_at)
    VALUES ('usr_noface', 'student', 'No Face Student', 'noface', ?, ?, 'noface@smartlab.edu', 'CSE', 4, ?, 'active', datetime('now'))
  `).run(hash, salt, noFaceUsn);
  db.prepare('DELETE FROM face_templates WHERE usn = ?').run(noFaceUsn);

  const noTemplateRes = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: noFaceUsn,
      password: pass,
      branch: 'CSE',
      semester: 4
    })
  });
  const noTemplateData = await noTemplateRes.json();
  console.log(`      Status: ${noTemplateRes.status}, Error: "${noTemplateData.error}"`);
  if (!noTemplateData.error.includes('Face registration not completed. Contact faculty.')) {
    throw new Error(`Expected "Face registration not completed. Contact faculty.", got: ${noTemplateData.error}`);
  }
  console.log('      -> PASS: Exact message "Face registration not completed. Contact faculty." returned.');

  // 2.4: Step 1 with valid credentials
  console.log('  2.4 Login Step 1: Valid credentials (USN + Password + Branch + Semester)...');
  const step1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usn: testUsn,
      password: testPassword,
      branch: 'CSE',
      semester: 4
    })
  });
  const step1Data = await step1Res.json();
  if (!step1Res.ok || !step1Data.challengeToken) {
    throw new Error(`Step 1 failed: ${JSON.stringify(step1Data)}`);
  }
  console.log(`      -> PASS: Step 1 succeeded. Challenge token issued for ${step1Data.name} (${step1Data.usn}).`);

  // 2.5: Step 2: Live Face Verification with DIFFERENT person's face (Must be blocked)
  console.log('  2.5 Login Step 2: Presenting a different person\'s face (Must be rejected)...');
  const differentPersonFace = generateSyntheticFaceVector(999); // Impostor vector
  const mismatchRes = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: step1Data.challengeToken,
      usn: testUsn,
      liveFaceVector: differentPersonFace
    })
  });
  const mismatchData = await mismatchRes.json();
  console.log(`      Status: ${mismatchRes.status}, Error: "${mismatchData.error}"`);
  if (mismatchRes.status !== 401 || !mismatchData.error.includes('Face does not match. Please try again.')) {
    throw new Error(`Expected "Face does not match. Please try again.", got: ${JSON.stringify(mismatchData)}`);
  }
  console.log('      -> PASS: Impostor blocked with exact message "Face does not match. Please try again."');

  // 2.6: Step 2: Live Face Verification with MATCHING face (Must be granted)
  console.log('  2.6 Login Step 2: Presenting the MATCHING face vector (Must grant access)...');
  const matchRes = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: step1Data.challengeToken,
      usn: testUsn,
      liveFaceVector: testFaceVector,
      livenessData: {
        livenessScore: 98,
        challengePassed: true,
        method: 'live_camera',
        timestamp: Date.now()
      }
    })
  });
  const matchData = await matchRes.json();
  console.log(`      Status: ${matchRes.status}, Token Issued: ${Boolean(matchData.token)}, User: ${matchData.user?.name}`);
  if (matchRes.status !== 200 || !matchData.token || !matchData.matched) {
    throw new Error(`Matching face was not granted access: ${JSON.stringify(matchData)}`);
  }
  console.log('      -> PASS: Access granted with matching live face! Token issued.');

  // 2.7: Step 2: Verify Protected Student Dashboard API with issued token
  console.log('  2.7 Verifying access to Student Dashboard API with biometric token...');
  const dashRes = await fetch(`${BASE_URL}/api/assignments`, {
    headers: { 'Authorization': `Bearer ${matchData.token}` }
  });
  const dashData = await dashRes.json();
  console.log(`      Status: ${dashRes.status}, Assignments count: ${dashData.assignments?.length}`);
  if (dashRes.status !== 200) {
    throw new Error('Student could not access dashboard with biometric token!');
  }
  console.log('      -> PASS: Student Dashboard accessed successfully.');

  console.log('\n================================================================');
  console.log('ALL STAGE 1 & STAGE 2 FACE AUTHENTICATION TESTS PASSED 100%!');
  console.log('================================================================\n');
}

runFaceAuthStagesTest().catch(err => {
  console.error('\nSTAGE TEST FAILED:', err);
  process.exit(1);
});
