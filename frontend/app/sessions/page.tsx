'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarClock, Play, Square, Video, Clock, CheckCircle2, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { AttendanceSession } from '@/types';
import { useAttendanceWebSocket } from '@/hooks/useAttendanceWebSocket';
import { useFacultyProfile } from '@/hooks/useFacultyProfile';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats } = useAttendanceWebSocket();
  const { profile } = useFacultyProfile();

  // New session modal / form
  const [subject, setSubject] = useState('Artificial Intelligence & Data Science');
  const [section, setSection] = useState('A');
  const [facultyName, setFacultyName] = useState('Faculty In-Charge');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile.name && profile.name !== 'Faculty Portal') {
      setFacultyName(profile.name);
    } else if (profile.role) {
      setFacultyName(profile.role);
    }
  }, [profile]);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
      const active = await api.getActiveSession();
      setActiveSession(active);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sess = await api.startSession({
        subject,
        section,
        faculty_name: facultyName,
        duration_minutes: durationMinutes,
        is_demo_mode: isDemoMode,
      });
      setActiveSession(sess);
      await loadSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to start session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopSession = async () => {
    try {
      await api.stopSession();
      setActiveSession(null);
      await loadSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to stop session');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Attendance Sessions Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure periodic temporal verification sessions for lecture periods
          </p>
        </div>

        {activeSession && (
          <Link
            href="/live"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Video className="w-4 h-4" />
            <span>Open Active Session Live Feed</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Start New Session Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gold-400" />
              Configure & Start New Session
            </h2>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Subject / Course Name
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Class / Section
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 50)}
                    className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Faculty In-Charge
                </label>
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-gold-400" />
                    <span>Demo Mode (Accelerated 5s/15s)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Compresses 5 intervals for viva/presentation
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isDemoMode}
                  onChange={(e) => setIsDemoMode(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-navy-950" />
                <span>{isSubmitting ? 'Starting...' : 'Launch Attendance Session'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active & Past Sessions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Session Card */}
          {activeSession && (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <h3 className="text-sm font-bold text-white">Active Session in Progress</h3>
                </div>
                <span className="text-xs font-mono text-gold-400">{activeSession.session_code}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-navy-950/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Subject</div>
                  <div className="font-semibold text-slate-200 mt-0.5 truncate">{activeSession.subject}</div>
                </div>
                <div className="p-2.5 bg-navy-950/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Interval</div>
                  <div className="font-bold text-gold-400 mt-0.5">{stats?.current_interval || 0} / 5</div>
                </div>
                <div className="p-2.5 bg-navy-950/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Burst Status</div>
                  <div className="font-semibold text-emerald-400 mt-0.5">
                    {stats?.is_burst_active ? 'ACTIVE' : 'IDLE'}
                  </div>
                </div>
                <div className="p-2.5 bg-navy-950/60 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Mode</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {activeSession.is_demo_mode ? 'Demo' : 'Real'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/live"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gold-400 text-xs font-semibold transition"
                >
                  View Camera
                </Link>
                <button
                  onClick={handleStopSession}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
                >
                  End & Finalize Records
                </button>
              </div>
            </div>
          )}

          {/* Past Sessions List */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-700/80">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Session History Log
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
              {loading ? (
                <div className="py-6 text-center text-slate-400">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="py-6 text-center text-slate-400">No sessions recorded yet.</div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl bg-navy-950/50 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{sess.subject}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Code: {sess.session_code} • Section: {sess.section} • Started: {new Date(sess.start_time).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sess.status === 'COMPLETED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {sess.status}
                      </span>
                      <a
                        href={`http://127.0.0.1:8000/api/reports/session/${sess.id}/csv`}
                        download
                        className="px-2.5 py-1 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-[11px] font-medium transition"
                      >
                        CSV
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
