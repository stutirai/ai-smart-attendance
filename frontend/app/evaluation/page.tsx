'use client';

import { useState, useEffect } from 'react';
import { Award, Play, CheckCircle, RefreshCw, BarChart2, Zap, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';

export default function EvaluationPage() {
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    api.getPptBenchmarks().then(setBenchmarks).catch(console.error);
  }, []);

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    try {
      const res = await api.runEvaluation();
      setEvalResult(res);
    } catch (e: any) {
      alert('Evaluation failed: ' + e.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
              EMPIRICAL BENCHMARKING
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">
            System Performance Evaluation & Empirical Verification
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Empirical testing of FAISS Vector Matching, Recognition Accuracy, Precision, Recall, and Distance Robustness
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 flex items-center gap-2 transition disabled:opacity-50 w-fit"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-navy-950" />}
          <span>{isRunning ? 'Running Live Evaluation...' : 'Run Prototype Evaluation'}</span>
        </button>
      </div>

      {/* Actual Measured Prototype Results Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Measured Prototype Results (Live Empirical Test)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Metrics calculated directly from stored FAISS representations & perturbation testing
            </p>
          </div>
          {evalResult && (
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluated: {evalResult.evaluated_at}
            </span>
          )}
        </div>

        {!evalResult ? (
          <div className="py-10 text-center space-y-3">
            <div className="text-slate-400 text-xs">
              No live evaluation has been executed yet in this session.
            </div>
            <p className="text-slate-500 text-[11px] max-w-md mx-auto">
              Per requirements, benchmark figures from the project presentation are not displayed as prototype results until actively measured.
            </p>
            <button
              onClick={handleRunEvaluation}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gold-400 text-xs font-semibold transition"
            >
              Click "Run Prototype Evaluation" to test now
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Real Measured Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Recognition Accuracy</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{evalResult.accuracy}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Perturbed test queries</div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Precision</div>
                <div className="text-2xl font-black text-white mt-1">{evalResult.precision}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">TP / (TP + FP)</div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Recall</div>
                <div className="text-2xl font-black text-white mt-1">{evalResult.recall}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">TP / (TP + FN)</div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">F1 Score</div>
                <div className="text-2xl font-black text-gold-400 mt-1">{evalResult.f1_score}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Harmonic mean</div>
              </div>
            </div>

            {/* Latency & Confusion Matrix Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-2">Measured Latency</div>
                <div className="text-3xl font-mono font-bold text-gold-400">
                  {evalResult.measured_matching_latency_ms} ms
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Average FAISS vector search time for 512-D ArcFace cosine lookup across 60 iterations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-2">Verification Breakdown</div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-emerald-400">
                    <span>True Positives (TP):</span>
                    <span>{evalResult.true_positives}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>True Negatives (TN):</span>
                    <span>{evalResult.true_negatives}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>False Positives (FP):</span>
                    <span>{evalResult.false_positives}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>False Negatives (FN):</span>
                    <span>{evalResult.false_negatives}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-2">Distance / Backbencher Rate</div>
                <div className="text-3xl font-mono font-bold text-emerald-400">
                  {evalResult.backbencher_detection_rate}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estimated multi-scale detection capability for small / distant faces (&lt; 40px).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PPT Benchmark Comparison Table (Slide 7) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-gold-400" />
            Theoretical Benchmark Comparison (From PPT Slide 7)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Reference literature metrics contrasting single-snapshot face recognition with our proposed periodic temporal face verification
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
                <th className="py-3 px-4 font-semibold text-rose-400">Single-Snapshot Face AI</th>
                <th className="py-3 px-4 font-semibold text-emerald-400">Proposed AI Smart Monitoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {benchmarks?.metrics.map((m: any, i: number) => (
                <tr key={i} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{m.metric}</td>
                  <td className="py-3.5 px-4 text-rose-300 font-mono">{m.single_snapshot}</td>
                  <td className="py-3.5 px-4 text-emerald-300 font-mono font-bold">{m.proposed_system}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
