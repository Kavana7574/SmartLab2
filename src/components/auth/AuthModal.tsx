import React, { useState } from 'react';
import { 
  User as UserIcon, 
  GraduationCap, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  UserPlus,
  LogIn,
  IdCard,
  Building2,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  ScanFace,
  UserCheck
} from 'lucide-react';
import { ALL_BRANCHES, ALL_SEMESTERS, Branch, User } from '../../types.ts';
import { api, setStoredToken } from '../../services/api.ts';
import { ForgotPasswordModal } from './ForgotPasswordModal.tsx';
import { FaceCaptureModal } from './FaceCaptureModal.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

type AuthMode = 'student_login' | 'student_register' | 'faculty_login' | 'faculty_register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  // Primary active mode
  const [activeMode, setActiveMode] = useState<AuthMode>('student_login');

  // Student Login Fields (Requirement 2)
  const [studentUsn, setStudentUsn] = useState('1MS22IS025');
  const [studentPassword, setStudentPassword] = useState('Student@123');
  const [studentBranch, setStudentBranch] = useState<Branch>('ISE');
  const [studentSemester, setStudentSemester] = useState<number>(5);
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Faculty Login Fields
  const [facultyId, setFacultyId] = useState('bhavesh_ise');
  const [facultyPassword, setFacultyPassword] = useState('Faculty@123');
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);

  // Student Registration Fields (Requirement 1: Full Name, USN, Password, Confirm, Branch, Semester, Face Auth)
  const [regFullName, setRegFullName] = useState('');
  const [regUsn, setRegUsn] = useState('');
  const [regBranch, setRegBranch] = useState<Branch>('ISE');
  const [regSemester, setRegSemester] = useState<number>(5);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCapturedVector, setRegCapturedVector] = useState<number[] | null>(null);
  const [regCapturedPhoto, setRegCapturedPhoto] = useState<string | null>(null);
  const [regFaceQuality, setRegFaceQuality] = useState<number>(95);
  const [biometricConsent, setBiometricConsent] = useState<boolean>(true);

  // Admin Faculty Creation Fields
  const [adminKey, setAdminKey] = useState('');
  const [facFullName, setFacFullName] = useState('');
  const [facId, setFacId] = useState('');
  const [facUsername, setFacUsername] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facDept, setFacDept] = useState<Branch>('ISE');
  const [facPassword, setFacPassword] = useState('');
  const [facConfirmPassword, setFacConfirmPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authStatusText, setAuthStatusText] = useState<string>('');

  // Face Authentication Challenge & Modal State
  const [pendingChallenge, setPendingChallenge] = useState<{ challengeToken: string; usn: string; name: string } | null>(null);
  const [showFaceModal, setShowFaceModal] = useState<boolean>(false);
  const [faceModalMode, setFaceModalMode] = useState<'login' | 'register'>('login');
  const [faceModalError, setFaceModalError] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);

  if (!isOpen) return null;

  // Quick Demo Account Preloader (Autofills credentials for evaluators)
  const handlePreloadDemo = (type: 'faculty' | 'devika' | 'kavana' | 'kanika' | 'chaitanya') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingChallenge(null);

    if (type === 'faculty') {
      setActiveMode('faculty_login');
      setFacultyId('bhavesh_ise');
      setFacultyPassword('Faculty@123');
    } else {
      setActiveMode('student_login');
      setStudentPassword('Student@123');
      setStudentBranch('ISE');
      setStudentSemester(5);

      if (type === 'kavana') setStudentUsn('1MS22IS025');
      if (type === 'devika') setStudentUsn('1MS22IS018');
      if (type === 'kanika') setStudentUsn('1MS22IS022');
      if (type === 'chaitanya') setStudentUsn('1MS22IS015');
    }
  };

  // -------------------------------------------------------------
  // Student Login Step 1: Verify USN, Password, Branch, Semester
  // -------------------------------------------------------------
  const handleStudentLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFaceModalError(null);
    setIsLoading(true);
    setAuthStatusText('Step 1 & 2: Verifying USN, password, branch, and semester...');

    const cleanUsn = studentUsn.trim().toUpperCase();

    if (!cleanUsn || !studentPassword) {
      setErrorMsg('Please enter both your USN and password.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.studentLoginStep1({
        usn: cleanUsn,
        password: studentPassword,
        branch: studentBranch,
        semester: Number(studentSemester)
      });

      setPendingChallenge(res);
      // Step 3: Automatically open live camera for mandatory face authentication
      setFaceModalMode('login');
      setFaceModalError(null);
      setShowFaceModal(true);
      setSuccessMsg('Step 1 & 2 verified! Opening camera for mandatory face authentication...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Credentials or branch/semester verification failed.');
    } finally {
      setIsLoading(false);
      setAuthStatusText('');
    }
  };

  // -------------------------------------------------------------
  // Face Authentication Confirmation Handler (Step 4, 5, 6, 7)
  // -------------------------------------------------------------
  const handleFaceConfirm = async (
    faceVector: number[],
    qualityScore: number,
    photoUrl: string,
    livenessData?: { livenessScore: number; challengePassed: boolean; method: string; timestamp: number }
  ) => {
    // Case A: First-time Registration Face Capture
    if (faceModalMode === 'register') {
      setRegCapturedVector(faceVector);
      setRegCapturedPhoto(photoUrl);
      setRegFaceQuality(qualityScore);
      setShowFaceModal(false);
      setSuccessMsg('Face captured successfully! Complete registration below.');
      return;
    }

    // Case B: Live Login Face Authentication
    if (!pendingChallenge?.challengeToken) {
      setFaceModalError('Face verification session expired. Please sign in again.');
      return;
    }

    setIsLoading(true);
    setFaceModalError(null);

    try {
      const res = await api.studentLoginStep2({
        challengeToken: pendingChallenge.challengeToken,
        usn: studentUsn.trim().toUpperCase(),
        liveFaceVector: faceVector,
        livenessData
      });

      if (res.token) {
        setSuccessMsg('Face matched and liveness verified! Opening Student Dashboard...');
        setShowFaceModal(false);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      // Step 7: "Face Verification Failed. The registered student could not be verified. Please try again."
      const errorText = err.message || 'Face Verification Failed. The registered student could not be verified. Please try again.';
      setFaceModalError(errorText);
      setErrorMsg(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Student Registration (Compulsory Face Enrollment)
  // -------------------------------------------------------------
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsn = regUsn.trim().toUpperCase();

    if (!regFullName.trim() || !cleanUsn || !regPassword) {
      setErrorMsg('Full Name, USN, Password, Branch, and Semester are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // Compulsory Face Registration Check
    if (!regCapturedVector || regCapturedVector.length !== 128) {
      setErrorMsg('Face registration is compulsory. Please click "Capture Live Face" to register your face template.');
      return;
    }

    if (!biometricConsent) {
      setErrorMsg('You must provide biometric consent to register your facial template.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.studentRegister({
        fullName: regFullName.trim(),
        usn: cleanUsn,
        username: cleanUsn.toLowerCase(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        email: `${cleanUsn.toLowerCase()}@smartlab.edu`,
        branch: regBranch,
        semester: regSemester,
        faceVector: regCapturedVector,
        qualityScore: regFaceQuality
      });

      // Display "Face Registration Successful"
      setSuccessMsg(res.message || 'Face Registration Successful. Your account and biometric template have been securely linked to your USN.');
      
      // Navigate to student login with prefilled details
      setTimeout(() => {
        setActiveMode('student_login');
        setStudentUsn(cleanUsn);
        setStudentPassword(regPassword);
        setStudentBranch(regBranch);
        setStudentSemester(regSemester);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Student registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Faculty Login Handler (Separate role-based authorization)
  // -------------------------------------------------------------
  const handleFacultyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (!facultyId || !facultyPassword) {
      setErrorMsg('Please enter both faculty username and password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/faculty-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: facultyId.trim(),
          username: facultyId.trim(),
          password: facultyPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Faculty login failed.');
      }

      if (data.token) {
        setStoredToken(data.token);
      }

      setSuccessMsg('Faculty authenticated successfully! Opening Faculty Monitoring Dashboard...');
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Faculty login credentials invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Admin-Only Faculty Account Provisioning
  // -------------------------------------------------------------
  const handleAdminFacultyCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (facPassword !== facConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/faculty-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminKey.trim(),
        },
        body: JSON.stringify({
          fullName: facFullName.trim(),
          facultyId: facId.trim().toUpperCase(),
          username: facUsername.trim().toLowerCase(),
          email: facEmail.trim(),
          department: facDept,
          password: facPassword,
          confirmPassword: facConfirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create faculty account.');
      }

      setSuccessMsg('Faculty account provisioned successfully by administrator. Ready for faculty login.');
      setActiveMode('faculty_login');
      setFacultyId(facUsername.trim().toLowerCase());
      setFacultyPassword(facPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Faculty account creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  SmartLab Security Gateway
                </h2>
                <p className="text-xs text-slate-400">
                  Mandatory Face Biometrics & Role-Based Access Control
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Role Tabs */}
          <div className="grid grid-cols-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveMode('student_login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3.5 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'student_login' || activeMode === 'student_register'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Student Access</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('faculty_login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-3.5 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'faculty_login' || activeMode === 'faculty_register'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Faculty Access</span>
            </button>
          </div>

          {/* Quick Demo Preload Strip */}
          <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 text-[11px] flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Demo Autofill:
            </span>
            <button
              onClick={() => handlePreloadDemo('kavana')}
              className="px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-500/40 cursor-pointer font-medium"
            >
              Kavana (1MS22IS025)
            </button>
            <button
              onClick={() => handlePreloadDemo('devika')}
              className="px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-500/40 cursor-pointer font-medium"
            >
              Devika (1MS22IS018)
            </button>
            <button
              onClick={() => handlePreloadDemo('kanika')}
              className="px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-500/40 cursor-pointer font-medium"
            >
              Kanika (1MS22IS022)
            </button>
            <button
              onClick={() => handlePreloadDemo('chaitanya')}
              className="px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-500/40 cursor-pointer font-medium"
            >
              Chaitanya (1MS22IS015)
            </button>
            <button
              onClick={() => handlePreloadDemo('faculty')}
              className="px-2 py-0.5 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-500/40 cursor-pointer font-medium"
            >
              Dr. Bhavesh S S (Faculty)
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Alerts */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-rose-500/15 border border-rose-500/35 rounded-xl text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 p-3 bg-emerald-500/15 border border-emerald-500/35 rounded-xl text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {authStatusText && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 animate-pulse">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>{authStatusText}</span>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 1. STUDENT LOGIN TAB (Requirement 2) */}
            {/* ------------------------------------------------------------- */}
            {activeMode === 'student_login' && (
              <form onSubmit={handleStudentLoginStep1} className="space-y-4">
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>Mandatory Face Authentication:</strong> Enter your USN, password, branch, and semester. Then position your face in the live camera for biometric matching.
                  </span>
                </div>

                {/* USN Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    USN / University Seat Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={studentUsn}
                      onChange={(e) => setStudentUsn(e.target.value)}
                      placeholder="e.g. 1MS22IS025"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Enter student password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Branch Dropdown & Semester Dropdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Branch / Department <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={studentBranch}
                        onChange={(e) => setStudentBranch(e.target.value as Branch)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {ALL_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Semester <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={studentSemester}
                        onChange={(e) => setStudentSemester(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {ALL_SEMESTERS.map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider transition cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>Proceed to Live Face Authentication</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Bottom Switcher */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>First time registering?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('student_register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Enroll New Student & Face
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. STUDENT REGISTRATION TAB (Requirement 1) */}
            {/* ------------------------------------------------------------- */}
            {activeMode === 'student_register' && (
              <form onSubmit={handleStudentRegister} className="space-y-3.5">
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong>First-Time Registration:</strong> All fields are required and live face biometric enrollment is strictly compulsory.
                  </span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Kavana N P"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* USN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    USN (Unique Student Seat Number) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regUsn}
                      onChange={(e) => setRegUsn(e.target.value)}
                      placeholder="e.g. 1MS22IS025"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Branch & Semester */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Branch / Department <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={regBranch}
                        onChange={(e) => setRegBranch(e.target.value as Branch)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {ALL_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Semester <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={regSemester}
                        onChange={(e) => setRegSemester(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {ALL_SEMESTERS.map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Compulsory Face Authentication Registration Section */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ScanFace className="w-4 h-4 text-blue-400" />
                        Face Authentication Registration (Compulsory)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Live camera face capture is required to link a permanent 128-D biometric template to your USN.
                      </p>
                    </div>
                    {regCapturedVector ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Face Enrolled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {regCapturedPhoto && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/50 shrink-0">
                        <img src={regCapturedPhoto} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!regUsn.trim()) {
                          setErrorMsg('Please enter your USN before capturing your face.');
                          return;
                        }
                        setErrorMsg(null);
                        setFaceModalMode('register');
                        setFaceModalError(null);
                        setShowFaceModal(true);
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                        regCapturedVector 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{regCapturedVector ? 'Recapture Face Photo' : 'Capture Live Face for Registration'}</span>
                    </button>
                  </div>

                  {/* Explicit Biometric Consent */}
                  <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={biometricConsent}
                      onChange={(e) => setBiometricConsent(e.target.checked)}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>
                      I provide explicit consent for SmartLab to capture and store an encrypted 128-dimensional mathematical biometric face vector associated with my USN for identity verification.
                    </span>
                  </label>
                </div>

                {/* Complete Registration Button */}
                <button
                  type="submit"
                  disabled={isLoading || !regCapturedVector || !biometricConsent}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Complete Student Registration</span>
                </button>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('student_login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Back to Student Login
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. FACULTY LOGIN TAB */}
            {/* ------------------------------------------------------------- */}
            {activeMode === 'faculty_login' && (
              <form onSubmit={handleFacultyLogin} className="space-y-4">
                <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Faculty Portal Authentication:</strong> Restricted to authorized engineering professors, lab instructors, and departmental examiners.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Faculty ID or Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      placeholder="e.g. bhavesh_ise"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showFacultyPassword ? 'text' : 'password'}
                      required
                      value={facultyPassword}
                      onChange={(e) => setFacultyPassword(e.target.value)}
                      placeholder="Enter faculty password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showFacultyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Authenticate Faculty Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>New faculty member?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('faculty_register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Admin Account Provisioning
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. ADMIN FACULTY REGISTRATION */}
            {/* ------------------------------------------------------------- */}
            {activeMode === 'faculty_register' && (
              <form onSubmit={handleAdminFacultyCreate} className="space-y-3.5">
                <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong>Administrative Account Provisioning:</strong> Enter administrative master key to provision new faculty accounts.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Administrator Secret Key <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin secret key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Faculty Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={facFullName}
                      onChange={(e) => setFacFullName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Faculty ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={facId}
                      onChange={(e) => setFacId(e.target.value)}
                      placeholder="e.g. FAC-CSE-002"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={facUsername}
                      onChange={(e) => setFacUsername(e.target.value)}
                      placeholder="e.g. rajesh_cse"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={facDept}
                      onChange={(e) => setFacDept(e.target.value as Branch)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {ALL_BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={facEmail}
                    onChange={(e) => setFacEmail(e.target.value)}
                    placeholder="e.g. rajesh@smartlab.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={facPassword}
                      onChange={(e) => setFacPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={facConfirmPassword}
                      onChange={(e) => setFacConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Provision Faculty Account</span>
                </button>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Already provisioned?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('faculty_login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Back to Faculty Login
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>

      {/* Mandatory Live Face Capture Modal */}
      {showFaceModal && (
        <FaceCaptureModal
          mode={faceModalMode}
          usn={faceModalMode === 'login' ? (pendingChallenge?.usn || studentUsn.trim().toUpperCase()) : regUsn.trim().toUpperCase()}
          studentName={faceModalMode === 'login' ? pendingChallenge?.name : regFullName.trim()}
          onConfirm={handleFaceConfirm}
          onCancel={() => {
            setShowFaceModal(false);
            setFaceModalError(null);
          }}
          errorMessage={faceModalError}
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </>
  );
};
