'use client';

import { usePathname } from 'next/navigation';
import { useAttendanceWebSocket } from '@/hooks/useAttendanceWebSocket';
import { useFacultyProfile } from '@/hooks/useFacultyProfile';
import { Zap, Clock, User, Pencil, X, Check, RotateCcw, Building, Mail, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

const ROLE_PRESETS = [
  'Faculty In-Charge',
  'Assistant Professor',
  'Associate Professor',
  'Course Coordinator',
  'HOD - AI & DS',
];

export default function Navbar() {
  const pathname = usePathname();
  const { stats, isConnected } = useAttendanceWebSocket();
  const { profile, updateProfile, resetProfile } = useFacultyProfile();

  const [timeStr, setTimeStr] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    department: '',
    institute: '',
    email: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync form data when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setFormData({
        name: profile.name || 'Faculty Portal',
        role: profile.role || 'Faculty In-Charge',
        department: profile.department || 'Department of AI / AI&DS',
        institute: profile.institute || 'Greater Noida Institute of Technology (GNIOT)',
        email: profile.email || 'faculty@gniot.net.in',
      });
      setSaveSuccess(false);
    }
  }, [isModalOpen, profile]);

  if (pathname === '/') return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: formData.name.trim() || 'Faculty Portal',
      role: formData.role.trim() || 'Faculty In-Charge',
      department: formData.department.trim(),
      institute: formData.institute.trim(),
      email: formData.email.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsModalOpen(false);
    }, 800);
  };

  const handleReset = async () => {
    await resetProfile();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsModalOpen(false);
    }, 600);
  };

  return (
    <>
      <header className="h-16 bg-navy-900/60 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Title & Core Concept Subtitle */}
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Zero-Interference Classroom Attendance
          </h2>
          <p className="text-[11px] text-slate-400">
            Periodic Temporal Face Verification • YOLOv8-Face + ArcFace + FAISS
          </p>
        </div>

        {/* Center: System Status & Demo Mode Indicator */}
        <div className="flex items-center gap-3">
          {stats?.is_demo_mode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-gold-400 border border-gold-500/30">
              <Zap className="w-3.5 h-3.5 text-gold-400 animate-bounce" />
              <span>DEMO MODE (ACCELERATED 5s/15s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>REAL MODE (30s / 10 min)</span>
            </div>
          )}

          {/* WebSocket Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}
            ></span>
            <span>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Right: Clock & Interactive Faculty Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono font-medium text-slate-300">{timeStr}</div>
            <div className="text-[10px] text-slate-500">Local IST</div>
          </div>

          {/* Clickable / Editable Profile Pill */}
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            title="Click to edit Faculty In-Charge details"
            className="group flex items-center gap-2.5 pl-3 pr-2.5 py-1 rounded-xl border border-slate-800/80 hover:border-gold-500/40 bg-slate-900/40 hover:bg-slate-800/80 transition-all text-left focus:outline-none focus:ring-1 focus:ring-gold-500/50"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 group-hover:border-gold-500/60 flex items-center justify-center text-slate-300 transition-colors">
                <User className="w-4 h-4 text-gold-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-navy-950 border border-slate-700 flex items-center justify-center shadow">
                <Pencil className="w-2 h-2 text-gold-400 opacity-80 group-hover:opacity-100" />
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-slate-200 group-hover:text-gold-300 transition-colors flex items-center gap-1">
                <span>{profile.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
                {profile.role}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Edit Faculty Profile</h3>
                  <p className="text-xs text-slate-400">
                    Customise faculty identity displayed in header and attendance sessions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Faculty Name / Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Faculty Name / Display Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Amit Sharma or Faculty Portal"
                    className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Designation / Role */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Designation / Role <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Faculty In-Charge or Assistant Professor"
                    className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 mr-1">Quick presets:</span>
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: preset })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border ${
                        formData.role === preset
                          ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Department of AI / AI&DS"
                    className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Faculty Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. faculty@gniot.net.in"
                    className="w-full pl-9 pr-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                      saveSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-gold-500/20'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
