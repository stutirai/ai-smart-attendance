'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80">
        <h1 className="text-xl font-bold text-white">Student Attendance Analytics & Trends</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cumulative lecture attendance percentages and individual presence breakdown
        </p>
      </div>

      {/* Grid of Student Cards with Visual Percentage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading student analytics...</div>
        ) : analytics.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No student attendance data recorded yet.</div>
        ) : (
          analytics.map((st) => {
            const isHigh = st.attendance_percentage >= 75;
            return (
              <div
                key={st.student_id}
                className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">{st.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Roll: {st.roll_number}</div>
                    <div className="text-[10px] text-gold-400/90">{st.department} • Sec {st.section}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                    isHigh
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}>
                    {st.attendance_percentage}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-navy-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, st.attendance_percentage))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Minimum 75% Criteria</span>
                    <span className={isHigh ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {isHigh ? 'Eligible' : 'Shortage'}
                    </span>
                  </div>
                </div>

                {/* Numerical Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                  <div className="p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Classes</div>
                    <div className="font-bold text-white mt-0.5">{st.total_classes}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-emerald-400">Present</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{st.present_count}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                    <div className="text-[10px] text-rose-400">Absent</div>
                    <div className="font-bold text-rose-400 mt-0.5">{st.absent_count}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
