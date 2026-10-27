'use client';

import { useAttendanceWebSocket } from '@/hooks/useAttendanceWebSocket';
import { 
  Camera, 
  Clock, 
  ScanFace, 
  Cpu, 
  Database, 
  Server, 
  LayoutDashboard, 
  ArrowDown, 
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function ArchitecturePage() {
  const { stats, isConnected } = useAttendanceWebSocket();
  const isBurst = stats?.is_burst_active || false;

  const stages = [
    {
      step: '1',
      title: 'Classroom Video Acquisition',
      tech: 'Laptop Webcam / RTSP IP Camera (OpenCV VideoCapture)',
      desc: 'Streams 30 FPS video of the classroom without requiring students to interact or queue up.',
      icon: Camera,
      activeColor: 'border-blue-500 text-blue-400 bg-blue-500/10',
      isActive: true,
    },
    {
      step: '2',
      title: 'Temporal Scheduling & Trigger',
      tech: 'APScheduler Background Engine',
      desc: 'Controls 5 periodic attendance verification intervals (30s burst every 10m in Real mode / 5s every 15s in Demo mode).',
      icon: Clock,
      activeColor: 'border-gold-500 text-gold-400 bg-gold-500/10',
      isActive: true,
    },
    {
      step: '3',
      title: 'Dense Face Detection',
      tech: 'YOLOv8-Face / Dense Multi-Scale SCRFD Detector',
      desc: 'Detects all visible students simultaneously in classroom seating, including distant backbenchers down to ~20px.',
      icon: ScanFace,
      activeColor: isBurst ? 'border-emerald-500 text-emerald-400 bg-emerald-500/15 animate-pulse' : 'border-slate-700 text-slate-400',
      isActive: isBurst,
    },
    {
      step: '4',
      title: 'Deep Feature Representation',
      tech: 'InsightFace / ArcFace (Additive Angular Margin Loss)',
      desc: 'Extracts 512-dimensional normalized facial feature vectors invariant to illumination and minor head pose tilts.',
      icon: Cpu,
      activeColor: isBurst ? 'border-emerald-500 text-emerald-400 bg-emerald-500/15 animate-pulse' : 'border-slate-700 text-slate-400',
      isActive: isBurst,
    },
    {
      step: '5',
      title: 'Vector Similarity Search',
      tech: 'FAISS IndexFlatIP (Cosine Similarity Search)',
      desc: 'Performs sub-millisecond (< 2ms) vector nearest-neighbor matching against registered student embeddings with threshold rejection.',
      icon: Sparkles,
      activeColor: isBurst ? 'border-gold-500 text-gold-400 bg-gold-500/15 animate-pulse' : 'border-slate-700 text-slate-400',
      isActive: isBurst,
    },
    {
      step: '6',
      title: 'Temporal Decision & Storage',
      tech: 'PostgreSQL Relational DB (SQLAlchemy Engine)',
      desc: 'Evaluates the core rule: Verified in ≥ 3 out of 5 intervals → PRESENT. Records date, confidence, and prototype liveness.',
      icon: Database,
      activeColor: 'border-purple-500 text-purple-400 bg-purple-500/10',
      isActive: true,
    },
    {
      step: '7',
      title: 'Faculty Dashboard & Reporting',
      tech: 'Next.js 14, React, Tailwind CSS, WebSockets',
      desc: 'Presents real-time telemetry, interval progress matrix, student analytics, and CSV exports to faculty.',
      icon: LayoutDashboard,
      activeColor: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
      isActive: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
            SYSTEM ARCHITECTURE
          </span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">
          Periodic Temporal Face Verification Pipeline
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          End-to-end dataflow from RTSP camera feed to autonomous faculty attendance decision
        </p>

        {/* Live Status Flow Badge */}
        <div className="mt-4 p-3 rounded-xl bg-navy-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isBurst ? 'bg-emerald-400 animate-ping' : 'bg-gold-400'}`}></span>
            <span className="font-semibold text-slate-200">
              Pipeline Operational Status: {isBurst ? 'BURST INFERENCE IN PROGRESS' : 'SCHEDULER STANDBY'}
            </span>
          </div>
          <span className="text-gold-400 font-mono text-[11px]">
            Interval: {stats?.current_interval || 0} / 5
          </span>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="space-y-3">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div key={st.step} className="flex flex-col items-center">
              <div
                className={`w-full p-4 rounded-2xl border transition-all duration-300 glass-panel flex items-start gap-4 ${
                  st.isActive ? st.activeColor : 'border-slate-800 text-slate-400 opacity-75'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-navy-950 border border-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-gold-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        STAGE {st.step}
                      </span>
                      <h3 className="text-xs font-bold text-white tracking-wide">
                        {st.title}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-gold-400">
                      {st.tech}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div className="my-1.5 flex flex-col items-center text-slate-600">
                  <ArrowDown className={`w-4 h-4 ${isBurst ? 'text-gold-400 animate-bounce' : 'text-slate-600'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
