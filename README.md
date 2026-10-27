# AI-Based Smart Attendance Monitoring System

**Zero-Interference Classroom Attendance via Periodic Temporal Face Verification**

### Project Information
- **Group:** G10
- **Team Members:**
  - **Stuti Rai** (Roll No: 2401321630060)
  - **Shivani Singh** (Roll No: 2401321630054)
- **Project Supervisor:** Ms. Swati Singh (Assistant Professor)
- **Department:** Department of AI & AI/DS
- **Institution:** Greater Noida Institute of Technology (GNIOT), Greater Noida, India

---

## Architecture Overview

```
CAMERA / RTSP VIDEO
        ↓
   APScheduler
        ↓
Periodic Verification Trigger (10m in Real / 15s in Demo)
        ↓
30-second Verification Burst (5s in Demo)
        ↓
YOLOv8-Face / Dense Detection
        ↓
InsightFace (ArcFace 512-D Normalized Embeddings)
        ↓
FAISS Vector Similarity Search (IndexFlatIP < 2ms)
        ↓
Burst-Window Aggregation & Prototype Liveness
        ↓
Temporal Verification Across 5 Intervals
        ↓
Attendance Decision Rule (≥ 3 / 5 → PRESENT; else ABSENT)
        ↓
PostgreSQL / Local DB Storage
        ↓
Next.js Faculty Dashboard (Live WebSockets, History & CSV)
```

---

## Core Attendance Rule

$$\text{Verified in } \ge 3 \text{ out of } 5 \text{ intervals} \implies \mathbf{PRESENT}$$
$$\text{Verified in } < 3 \text{ out of } 5 \text{ intervals} \implies \mathbf{NOT\ VERIFIED\ /\ ABSENT}$$

---

## Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, WebSockets.
- **Backend:** Python 3.10+, FastAPI, Uvicorn, APScheduler, SQLAlchemy.
- **Computer Vision:** OpenCV, InsightFace, YOLOv8-Face, ArcFace (512-D embeddings).
- **Vector Search:** FAISS (`faiss-cpu`, cosine similarity via `IndexFlatIP`).
- **Database:** PostgreSQL (with automatic zero-setup SQLite fallback).

---

## Quick Start Guide (Windows)

### 1. Launch Everything via 1-Click Script
Double-click `start_all.bat` in the project root directory.  
It will automatically launch both:
- **Backend API:** `http://127.0.0.1:8000` (Docs at `/docs`)
- **Faculty Portal:** `http://localhost:3000`

### 2. Manual Terminal Commands

#### Start Backend (Terminal 1)
```bash
cd attendance-ai\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Start Frontend (Terminal 2)
```bash
cd attendance-ai\frontend
npm run dev
```

---

## Step-by-Step Viva Demonstration Workflow

1. Open your browser at `http://localhost:3000`.
2. Login with faculty credentials: `faculty@gniot.net.in` / `admin123`.
3. Go to **Enrollment**:
   - Register a student (e.g. your name and roll number).
   - Follow the multi-angle pose guide (*Look Straight*, *Turn Left*, *Turn Right*, *Look Up*, *Look Down*).
   - Observe the 512-D ArcFace embedding generated and added to the FAISS index.
4. Go to **Live Attendance**:
   - Verify camera is connected (shows laptop webcam feed).
   - Ensure Demo Mode is active.
   - Click **START ATTENDANCE SESSION**.
   - Show how the system captures multi-frame burst observations.
   - Watch intervals 1 through 5 complete.
   - Show how a student verified in $\ge 3$ intervals is marked `PRESENT`, while a student verified in $< 3$ intervals is marked `NOT VERIFIED`.
5. Go to **Attendance History**:
   - Filter by date or subject.
   - Click **Export All Records (CSV)** to download the attendance sheet.
6. Go to **Evaluation**:
   - Click **Run Prototype Evaluation** to display real measured Accuracy, Precision, Recall, and FAISS Latency (< 2ms).
7. Go to **Architecture**:
   - Review the live animated pipeline matching Slide 6 of the PPT.
