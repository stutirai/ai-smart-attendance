# Viva & Project Demonstration Guide

**Project Title:** AI-Based Smart Attendance Monitoring System: Zero-Interference Classroom Attendance via Periodic Temporal Face Verification  
**Group G10:** Shivani Singh (2401321630054) & Stuti Rai (2401321630060)  
**Supervisor:** Ms. Swati Singh (Assistant Professor), Dept of AI / AI&DS, GNIOT  

---

## 1. Core Concept & Problem Solved (Slide 3–5)

### Problem with Existing Attendance Systems
1. **Manual Roll Call / Paper Sheets:**
   - Wastes 10–15% of instructional lecture time.
   - Susceptible to proxy calling and manual recording errors.
2. **RFID Cards & Dynamic QR Codes:**
   - Require active student intervention (queues at door).
   - Prone to buddy punching (swapping cards) and QR screenshot forwarding.
3. **Single-Snapshot Face AI:**
   - A single point of failure: students who look down to write, sneeze, or turn their head at the moment of capture are marked absent.
   - Vulnerable to proxy bunking (students mark attendance once and leave the class).
   - Fails on distant "backbenchers" whose faces fall below ~20x20 pixels in conventional Haar cascade detectors.

### Our Solution: Periodic Temporal Sampling + Burst-Window Verification
- **Zero-Interference:** The camera passively observes the classroom continuously; students do not scan cards, codes, or stand in queues.
- **5-Interval Temporal Sampling:** Presence is validated periodically across 5 distinct intervals distributed throughout the lecture.
- **Burst-Window Aggregation:** During each interval, multiple frames are captured over a burst window (e.g. 5s in demo / 30s in real). If the student is recognized across multiple burst frames, the interval is passed. A single bad frame from looking down or turning head does not cause absence!
- **Core Attendance Rule:**
  $$\text{Verified in } \ge 3 \text{ out of } 5 \text{ intervals} \implies \mathbf{PRESENT}$$
  $$\text{Verified in } < 3 \text{ out of } 5 \text{ intervals} \implies \mathbf{NOT\ VERIFIED\ /\ ABSENT}$$

---

## 2. Live Demonstration Script for Examiners

Follow this exact procedure during your viva/project evaluation:

### Step 1: Login
- Open `http://localhost:3000`
- Log in with faculty credentials: `faculty@gniot.net.in` / `admin123`
- Show the **Faculty Dashboard** cards (Total Students, Present Today, Absent Today, Attendance Rate).

### Step 2: Multi-Angle Student Enrollment
- Click **Enrollment** in the sidebar.
- Enter student details (Name, Roll Number, Student ID).
- Click **Proceed to Face Capture**.
- Demonstrate the multi-angle pose guidance:
  1. *LOOK STRAIGHT* (Frontal face)
  2. *TURN LEFT* (Yaw ~ -30°)
  3. *TURN RIGHT* (Yaw ~ +30°)
  4. *LOOK SLIGHTLY UP* (Pitch ~ +15°)
  5. *LOOK SLIGHTLY DOWN* (Pitch ~ -15°)
- Show the summary: 512-D ArcFace embedding generated and added to FAISS vector index.

### Step 3: Start Live Attendance Session (Demo Mode)
- Click **Live Attendance** in the sidebar.
- Ensure **Demo Mode** is active (5-second burst every 15 seconds).
- Click **START ATTENDANCE SESSION**.
- Position students in front of the laptop webcam.

### Step 4: Explain Real-Time CV Pipeline
- Point to the live feed:
  - **YOLOv8-Face / Dense SCRFD:** Bounding boxes detect faces even when distant or turned.
  - **ArcFace 512-D Embeddings:** Extracts facial features invariant to lighting and pose.
  - **FAISS Cosine Index:** Sub-millisecond vector lookup with strict threshold rejection (`UNKNOWN` for unregistered faces).
  - **Prototype Liveness:** Multi-frame micro-motion / eye landmark variance flags static 2D photos.

### Step 5: Observe Temporal 5-Interval Progression
- Watch the bottom matrix update live across Interval 1 through Interval 5:
  - **Student 1 (Stuti Rai):** Present in front of camera during intervals 1, 2, 3, 5 -> Result: `4/5 Verified -> PRESENT (✓)`.
  - **Student 2 (Shivani Singh):** Leaves camera view or turns away for intervals 2, 3, 5 -> Result: `2/5 Verified -> NOT VERIFIED (✗)`.
  - Show how looking down for 1 interval does *not* make the student absent because they satisfied $\ge 3/5$ intervals!

### Step 6: Attendance History & CSV Export
- Click **Attendance History** in sidebar.
- Filter by Subject or Date.
- Click **Export All Records (CSV)** and open the exported CSV file in Excel/Notepad.

### Step 7: System Architecture & Evaluation Pages
- Navigate to **Architecture** to show the animated pipeline matching Slide 6.
- Navigate to **Evaluation** and click **Run Prototype Evaluation** to show real measured Accuracy, Precision, Recall, and FAISS Latency (< 2ms).

---

## 3. Anticipated Viva Questions & Technical Answers

**Q1: Why did you choose 5 intervals and a 3/5 threshold?**  
*Answer:* A 50-minute college lecture divides naturally into five 10-minute blocks. Requiring at least 3 verified intervals ensures the student was physically in the classroom for the majority (≥ 60%) of instructional time, eliminating the proxy bunking problem where a student checks in once and immediately walks out.

**Q2: What is the benefit of a burst window over a single snapshot?**  
*Answer:* In a real classroom, students take notes, bend over books, or turn to ask doubts. A single snapshot would falsely mark an attentive student absent if captured while writing. Our burst window captures dozens of frames over 30 seconds; if the student is recognized in just a few of those frames, the interval passes successfully.

**Q3: How does FAISS improve the system over standard linear comparison?**  
*Answer:* As shown in our Evaluation page and Slide 7, linear comparison over 60 students takes > 450 ms, causing video lag. FAISS `IndexFlatIP` performs SIMD-accelerated inner product on L2-normalized 512-D vectors in less than 2 milliseconds, maintaining 30 FPS video throughput.

**Q4: How does your prototype handle photo presentation attacks (spoofing)?**  
*Answer:* We implemented multi-frame temporal micro-motion analysis and landmark variance. A static printed photo or frozen smartphone display exhibits near-zero non-rigid deformation across frames, causing the system to flag `LIVENESS FAILED`.
