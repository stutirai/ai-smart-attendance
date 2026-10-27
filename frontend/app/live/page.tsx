'use client';

import { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Square, 
  Zap, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Radio, 
  Users
} from 'lucide-react';
import { api } from '@/services/api';
import { useAttendanceWebSocket } from '@/hooks/useAttendanceWebSocket';
import { useFacultyProfile } from '@/hooks/useFacultyProfile';
import { Student } from '@/types';

export default function LiveAttendancePage() {
  const { stats, isConnected } = useAttendanceWebSocket();
  const { profile } = useFacultyProfile();
  const [students, setStudents] = useState<Student[]>([]);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  // Fetch registered students to build the real-time temporal verification timeline
  const loadData = async () => {
    try {
      const stList = await api.getStudents();
      setStudents(stList);
      const sess = await api.getActiveSession();
      setActiveSession(sess);
    } catch (e) {
      console.error('Failed to load initial live page data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const sess = await api.startSession({
        subject: 'Artificial Intelligence & Data Science',
        section: 'A',
        faculty_name: (profile.name && profile.name !== 'Faculty Portal') ? profile.name : (profile.role || 'Faculty In-Charge'),
        duration_minutes: 50,
        is_demo_mode: stats?.is_demo_mode ?? true
      });
      setActiveSession(sess);
    } catch (e) {
      console.error('Failed to start session:', e);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleStopSession = async () => {
    try {
      await api.stopSession();
      setActiveSession(null);
      await loadData();
    } catch (e) {
      console.error('Failed to stop session:', e);
    }
  };

  const isSessionActive = stats?.session_status === 'ACTIVE' || !!activeSession;
  const currentInterval = stats?.current_interval || 0;
  const isBurstActive = stats?.is_burst_active || false;
  const burstRemaining = stats?.burst_remaining_seconds || 0;
  const nextIntervalIn = stats?.next_interval_in_seconds || 0;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE CLASSROOM MONITORING
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            Zero-Interference Classroom Attendance via Periodic Temporal Face Verification
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            5-Interval Periodic Sampling • Multi-Frame Burst Aggregation • ≥ 3/5 Verification Rule
          </p>
        </div>

        {/* Session Controls */}
        <div className="flex items-center gap-3">
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              disabled={isStartingSession}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isStartingSession ? 'Starting Session...' : 'START ATTENDANCE SESSION'}</span>
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>FINALIZE & STOP SESSION</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Video Screen + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Big Camera / Video Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl overflow-hidden glass-panel border border-slate-700/80 shadow-2xl bg-black aspect-video flex items-center justify-center">
            {/* Stream image */}
            <img
              src="http://127.0.0.1:8000/api/vision/stream"
              alt="Classroom Camera Feed"
              className="w-full h-full object-contain"
              onError={(e) => {
                // If stream fails, keep retrying
                setTimeout(() => {
                  (e.target as HTMLImageElement).src = `http://127.0.0.1:8000/api/vision/stream?t=${Date.now()}`;
                }, 1000);
              }}
            />

            {/* Overlaid Telemetry Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-navy-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CAMERA: CONNECTED
              </span>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-navy-950/80 backdrop-blur-md text-gold-400 border border-gold-500/40">
                {stats?.fps ? `${stats.fps} FPS` : '30.0 FPS'}
              </span>
            </div>

            {/* Mode & Burst Window Status Banner */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border ${
                  isBurstActive 
                    ? 'bg-emerald-500/80 text-white border-emerald-300 animate-pulse shadow-lg shadow-emerald-500/30'
                    : 'bg-navy-900/85 text-slate-300 border-slate-700'
                }`}>
                  {isBurstActive ? (
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-white animate-spin" />
                      BURST ACTIVE: {burstRemaining.toFixed(1)}s REMAINING
                    </span>
                  ) : (
                    <span>
                      BURST IDLE {nextIntervalIn > 0 ? `(Next Burst in ${nextIntervalIn.toFixed(0)}s)` : ''}
                    </span>
                  )}
                </div>

                <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-900/85 backdrop-blur-md text-slate-200 border border-slate-700">
                  INTERVAL: <span className="text-gold-400 font-bold">{currentInterval} / 5</span>
                </div>
              </div>

              <div className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-navy-950/85 backdrop-blur-md text-slate-300 border border-slate-700">
                Liveness: <span className="text-emerald-400 font-bold">MULTI-FRAME EAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Statistics & Diagnostics (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live System Statistics Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-400" />
                Live Classroom Telemetry
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Faces Detected</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {stats?.faces_detected ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">YOLOv8-Face dense</div>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800">
                <div className="text-[10px] font-semibold text-emerald-400 uppercase">Recognized</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {stats?.recognized_count ?? 0}
                </div>
                <div className="text-[10px] text-emerald-500/80 mt-0.5">FAISS ≥ 0.55 match</div>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800">
                <div className="text-[10px] font-semibold text-rose-400 uppercase">Unknown Faces</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {stats?.unknown_count ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Threshold rejection</div>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/60 border border-slate-800">
                <div className="text-[10px] font-semibold text-gold-400 uppercase">FAISS Latency</div>
                <div className="text-2xl font-bold text-gold-400 mt-1 font-mono">
                  {stats?.average_matching_latency_ms ? `${stats.average_matching_latency_ms.toFixed(1)}ms` : '< 2ms'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">512-D Cosine IP</div>
              </div>
            </div>

            {/* Currently In-View Faces Details */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-300 mb-2">
                Currently Visible in Frame:
              </div>
              {!stats?.faces || stats.faces.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center bg-navy-950/40 rounded-xl border border-slate-800/80">
                  No faces currently in camera view
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {stats.faces.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-navy-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{f.identity}</span>
                          {f.is_known && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                              {(f.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {f.roll_number ? `Roll: ${f.roll_number}` : 'Unregistered Face'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          f.liveness_status === 'LIVE'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {f.liveness_status}
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Yaw: {f.yaw}° | Pitch: {f.pitch}°
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Temporal Verification Rule Callout Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 border border-gold-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gold-400 font-bold tracking-wide">
              <Zap className="w-4 h-4" />
              <span>CORE ATTENDANCE RULE (SLIDE 6)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Verified in <span className="text-emerald-400 font-bold">≥ 3 out of 5 intervals</span> → <span className="text-emerald-400 font-bold">PRESENT</span>.
              Otherwise → <span className="text-rose-400 font-bold">NOT VERIFIED / ABSENT</span>.
            </p>
            <p className="text-slate-400 text-[10px]">
              Burst-window evaluation protects against single bad frames caused by writing, looking down, or brief occlusion.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Real-time Multi-Interval Temporal Progress Matrix (Slide 10 UI) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              TEMPORAL VERIFICATION PROGRESS (5 INTERVALS)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live interval status for all enrolled students
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Interval Progress: <span className="text-gold-400 font-bold">{currentInterval} / 5 Completed</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 text-center font-semibold">Interval 1</th>
                <th className="py-3 px-4 text-center font-semibold">Interval 2</th>
                <th className="py-3 px-4 text-center font-semibold">Interval 3</th>
                <th className="py-3 px-4 text-center font-semibold">Interval 4</th>
                <th className="py-3 px-4 text-center font-semibold">Interval 5</th>
                <th className="py-3 px-4 text-center font-semibold">Verified</th>
                <th className="py-3 px-4 text-center font-semibold">Decision Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No registered students found. Register students on the Enrollment page.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const studentMatrix = stats?.student_intervals?.[st.id.toString()] || {};
                  const verifiedCount = [1, 2, 3, 4, 5].filter((i) => studentMatrix[i.toString()]).length;
                  const isPresent = verifiedCount >= 3;

                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {st.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {st.roll_number}
                      </td>

                      {/* 5 Interval Badges */}
                      {[1, 2, 3, 4, 5].map((i) => {
                        const isVerified = studentMatrix[i.toString()];
                        const isIntervalPast = currentInterval >= i;
                        const isCurrent = currentInterval === i && isBurstActive;

                        return (
                          <td key={i} className="py-3.5 px-4 text-center">
                            {isVerified ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : isCurrent ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-400 font-bold text-xs animate-pulse">
                                ...
                              </span>
                            ) : isIntervalPast ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
                                ✗
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-500 font-bold text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        {verifiedCount} / 5
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>PRESENT</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              <span>NOT VERIFIED</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
