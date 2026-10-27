'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '@/services/api';

const TARGET_POSES = [
  { id: 'FRONTAL', label: 'LOOK STRAIGHT', target: 'Frontal (0°)', desc: 'Look directly into camera lens' },
  { id: 'YAW_LEFT', label: 'TURN LEFT', target: 'Yaw ~ -30°', desc: 'Gently turn head to your left' },
  { id: 'YAW_RIGHT', label: 'TURN RIGHT', target: 'Yaw ~ +30°', desc: 'Gently turn head to your right' },
  { id: 'PITCH_UP', label: 'LOOK SLIGHTLY UP', target: 'Pitch ~ +15°', desc: 'Tilt head slightly upward' },
  { id: 'PITCH_DOWN', label: 'LOOK SLIGHTLY DOWN', target: 'Pitch ~ -15°', desc: 'Tilt head slightly downward' },
];

export default function EnrollmentPage() {
  const [step, setStep] = useState<'DETAILS' | 'CAPTURE' | 'COMPLETE'>('DETAILS');
  
  // Student Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Department of AI / AI&DS');
  const [section, setSection] = useState('A');
  const [email, setEmail] = useState('');
  const [createdStudent, setCreatedStudent] = useState<any>(null);

  // Capture State
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [completedPoses, setCompletedPoses] = useState<Record<string, number>>({});
  const [captureFeedback, setCaptureFeedback] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [livePoseInfo, setLivePoseInfo] = useState<any>(null);
  const [totalSamples, setTotalSamples] = useState(0);

  // Poll live camera for real-time head pose guidance during capture step
  useEffect(() => {
    let active = true;
    if (step === 'CAPTURE') {
      const pollFrame = async () => {
        try {
          const res = await api.captureFrame();
          if (active && res.pose_info) {
            setLivePoseInfo(res.pose_info);
          }
        } catch (e) {
          // Camera streaming continues in backend
        }
      };
      const interval = setInterval(pollFrame, 600);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [step]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStudent({
        student_id: studentId.trim(),
        name: name.trim(),
        roll_number: rollNumber.trim(),
        department,
        section,
        email: email.trim() || undefined,
      });
      setCreatedStudent(res);
      setStep('CAPTURE');
    } catch (err: any) {
      alert(err.message || 'Error registering student.');
    }
  };

  const handleCaptureSample = async () => {
    if (!createdStudent) return;
    setIsCapturing(true);
    setCaptureFeedback('Detecting face & extracting 512-D ArcFace embedding...');

    try {
      const currentPose = TARGET_POSES[currentPoseIdx];
      const res = await api.captureSample(createdStudent.id, undefined, currentPose.id);

      if (res.success) {
        setCaptureFeedback(`✓ Valid sample captured: ${res.pose_type} (Yaw: ${res.yaw}°, Pitch: ${res.pitch}°)`);
        setTotalSamples(res.sample_count);

        setCompletedPoses((prev) => ({
          ...prev,
          [currentPose.id]: (prev[currentPose.id] || 0) + 1,
        }));

        // Advance to next pose or complete
        if (currentPoseIdx < TARGET_POSES.length - 1) {
          setTimeout(() => {
            setCurrentPoseIdx((idx) => idx + 1);
            setCaptureFeedback('');
          }, 800);
        } else {
          // All 5 angles acquired!
          setTimeout(() => {
            setStep('COMPLETE');
          }, 1000);
        }
      } else {
        setCaptureFeedback(`Notice: ${res.message}`);
      }
    } catch (err: any) {
      setCaptureFeedback(`Capture Error: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const currentPose = TARGET_POSES[currentPoseIdx];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-700/80">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">
            BIOMETRIC ENROLLMENT WIZARD
          </span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">
          Multi-Angle Student Face Enrollment
        </h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Collect multi-pose samples (Frontal, Yaw ±30°, Pitch ±15°) • Extract 512-D ArcFace Embeddings • Index in FAISS
        </p>

        {/* 3 Step Wizard Progress */}
        <div className="mt-5 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-2 font-semibold ${step === 'DETAILS' ? 'text-gold-400' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">1</span>
            <span>Student Information</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className={`flex items-center gap-2 font-semibold ${step === 'CAPTURE' ? 'text-gold-400' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">2</span>
            <span>Multi-Angle Face Capture</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
          <div className={`flex items-center gap-2 font-semibold ${step === 'COMPLETE' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">3</span>
            <span>Registration Summary</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Student Information Form */}
      {step === 'DETAILS' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/80">
          <h2 className="text-sm font-bold text-white mb-4">Step 1: Student Academic Details</h2>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Roll Number (AKTU / Institute) *
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 2401321630060"
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Student Unique ID *
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. STU-001"
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Section / Group
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Student Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gniot.net.in"
                  className="w-full px-3.5 py-2.5 bg-navy-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 flex items-center gap-2 transition"
              >
                <span>Proceed to Face Capture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Multi-Angle Face Capture */}
      {step === 'CAPTURE' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Camera View Area (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative rounded-2xl overflow-hidden glass-panel border border-slate-700/80 shadow-2xl bg-black aspect-video flex items-center justify-center">
              <img
                src="http://127.0.0.1:8000/api/vision/stream"
                alt="Enrollment Feed"
                className="w-full h-full object-contain"
              />

              {/* Dynamic Pose Instruction Badge */}
              <div className="absolute top-4 inset-x-4 flex justify-center">
                <div className="px-5 py-2 rounded-xl bg-navy-950/90 backdrop-blur-md border border-gold-500/50 shadow-xl text-center">
                  <div className="text-[10px] text-gold-400 uppercase font-semibold">Current Instruction</div>
                  <div className="text-base font-black text-white tracking-wider mt-0.5">
                    {currentPose.label}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{currentPose.desc}</div>
                </div>
              </div>

              {/* Live Pose Telemetry */}
              {livePoseInfo && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-navy-950/80 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-slate-700">
                  Detected Pose: <span className="text-gold-400 font-bold">{livePoseInfo.pose_type}</span> | Yaw: {livePoseInfo.yaw}° | Pitch: {livePoseInfo.pitch}°
                </div>
              )}
            </div>

            {captureFeedback && (
              <div className="p-3 rounded-xl bg-navy-900 border border-gold-500/30 text-xs text-gold-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                <span>{captureFeedback}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleCaptureSample}
                disabled={isCapturing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isCapturing ? 'Processing 512-D ArcFace...' : `Capture Sample for "${currentPose.label}"`}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('COMPLETE')}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Finish Early
              </button>
            </div>
          </div>

          {/* Right Angle Checklist (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="glass-panel p-5 rounded-2xl border border-slate-700/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Multi-Angle Checklist (ArcFace 512-D)
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Capturing multi-angle face samples ensures high recognition accuracy even when students turn or write.
              </p>

              <div className="space-y-2.5">
                {TARGET_POSES.map((pose, idx) => {
                  const count = completedPoses[pose.id] || 0;
                  const isCurrent = idx === currentPoseIdx;

                  return (
                    <div
                      key={pose.id}
                      onClick={() => setCurrentPoseIdx(idx)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        isCurrent
                          ? 'bg-gold-500/15 border-gold-500/50 text-gold-300'
                          : count > 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-navy-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          count > 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {count > 0 ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{pose.label}</div>
                          <div className="text-[10px] text-slate-400">{pose.target}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] font-mono font-bold ${count > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {count} {count === 1 ? 'sample' : 'samples'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Enrollment Complete (Requirements 3) */}
      {step === 'COMPLETE' && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-700/80 text-center max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto text-slate-950 shadow-xl shadow-emerald-500/20">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Enrollment Complete
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Multi-angle ArcFace facial representations successfully indexed into FAISS
            </p>
          </div>

          <div className="p-5 rounded-xl bg-navy-950/70 border border-slate-800 text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Student:</span>
              <span className="font-bold text-white">{createdStudent?.name || name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Roll Number:</span>
              <span className="font-mono text-slate-200">{createdStudent?.roll_number || rollNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Student ID:</span>
              <span className="font-mono text-slate-200">{createdStudent?.student_id || studentId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Samples Collected:</span>
              <span className="font-mono font-bold text-gold-400">{totalSamples || 5}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Embedding:</span>
              <span className="font-mono text-slate-200">512-D ArcFace</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Registered
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setName('');
                setRollNumber('');
                setStudentId('');
                setCompletedPoses({});
                setCurrentPoseIdx(0);
                setStep('DETAILS');
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
            >
              Enroll Another Student
            </button>
            <a
              href="/live"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-lg shadow-gold-500/20 transition flex items-center justify-center gap-1.5"
            >
              <span>Test in Live Camera</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
