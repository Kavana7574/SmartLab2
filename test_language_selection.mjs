import { DatabaseSync } from 'node:sqlite';

const BASE_URL = 'http://localhost:3000';

async function testLanguageSelection() {
  console.log('====================================================');
  console.log('TESTING PROGRAMMING LANGUAGE SELECTION & EXECUTION');
  console.log('====================================================\n');

  // Step 1: Faculty Login
  const facLoginRes = await fetch(`${BASE_URL}/api/auth/faculty-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavesh_ise', identifier: 'bhavesh_ise', password: 'Faculty@123' })
  });
  const facCookie = facLoginRes.headers.get('set-cookie')?.split(';')[0] || '';

  // Step 2: Faculty creates assignment with single required language (Java)
  console.log('[Test 1] Faculty creates assignment with Single Required Language (Java)...');
  const labJavaOnlyRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': facCookie },
    body: JSON.stringify({
      title: 'Lab 5 – Prime Number Check (Java Only)',
      subject: 'Algorithms Laboratory',
      labNumber: 5,
      problemStatement: 'Check whether an integer N is prime.',
      instructions: 'Input integer N from stdin and print "PRIME" or "NOT PRIME".',
      permittedLanguages: ['Java'],
      maxMarks: 20,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      branch: 'ISE',
      semester: 5,
      allocationType: 'all'
    })
  });
  const labJavaOnly = await labJavaOnlyRes.json();
  const javaLabId = labJavaOnly.assignmentId;
  console.log(`  -> Created Java-only lab with ID: ${javaLabId}`);

  // Step 3: Faculty creates assignment with Multiple Permitted Languages (C, C++, Java, Python, SQL)
  console.log('\n[Test 2] Faculty creates assignment with Multiple Permitted Languages (All 5)...');
  const labAllLangsRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': facCookie },
    body: JSON.stringify({
      title: 'Lab 6 – Multi-Language Prime & Table Query',
      subject: 'Algorithms Laboratory',
      labNumber: 6,
      problemStatement: 'Solve using any permitted programming language.',
      instructions: 'Choose from C, C++, Java, Python, or SQL.',
      permittedLanguages: ['C', 'C++', 'Java', 'Python', 'SQL'],
      maxMarks: 20,
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      branch: 'ISE',
      semester: 5,
      allocationType: 'all'
    })
  });
  const labAllLangs = await labAllLangsRes.json();
  const allLangsLabId = labAllLangs.assignmentId;
  console.log(`  -> Created multi-language lab with ID: ${allLangsLabId}`);

  // Step 4: Student Login
  console.log('\n[Test 3] Student Login via Biometrics (Kavana)...');
  const step1Res = await fetch(`${BASE_URL}/api/auth/student-login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usn: '1MS22IS025', password: 'Student@123', branch: 'ISE', semester: 5 })
  });
  const step1Data = await step1Res.json();

  const step2Res = await fetch(`${BASE_URL}/api/auth/student-login-step2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: step1Data.challengeToken,
      usn: '1MS22IS025',
      useSampleBypass: true,
      liveFaceVector: 'DEMO_MATCH'
    })
  });
  const stData = await step2Res.json();
  const studentToken = stData.token;
  const studentCookie = step2Res.headers.get('set-cookie')?.split(';')[0] || '';
  const studentHeaders = {
    'Cookie': studentCookie,
    'Authorization': `Bearer ${studentToken}`,
    'Content-Type': 'application/json'
  };

  // Step 5: Test language constraint violation on Java-only lab
  console.log('\n[Test 4] Attempting to run C on Java-only assignment (Must be rejected)...');
  const rejectRes = await fetch(`${BASE_URL}/api/code/run`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      assignmentId: javaLabId,
      language: 'c',
      code: '#include <stdio.h>\nint main() { return 0; }'
    })
  });
  const rejectData = await rejectRes.json();
  console.log(`  -> Response status: ${rejectRes.status}, error: "${rejectData.error}"`);
  if (rejectRes.status !== 400 || !rejectData.error.includes('not permitted')) {
    throw new Error('Language restriction failed! Non-permitted language was not rejected.');
  }
  console.log('  -> PASS: Non-permitted language was correctly blocked with HTTP 400.');

  // Step 6: Test all 5 languages executing with real compilers on multi-language lab
  console.log('\n[Test 5] Executing real compilers for all 5 languages on multi-language assignment...');

  const languageTests = [
    {
      lang: 'c',
      code: '#include <stdio.h>\nint main() { printf("Hello from C GCC\\n"); return 0; }',
      expectedSubstr: 'Hello from C GCC',
      expectedEngine: 'gcc'
    },
    {
      lang: 'cpp',
      code: '#include <iostream>\nint main() { std::cout << "Hello from C++ G++" << std::endl; return 0; }',
      expectedSubstr: 'Hello from C++ G++',
      expectedEngine: 'g++'
    },
    {
      lang: 'java',
      code: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java OpenJDK"); } }',
      expectedSubstr: 'Hello from Java OpenJDK',
      expectedEngine: 'openjdk'
    },
    {
      lang: 'python',
      code: 'print("Hello from Python 3")',
      expectedSubstr: 'Hello from Python 3',
      expectedEngine: 'python-sandbox'
    },
    {
      lang: 'sql',
      code: 'SELECT name, branch, semester FROM students ORDER BY name LIMIT 3;',
      expectedSubstr: 'Devika',
      expectedEngine: 'sqlite-sandbox'
    }
  ];

  for (const t of languageTests) {
    await new Promise(r => setTimeout(r, 600)); // debounce
    const execRes = await fetch(`${BASE_URL}/api/code/run`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        assignmentId: allLangsLabId,
        language: t.lang,
        code: t.code
      })
    });
    const data = await execRes.json();
    console.log(`  -> [${t.lang.toUpperCase()}] status: ${execRes.status}, engine: ${data.engine}, success: ${data.success}`);
    if (!data.success) {
      throw new Error(`Execution failed for ${t.lang}: ${data.error || data.stderr}`);
    }
    const combinedOutput = (data.stdout || '') + ' ' + (data.tableMarkdown || '') + ' ' + (data.output || '');
    if (!combinedOutput.includes(t.expectedSubstr)) {
      throw new Error(`Output for ${t.lang} did not match expected "${t.expectedSubstr}". Got:\n${combinedOutput}`);
    }
    console.log(`     Output matched: "${t.expectedSubstr}" via real engine: ${data.engine}`);
  }

  // Step 7: Submit with selected language
  console.log('\n[Test 6] Submitting solution with selected language (C++)...');
  await new Promise(r => setTimeout(r, 600));
  const submitRes = await fetch(`${BASE_URL}/api/code/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      assignmentId: allLangsLabId,
      language: 'cpp',
      code: '#include <iostream>\nint main() { std::cout << "Submitted prime solution" << std::endl; return 0; }',
      pasteEventsCount: 0,
      activeSeconds: 120
    })
  });
  const submitData = await submitRes.json();
  console.log(`  -> Submit status: ${submitRes.status}, success: ${submitData.success}, marks: ${submitData.marks}`);
  if (submitRes.status !== 200 || !submitData.success) {
    throw new Error(`Submit failed: ${JSON.stringify(submitData)}`);
  }
  console.log('  -> PASS: Submission saved with selected language cpp and evaluated successfully.');

  console.log('\n====================================================');
  console.log('ALL PROGRAMMING LANGUAGE SELECTION & EXECUTION TESTS PASSED!');
  console.log('====================================================\n');
}

testLanguageSelection().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
