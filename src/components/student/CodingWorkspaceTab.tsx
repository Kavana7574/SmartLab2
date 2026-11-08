import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Save, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileCode2, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Layers,
  Sparkles,
  Info,
  Database,
  Code2,
  Check,
  ArrowRight,
  BookOpen,
  Award,
  Calendar,
  Lock
} from 'lucide-react';
import { Assignment, ProgrammingLanguage, ALL_LANGUAGES, ExecutionResponse } from '../../types.ts';
import { api } from '../../services/api.ts';

interface CodingWorkspaceTabProps {
  currentAssignment: Assignment | null;
  onClearAssignment?: () => void;
  onSubmissionSuccess?: () => void;
}

interface LanguageMetadata {
  id: ProgrammingLanguage;
  name: string;
  compiler: string;
  extension: string;
  description: string;
  tagline: string;
  badgeColor: string;
}

const LANGUAGE_DETAILS: Record<ProgrammingLanguage, LanguageMetadata> = {
  C: {
    id: 'C',
    name: 'C Programming',
    compiler: 'GCC 12.3 (Native Linux)',
    extension: '.c',
    description: 'Procedural systems programming with pointers, memory allocation, and standard math library (-lm).',
    tagline: 'Compiled with GCC • Native Sandbox',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
  },
  'C++': {
    id: 'C++',
    name: 'C++ Programming',
    compiler: 'G++ 12.3 (C++17 ISO)',
    extension: '.cpp',
    description: 'High-performance object-oriented programming with STL (vector, map, algorithm) and iostream.',
    tagline: 'Compiled with G++ • Native Sandbox',
    badgeColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
  },
  Java: {
    id: 'Java',
    name: 'Java Programming',
    compiler: 'OpenJDK 17.0 JVM',
    extension: '.java',
    description: 'Object-oriented programming running on OpenJDK 17 with Scanner, Classes, and Java Collections.',
    tagline: 'Compiled with Javac • OpenJDK 17',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
  },
  Python: {
    id: 'Python',
    name: 'Python 3',
    compiler: 'Python 3.10+ Sandbox',
    extension: '.py',
    description: 'Dynamic scripting with clean syntax, standard libraries, and isolated process execution.',
    tagline: 'Interpreted with Python 3 • Secure Sandbox',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  SQL: {
    id: 'SQL',
    name: 'SQL Database',
    compiler: 'SQLite Database Sandbox',
    extension: '.sql',
    description: 'Relational database query engine with pre-seeded college tables (students, courses, enrollments, faculty).',
    tagline: 'In-Memory SQLite • Pre-Seeded Tables',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
  }
};

const getProblemTemplate = (lang: ProgrammingLanguage, assignmentTitle = '', problem = ''): string => {
  const isPrime = assignmentTitle.toLowerCase().includes('prime') || problem.toLowerCase().includes('prime');

  if (lang === 'Java') {
    if (isPrime) {
      return `import java.util.Scanner;

public class Main {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter an integer: ");
        int num = sc.hasNextInt() ? sc.nextInt() : 7;
        if (isPrime(num)) {
            System.out.println("Prime Number");
        } else {
            System.out.println("Not a Prime Number");
        }
    }
}`;
    }
    return `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your Java solution here
        System.out.println("Hello SmartLab!");
    }
}`;
  }

  if (lang === 'Python') {
    if (isPrime) {
      return `# Python Program: Check Whether a Number Is Prime
def is_prime(n: int) -> bool:
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def main():
    import sys
    raw = sys.stdin.read().strip()
    num = int(raw) if raw.isdigit() else 7
    if is_prime(num):
        print("Prime Number")
    else:
        print("Not a Prime Number")

if __name__ == "__main__":
    main()
`;
    }
    return `# Write your Python program below
def main():
    print("Hello SmartLab!")

if __name__ == "__main__":
    main()
`;
  }

  if (lang === 'C') {
    if (isPrime) {
      return `#include <stdio.h>
#include <stdbool.h>

bool isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

int main() {
    int num = 7;
    printf("Enter number: ");
    if (scanf("%d", &num) == 1) {
        if (isPrime(num)) {
            printf("Prime Number\\n");
        } else {
            printf("Not a Prime Number\\n");
        }
    }
    return 0;
}
`;
    }
    return `#include <stdio.h>

int main() {
    // Write your C program here
    printf("Hello SmartLab!\\n");
    return 0;
}
`;
  }

  if (lang === 'C++') {
    if (isPrime) {
      return `#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

int main() {
    int num = 7;
    cout << "Enter number: ";
    if (cin >> num) {
        if (isPrime(num)) {
            cout << "Prime Number" << endl;
        } else {
            cout << "Not a Prime Number" << endl;
        }
    }
    return 0;
}
`;
    }
    return `#include <iostream>
using namespace std;

int main() {
    // Write your C++ program here
    cout << "Hello SmartLab!" << endl;
    return 0;
}
`;
  }

  if (lang === 'SQL') {
    return `-- SQLite Sandbox with Pre-Seeded College Tables:
-- 1. students (usn, name, branch, semester, gpa)
-- 2. courses (course_id, course_name, credits, dept)
-- 3. enrollments (id, usn, course_id, semester, grade)
-- 4. faculty (faculty_id, name, department, designation)

SELECT usn, name, branch, semester, gpa 
FROM students 
WHERE gpa >= 9.0
ORDER BY gpa DESC;
`;
  }

  return '// Start coding...';
};

export const CodingWorkspaceTab: React.FC<CodingWorkspaceTabProps> = ({
  currentAssignment,
  onClearAssignment,
  onSubmissionSuccess
}) => {
  // Determine available languages based on faculty assignment settings
  const availableLanguages: ProgrammingLanguage[] = currentAssignment?.permitted_languages?.length
    ? currentAssignment.permitted_languages
    : ALL_LANGUAGES;

  const isSingleLanguageRequired = availableLanguages.length === 1;

  // Language state & selection gateway
  const [language, setLanguage] = useState<ProgrammingLanguage>(availableLanguages[0] || 'Java');
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);
  const [isProblemExpanded, setIsProblemExpanded] = useState<boolean>(true);
  
  // Execution & Submissions
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [compilationCount, setCompilationCount] = useState<number>(0);
  const [assignmentExecutions, setAssignmentExecutions] = useState<number>(0);
  const [remainingFree, setRemainingFree] = useState<number>(5);
  const [executionPenalty, setExecutionPenalty] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // In-UI Modals
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);

  const editorRef = useRef<any>(null);

  // Sync state when currentAssignment changes
  useEffect(() => {
    if (currentAssignment) {
      const permitted = currentAssignment.permitted_languages?.length
        ? currentAssignment.permitted_languages
        : ALL_LANGUAGES;
      
      const defaultLang = permitted[0] || 'Java';
      setLanguage(defaultLang);
      
      // Check if student already started code in this assignment
      const draftKey = `smartlab_code_${currentAssignment.id}_${defaultLang}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setCode(savedDraft);
        setIsLanguageSelected(true);
      } else {
        setCode(getProblemTemplate(defaultLang, currentAssignment.title, currentAssignment.problem_statement));
        // Show language selection screen if more than 1 language permitted, or auto-confirm if single
        setIsLanguageSelected(false);
      }

      // Query passive execution stats (Never deducts marks on view)
      api.getAssignmentExecutionStats(currentAssignment.id)
        .then(stats => {
          if (stats) {
            setAssignmentExecutions(stats.totalExecutions ?? 0);
            setRemainingFree(stats.remainingFreeExecutions ?? 5);
            setExecutionPenalty(stats.executionPenalty ?? 0);
          }
        })
        .catch(() => {});
    } else {
      setCode(getProblemTemplate(language));
      setIsLanguageSelected(true);
      setAssignmentExecutions(0);
      setRemainingFree(5);
      setExecutionPenalty(0);
    }
  }, [currentAssignment]);

  // When language is changed
  const handleSelectLanguage = (newLang: ProgrammingLanguage) => {
    setLanguage(newLang);
    if (currentAssignment) {
      const draftKey = `smartlab_code_${currentAssignment.id}_${newLang}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setCode(savedDraft);
      } else {
        setCode(getProblemTemplate(newLang, currentAssignment.title, currentAssignment.problem_statement));
      }
    } else {
      setCode(getProblemTemplate(newLang));
    }
    setExecutionResult(null);
  };

  // Confirm language selection and unlock editor
  const handleConfirmLanguageAndProceed = () => {
    setIsLanguageSelected(true);
  };

  // Handle Monaco mount and paste tracking
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    editor.onDidPaste((e: any) => {
      try {
        const pastedText = editor.getModel()?.getValueInRange(e.range) || '';
        const charCount = pastedText.length;
        
        api.logPasteEvent({
          assignmentId: currentAssignment?.id,
          characterCount: charCount,
          snippet: pastedText.substring(0, 150)
        });

        if (charCount > 150) {
          setStatusMessage({
            type: 'info',
            text: `Paste event (${charCount} characters) logged for faculty monitoring audit.`
          });
          setTimeout(() => setStatusMessage(null), 4000);
        }
      } catch (err) {
        console.error('Paste recording error:', err);
      }
    });
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setStatusMessage({ type: 'error', text: 'Editor is empty. Write code before executing.' });
      return;
    }

    setIsRunning(true);
    setStatusMessage(null);

    try {
      const res = await api.runCode({
        language,
        code,
        stdin,
        assignmentId: currentAssignment?.id
      });

      setExecutionResult(res);
      if (res.studentCompilationCount !== undefined) {
        setCompilationCount(res.studentCompilationCount);
      }
      if (res.assignmentExecution) {
        setAssignmentExecutions(res.assignmentExecution.totalExecutions);
        setRemainingFree(res.assignmentExecution.remainingFreeExecutions);
        setExecutionPenalty(res.assignmentExecution.executionPenalty);
      }
    } catch (err: any) {
      setExecutionResult({
        status: 'runtime_error',
        output: '',
        error: err.message || 'Execution failed',
        executionTimeMs: 0,
        engine: 'error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleInitiateSubmit = () => {
    if (!currentAssignment) {
      setStatusMessage({ type: 'error', text: 'No assignment selected to submit to.' });
      return;
    }

    if (!code.trim()) {
      setStatusMessage({ type: 'error', text: 'Please write and test your code before submitting.' });
      return;
    }

    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!currentAssignment) return;
    setShowSubmitModal(false);
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await api.submitCode({
        assignmentId: currentAssignment.id,
        code,
        language,
        executionResult: executionResult?.output || 'Code submitted by student'
      });

      setStatusMessage({
        type: 'success',
        text: res.message || 'Solution submitted successfully! Status: Pending Faculty Evaluation.'
      });

      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (currentAssignment) {
      localStorage.setItem(`smartlab_code_${currentAssignment.id}_${language}`, code);
      setStatusMessage({ type: 'success', text: `Draft saved for ${language}.` });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleClearCode = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setCode('');
    setExecutionResult(null);
    setShowClearModal(false);
  };

  const getMonacoLanguage = (lang: ProgrammingLanguage): string => {
    switch (lang) {
      case 'C': return 'c';
      case 'C++': return 'cpp';
      case 'Java': return 'java';
      case 'Python': return 'python';
      case 'SQL': return 'sql';
      default: return 'java';
    }
  };

  // Helper to insert quick SQL queries
  const insertSqlQuery = (sql: string) => {
    setCode(sql);
    if (editorRef.current) {
      editorRef.current.setValue(sql);
    }
  };

  // =========================================================================
  // VIEW 1: LANGUAGE SELECTION SCREEN (Before displaying the code editor)
  // =========================================================================
  if (!isLanguageSelected && currentAssignment) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        
        {/* Assignment Question & Overview Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono text-xs font-bold">
                Lab {currentAssignment.lab_number}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {currentAssignment.subject}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Max: <strong className="text-white">{currentAssignment.max_marks} pts</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Deadline: <strong className="text-white">{currentAssignment.due_date}</strong></span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-2">
              {currentAssignment.title}
            </h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Problem Statement:
              </span>
              {currentAssignment.problem_statement}
            </div>
            {currentAssignment.instructions && (
              <div className="mt-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Instructions & Guidelines:
                </span>
                {currentAssignment.instructions}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: CHOOSE YOUR PROGRAMMING LANGUAGE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  Choose Your Programming Language
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select the programming language you will use to write and execute your solution.
                {isSingleLanguageRequired ? (
                  <span className="text-amber-400 font-semibold ml-1">
                    (Faculty has enforced a required language for this lab).
                  </span>
                ) : (
                  <span className="text-slate-300 ml-1">
                    Choose from the faculty-permitted options below.
                  </span>
                )}
              </p>
            </div>

            {/* Dropdown Selector Option */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Quick Select:</span>
              <select
                value={language}
                onChange={(e) => handleSelectLanguage(e.target.value as ProgrammingLanguage)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang} {isSingleLanguageRequired ? ' (Required)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selectable Cards for C, C++, Java, Python, SQL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_LANGUAGES.map((langKey) => {
              const details = LANGUAGE_DETAILS[langKey];
              const isPermitted = availableLanguages.includes(langKey);
              const isSelected = language === langKey;

              return (
                <div
                  key={langKey}
                  onClick={() => {
                    if (isPermitted) handleSelectLanguage(langKey);
                  }}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isPermitted ? 'cursor-pointer hover:-translate-y-0.5' : 'opacity-40 cursor-not-allowed bg-slate-950/40 border-slate-900'
                  } ${
                    isSelected && isPermitted
                      ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-extrabold border ${details.badgeColor}`}>
                          {langKey}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {details.name}
                        </h4>
                      </div>

                      {isSelected && isPermitted && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {details.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      {details.compiler}
                    </span>
                    {isPermitted ? (
                      isSingleLanguageRequired ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Permitted
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Not Permitted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button: Proceed to Editor */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Selected Environment: <strong className="text-white font-mono">{language}</strong> ({LANGUAGE_DETAILS[language].compiler})
            </div>

            <button
              onClick={handleConfirmLanguageAndProceed}
              disabled={!availableLanguages.includes(language)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-xl shadow-blue-600/30 transition cursor-pointer"
            >
              <span>Start Coding in {language}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DYNAMIC CODING WORKSPACE (Editor, Runner, Output, SQL Tables)
  // =========================================================================
  const monacoLanguage = getMonacoLanguage(language);

  return (
    <div className="flex flex-col space-y-4">
      
      {/* SECTION 3: ASSIGNMENT CONNECTIVITY - QUESTION REMAINS PROMINENTLY VISIBLE ABOVE EDITOR */}
      {currentAssignment && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition">
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold text-xs border border-blue-500/30">
                Lab {currentAssignment.lab_number}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentAssignment.title}</span>
                  <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                    ({currentAssignment.subject})
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 hidden md:inline">
                {currentAssignment.max_marks} Marks • Due {currentAssignment.due_date}
              </span>
              
              <button
                onClick={() => setIsProblemExpanded(!isProblemExpanded)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                <span>{isProblemExpanded ? 'Collapse Question' : 'View Full Question'}</span>
                {isProblemExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Question Text Box (Remains Above the Code Editor) */}
          {isProblemExpanded && (
            <div className="p-4 space-y-3 bg-slate-900/60">
              <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  Problem Statement:
                </span>
                {currentAssignment.problem_statement}
              </div>

              {currentAssignment.instructions && (
                <div className="text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Instructions & Expected Output:
                  </span>
                  {currentAssignment.instructions}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Coding Editor Container */}
      <div className="h-[calc(100vh-14rem)] min-h-[580px] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Top Toolbar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: Language Selection & Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${LANGUAGE_DETAILS[language].badgeColor}`}>
                {language}
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                {LANGUAGE_DETAILS[language].compiler}
              </span>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <span className="text-slate-400 font-medium hidden sm:inline">Switch:</span>
              <select
                value={language}
                onChange={(e) => handleSelectLanguage(e.target.value as ProgrammingLanguage)}
                disabled={isSingleLanguageRequired}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {availableLanguages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              {!isSingleLanguageRequired && (
                <button
                  onClick={() => setIsLanguageSelected(false)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 ml-1 cursor-pointer underline"
                >
                  Cards
                </button>
              )}
            </div>

            {/* SQL Schema Helper Button if in SQL mode */}
            {language === 'SQL' && (
              <button
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  showSqlSchema 
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="View Available Database Tables"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>College Schema Tables</span>
              </button>
            )}
          </div>

          {/* Right: Actions & Automatic Execution Limit Display */}
          <div className="flex items-center gap-2">
            
            {/* Automatic Execution Counter & Penalty Display */}
            {currentAssignment && (
              <div className="flex items-center">
                {assignmentExecutions <= 5 ? (
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]"
                    title="Each assignment allows 5 free code executions. Executions 1–5 do not reduce marks."
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Free Runs:</span>
                    <span className="font-bold text-white bg-emerald-900/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
                      {remainingFree} / 5
                    </span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-[11px]"
                    title={`Execution limit exceeded. Penalty formula FLOOR((${assignmentExecutions} - 1) / 5) = ${executionPenalty} mark(s) deducted.`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Runs: <strong className="text-white">{assignmentExecutions}</strong></span>
                    <span className="text-rose-300 font-bold bg-rose-500/20 px-1.5 py-0.2 rounded border border-rose-500/30">
                      Penalty: -{executionPenalty} mark{executionPenalty === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowStdin(!showStdin)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                showStdin 
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Custom Stdin Input"
            >
              Custom Stdin
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
              title="Save Draft Locally"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              onClick={handleClearCode}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-medium transition cursor-pointer"
              title="Clear Code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* RUN CODE BUTTON */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            {/* SUBMIT CODE BUTTON */}
            {currentAssignment && (
              <button
                onClick={handleInitiateSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-600/30 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Code'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className={`px-4 py-2 text-xs flex items-center gap-2 ${
            statusMessage.type === 'error' ? 'bg-rose-950/80 text-rose-300 border-b border-rose-800' :
            statusMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' :
            'bg-blue-950/80 text-blue-300 border-b border-blue-800'
          }`}>
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Custom Stdin Drawer */}
        {showStdin && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Standard Input (stdin):
            </label>
            <textarea
              rows={2}
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter test inputs here (e.g. 7 or space/newline-separated numbers)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* SQL Schema Reference Panel (For SQL Mode) */}
        {language === 'SQL' && showSqlSchema && (
          <div className="bg-slate-900/90 border-b border-slate-800 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                Pre-Seeded College Database Tables (Available in SQLite Sandbox)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => insertSqlQuery('SELECT * FROM students;')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono cursor-pointer"
                >
                  Query Students
                </button>
                <button
                  onClick={() => insertSqlQuery('SELECT * FROM courses;')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono cursor-pointer"
                >
                  Query Courses
                </button>
                <button
                  onClick={() => insertSqlQuery('SELECT * FROM enrollments;')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono cursor-pointer"
                >
                  Query Enrollments
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-1 text-xs">students</strong>
                <span className="text-slate-400">usn (PK), name, branch, semester, gpa</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-1 text-xs">courses</strong>
                <span className="text-slate-400">course_id (PK), course_name, credits, dept</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-1 text-xs">enrollments</strong>
                <span className="text-slate-400">id, usn, course_id, semester, grade</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-1 text-xs">faculty</strong>
                <span className="text-slate-400">faculty_id (PK), name, department, designation</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Body: Monaco Editor & Output Console */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left/Top: Monaco Code Editor */}
          <div className="flex-1 flex flex-col min-h-[300px]">
            <Editor
              height="100%"
              language={monacoLanguage}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on'
              }}
            />
          </div>

          {/* Right/Bottom: Output & Terminal Console */}
          <div className="w-full md:w-96 lg:w-[450px] border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
            
            <div className="p-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Execution Console
              </span>

              {executionResult && (
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${
                    executionResult.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                    executionResult.status === 'compilation_error' ? 'bg-rose-500/20 text-rose-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {executionResult.status.toUpperCase()}
                  </span>
                  <span className="text-slate-400">Engine: <span className="text-blue-300">{executionResult.engine}</span></span>
                  <span className="text-slate-400">{executionResult.executionTimeMs}ms</span>
                </div>
              )}
            </div>

            {/* Console Content */}
            <div className="p-3 overflow-y-auto font-mono text-xs flex-1 space-y-2 select-text">
              {isRunning && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Compiling and executing in {language} runtime environment...</span>
                </div>
              )}

              {!isRunning && !executionResult && (
                <div className="text-slate-500 italic space-y-1">
                  <p>Click &quot;Run Code&quot; to compile and execute program in {LANGUAGE_DETAILS[language].compiler}.</p>
                  <p className="text-[11px] text-slate-600">Output, diagnostics, test case results, and queries will appear here.</p>
                </div>
              )}

              {executionResult && (
                <>
                  {/* Compilation / Runtime Errors */}
                  {executionResult.error && (
                    <div className="bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-lg text-rose-300 whitespace-pre-wrap">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                        Diagnostic / Compiler Error:
                      </div>
                      {executionResult.error}
                    </div>
                  )}

                  {/* Program Output */}
                  {executionResult.output && (
                    <div className="text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      {executionResult.output}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Modal for Submit Code */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <Send className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Submit Laboratory Solution</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to submit your <strong className="text-white">{language}</strong> solution for <strong className="text-white">&quot;{currentAssignment?.title}&quot;</strong>?
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div>Language: <span className="font-mono text-blue-300 font-semibold">{language}</span></div>
              <div>Total Executions: <span className="font-mono text-white font-semibold">{assignmentExecutions}</span></div>
              <div>Current Penalty: <span className="font-mono text-rose-300 font-semibold">-{executionPenalty} Marks</span></div>
              <p className="text-[10px] text-slate-500 pt-1">
                Your code and execution metrics will be recorded and evaluated automatically by the faculty system.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Solution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear Editor */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Clear Code Editor</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to clear all code from the editor? Any unsaved edits will be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Yes, Clear Code
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
