import React from 'react';
import { User } from '../../types.ts';
import { 
  User as UserIcon, 
  IdCard, 
  Building2, 
  Layers, 
  Mail, 
  ShieldCheck, 
  ScanFace, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Lock,
  Activity
} from 'lucide-react';

interface MyProfileTabProps {
  user: User;
}

export const MyProfileTab: React.FC<MyProfileTabProps> = ({ user }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Profile Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white text-2xl font-black">
              {user.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">{user.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active Student
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              USN: <span className="text-blue-400 font-bold">{user.usn || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <ScanFace className="w-4 h-4 text-blue-400" />
          <span>Biometric Face Template Linked</span>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Profile */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Academic Enrollment
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <IdCard className="w-3.5 h-3.5 text-slate-500" />
                USN / Student ID
              </span>
              <span className="font-mono font-bold text-slate-200">{user.usn}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Branch / Department
              </span>
              <span className="font-semibold text-slate-200">{user.branch}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Current Semester
              </span>
              <span className="font-semibold text-slate-200">Semester {user.semester}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                University Email
              </span>
              <span className="font-medium text-slate-300">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Biometrics & Security */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Biometric & Security Credentials
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <ScanFace className="w-3.5 h-3.5 text-slate-500" />
                Face Authentication
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled (128-D)
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Template Encryption
              </span>
              <span className="font-mono text-slate-300">PBKDF2 / SHA-512</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Session Verification
              </span>
              <span className="text-blue-400 font-semibold">Active Heartbeat (30s)</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Account Created
              </span>
              <span className="text-slate-300">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          SmartLab Academic Identity Security
        </p>
        <p className="leading-relaxed">
          Your student profile and laboratory assignments are strictly synchronized with your engineering branch ({user.branch}) and semester ({user.semester}). Laboratory marks and quiz scores are authoritative and permanently recorded on the college backend database.
        </p>
      </div>
    </div>
  );
};
