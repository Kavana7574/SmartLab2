import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizAttempt, User } from '../../types.ts';
import { api } from '../../services/api.ts';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Send,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers
} from 'lucide-react';

interface AssignedQuizzesTabProps {
  user: User;
}

export const AssignedQuizzesTab: React.FC<AssignedQuizzesTabProps> = ({ user }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active quiz session state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quizAttemptResult, setQuizAttemptResult] = useState<QuizAttempt | null>(null);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.getQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load quizzes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.getQuiz(quiz.id);
      setActiveQuiz(res.quiz);
      setQuizQuestions(res.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});

      if (res.attempt) {
        setQuizAttemptResult(res.attempt);
      } else {
        setQuizAttemptResult(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (quizAttemptResult) return; // Prevent modification after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.submitQuiz(activeQuiz.id, selectedAnswers);
      setQuizAttemptResult(res.attempt);
      // Reload quizzes list to show updated status
      loadQuizzes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If student is currently taking or viewing a quiz
  if (activeQuiz) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="space-y-6">
        {/* Back and Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setActiveQuiz(null);
              setQuizAttemptResult(null);
              loadQuizzes();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assigned Quizzes</span>
          </button>

          {quizAttemptResult ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Score: {quizAttemptResult.score} / {activeQuiz.total_marks} Marks</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Duration: {activeQuiz.duration_minutes} Minutes</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quiz Banner */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                  {activeQuiz.branch} • Sem {activeQuiz.semester}
                </span>
                <span className="text-xs text-slate-400">Faculty: {activeQuiz.faculty_name}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">{activeQuiz.title}</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">{activeQuiz.instructions}</p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Total Marks</div>
              <div className="text-2xl font-black text-purple-400">{activeQuiz.total_marks}</div>
            </div>
          </div>
        </div>

        {/* Quiz Submission Result Summary (If already submitted) */}
        {quizAttemptResult && (
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">Quiz Completed & Automatically Evaluated</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your answers have been securely recorded in the university database.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Obtained Score</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {quizAttemptResult.score} <span className="text-xs font-normal text-slate-400">/ {activeQuiz.total_marks}</span>
              </div>
            </div>
          </div>
        )}

        {/* Question Attend View */}
        {quizQuestions.length > 0 && currentQuestion && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Question Progress Header */}
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-slate-400">
                {quizAttemptResult ? 'Reviewing Submission' : `${answeredCount} of ${quizQuestions.length} Answered`}
              </span>
            </div>

            {/* Question Text */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-bold text-white leading-relaxed">
                  {currentQuestion.question_text}
                </div>
                <div className="text-[11px] text-purple-400 font-semibold">
                  Carries {currentQuestion.marks} Marks
                </div>
              </div>

              {/* 4 Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt;
                  const isSubmitted = !!quizAttemptResult;
                  const isCorrect = (currentQuestion as any).correct_answer === opt;
                  const isStudentChoice = quizAttemptResult?.answers?.[currentQuestion.id] === opt;

                  let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-200';
                  if (isSelected && !isSubmitted) {
                    borderClass = 'border-purple-500 bg-purple-500/10 text-white shadow-md shadow-purple-500/10';
                  } else if (isSubmitted) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200';
                    } else if (isStudentChoice && !isCorrect) {
                      borderClass = 'border-rose-500/80 bg-rose-500/10 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(currentQuestion.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSubmitted && isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                        </span>
                      )}
                      {isSubmitted && isStudentChoice && !isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Your Choice
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {quizQuestions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                        idx === currentQuestionIndex
                          ? 'bg-purple-600 text-white'
                          : selectedAnswers[quizQuestions[idx].id]
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex < quizQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : !quizAttemptResult ? (
                  <button
                    type="button"
                    disabled={isSubmitting || answeredCount === 0}
                    onClick={handleSubmitQuiz}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Evaluating...' : 'Submit Final Quiz'}</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quizzes List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            Assigned Online Quizzes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Attend allocated multiple choice quizzes and evaluate your knowledge in place of traditional viva.
          </p>
        </div>

        <button
          onClick={loadQuizzes}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading assigned quizzes...
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs space-y-2">
          <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No Online Quizzes Currently Allocated</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Your department faculty will publish online multiple-choice quizzes here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => {
            const isAttempted = (quiz as any).attempt_id || (quiz as any).score !== undefined;
            const score = (quiz as any).score;

            return (
              <div
                key={quiz.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                      {quiz.branch} • Sem {quiz.semester}
                    </span>
                    {isAttempted ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pending
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {quiz.instructions || 'Online multiple choice questionnaire evaluation.'}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Total Marks:</span>{' '}
                      <strong className="text-slate-200">{quiz.total_marks}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Duration:</span>{' '}
                      <strong className="text-slate-200">{quiz.duration_minutes} Mins</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Faculty:</span>{' '}
                      <span className="text-purple-300 font-medium">{quiz.faculty_name}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  {isAttempted ? (
                    <div className="text-xs">
                      <span className="text-slate-400">Score Obtained: </span>
                      <strong className="text-emerald-400 font-bold">{score} / {quiz.total_marks}</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Ready to Attend
                    </div>
                  )}

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isAttempted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                    }`}
                  >
                    <span>{isAttempted ? 'Review Quiz' : 'Start Quiz'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
