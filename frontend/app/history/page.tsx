'use client';

import { useState, useEffect } from 'react';
import { History, Download, Filter, Search, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/services/api';

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendanceHistory({
        date_filter: dateFilter || undefined,
        subject_filter: subjectFilter || undefined,
        section_filter: sectionFilter || undefined,
      });
      setHistoryData(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateFilter, subjectFilter, sectionFilter]);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Classroom Attendance History</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Archived multi-interval verification records with date, subject, and section filters
          </p>
        </div>

        <a
          href="http://127.0.0.1:8000/api/reports/all/csv"
          download
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 flex items-center gap-2 transition w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export All Records (CSV)</span>
        </a>
      </div>

      {/* Summary KPI Cards */}
      {historyData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Records</span>
            <div className="text-2xl font-bold text-white mt-1">{historyData.summary.total_records}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">Total Present</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{historyData.summary.present_count}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-rose-400 font-semibold uppercase">Total Absent</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{historyData.summary.absent_count}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-gold-400 font-semibold uppercase">Overall Rate</span>
            <div className="text-2xl font-bold text-gold-400 mt-1">{historyData.summary.present_percentage}%</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Filter by Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Filter by Subject</label>
          <input
            type="text"
            placeholder="e.g. Artificial Intelligence"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Filter by Section</label>
          <input
            type="text"
            placeholder="e.g. Section A"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Roll Number</th>
                <th className="py-3 px-4 font-semibold">Subject</th>
                <th className="py-3 px-4 font-semibold">Section</th>
                <th className="py-3 px-4 font-semibold">Verification Count</th>
                <th className="py-3 px-4 font-semibold">Confidence</th>
                <th className="py-3 px-4 font-semibold">Liveness</th>
                <th className="py-3 px-4 font-semibold">Final Status</th>
                <th className="py-3 px-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading history records...</td>
                </tr>
              ) : !historyData?.records || historyData.records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No records match the selected filter.</td>
                </tr>
              ) : (
                historyData.records.map((r: any) => {
                  const isPresent = r.status === 'PRESENT';
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{r.date}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{r.student_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{r.roll_number}</td>
                      <td className="py-3.5 px-4 text-slate-300">{r.subject}</td>
                      <td className="py-3.5 px-4 text-slate-400">{r.section}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{r.verification_count}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.average_confidence?.toFixed(2) || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {r.liveness}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{r.time}</td>
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
