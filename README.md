
# AI-Based Smart Attendance Monitoring System

An AI-powered attendance monitoring system that uses computer vision, face recognition, and liveness verification to automate classroom attendance tracking.

The project combines a **FastAPI backend** with a **Next.js frontend** to support student enrollment, live attendance monitoring, session management, attendance history, analytics, and evaluation.

## ✨ Features

- **AI-Based Face Detection** using YOLO-based computer vision.
- **Face Recognition** using ArcFace-based facial embeddings.
- **FAISS Similarity Search** for efficient facial embedding matching.
- **Multi-Angle Face Enrollment** to support facial variations.
- **Liveness Verification** to help reduce spoofing attempts.
- **Live Attendance Monitoring** through a camera-based interface.
- **Automated Attendance Tracking** using backend processing services.
- **Student Management** for enrollment and student records.
- **Session Management** for attendance sessions.
- **Attendance History** to review attendance records.
- **Analytics Dashboard** for attendance-related statistics.
- **Evaluation Module** for system evaluation.
- **REST APIs and WebSockets** for frontend-backend communication.

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy

### AI and Computer Vision
- OpenCV
- YOLO-based Face Detection
- ArcFace Face Recognition
- FAISS Similarity Search
- Liveness Verification

### Database and Communication
- SQLite / PostgreSQL configuration
- REST APIs
- WebSockets

## 🏗️ Project Structure

    attendance-ai/
    ├── backend/
    │   └── app/
    │       ├── api/
    │       ├── core/
    │       ├── database/
    │       ├── models/
    │       ├── schemas/
    │       ├── services/
    │       ├── vision/
    │       └── main.py
    ├── frontend/
    │   ├── app/
    │   │   ├── analytics/
    │   │   ├── architecture/
    │   │   ├── dashboard/
    │   │   ├── enrollment/
    │   │   ├── evaluation/
    │   │   ├── history/
    │   │   ├── live/
    │   │   ├── sessions/
    │   │   ├── settings/
    │   │   └── students/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── types/
    ├── docs/
    ├── tests/
    ├── docker-compose.yml
    ├── .env.example
    ├── .gitignore
    └── README.md

## ⚙️ Prerequisites

Install the following before running the project:

- Python
- Node.js and npm
- Git
- A compatible webcam for live camera functionality
- Required Python dependencies and AI model files

PostgreSQL is optional if the configured SQLite fallback is used.

## 🚀 Getting Started

### 1. Clone the Repository

    git clone https://github.com/stutirai/ai-smart-attendance.git
    cd ai-smart-attendance

### 2. Configure Environment Variables

Review the `.env.example` file and configure the required environment variables for your local setup.

Example configuration:

    DATABASE_URL=
    CAMERA_SOURCE=0
    IS_DEMO_MODE=True
    RECOGNITION_THRESHOLD=0.55
    ENABLE_LIVENESS=True

An empty database URL may use the local SQLite fallback, depending on the backend configuration.

**Never commit real passwords, API keys, or private credentials.**

### 3. Set Up the Backend

Open a terminal in the project root:

    cd backend
    python -m venv .venv

Activate the virtual environment on Windows:

    .venv\Scripts\Activate.ps1

Install dependencies using the project's dependency file, if available:

    pip install -r requirements.txt

Start the backend from the `backend` directory:

    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

### 4. Set Up the Frontend

Open a second terminal:

    cd frontend
    npm install
    npm run dev

Open the application at:

http://localhost:3000

Keep both the frontend and backend running while using the application.

## 📸 Application Modules

| Module | Description |
|---|---|
| Dashboard | Overview of attendance information |
| Student Enrollment | Student registration and face enrollment |
| Live Monitoring | Live attendance monitoring interface |
| Sessions | Attendance session management |
| Attendance History | Review attendance records |
| Analytics | Attendance statistics |
| Evaluation | System evaluation functionality |
| Settings | Application configuration |
| Architecture | System architecture overview |

Available functionality depends on backend configuration, database state, camera availability, and installed AI models.

## 🔄 How It Works

1. **Student Enrollment:** Student information and facial samples are captured through the enrollment workflow.
2. **Face Detection:** The computer-vision pipeline detects faces from camera input.
3. **Face Recognition:** Facial embeddings are generated using the configured recognition model.
4. **Similarity Search:** FAISS searches stored facial embeddings for potential identity matches.
5. **Liveness Verification:** The system applies its configured liveness-checking process.
6. **Attendance Processing:** The backend processes recognition results according to its attendance logic.
7. **Record Management:** Attendance data is associated with relevant sessions and records.
8. **Visualization:** The frontend displays attendance information and available analytics.

Recognition accuracy depends on the models, thresholds, camera conditions, lighting, and enrollment quality.

## 🧪 Testing

The repository includes tests for API functionality, FAISS search, and temporal attendance logic.

Install the required test dependencies, then run from the project root:

    python -m pytest tests/

Additional dependencies may be required by individual tests.

## 🔐 Privacy and Security

- Never commit real `.env` files, passwords, API keys, or other secrets.
- Do not publish real student records, facial images, biometric embeddings, or private information.
- Keep local databases and private model artifacts out of public version control.
- Restrict access to camera streams and attendance APIs.
- Obtain appropriate consent before collecting or processing biometric information.
- Configure authentication, authorization, and secure deployment settings before real-world use.

## ⚠️ Limitations

- Live monitoring requires a working camera and an accessible backend stream.
- AI model files and dependencies may need to be installed separately.
- Recognition may be affected by lighting, camera quality, facial pose, and occlusion.
- A face match alone does not guarantee physical presence.
- Local development settings are not intended as a complete production deployment configuration.

## 🔮 Future Improvements

- Improve recognition robustness across different lighting conditions and facial poses.
- Add stronger authentication and role-based access control.
- Improve biometric data protection and retention policies.
- Add configurable attendance reports and exports.
- Introduce automated testing and continuous integration.
- Improve error handling, monitoring, and deployment automation.

## 👩‍💻 Author

**Stuti Rai**

B.Tech — Artificial Intelligence and Data Science

GitHub: [@stutirai](https://github.com/stutirai)

## 📄 License

No license has been specified yet. Unless a license is added, reuse and redistribution are subject to applicable copyright law.

---

⭐ If you find this project useful, consider starring the repository.
