# AI-Based Smart Online Examination Proctoring System

An AI-powered exam proctoring system that monitors students during online examinations using computer vision, behavioral analytics, and large language models. Built entirely with free and open-source tools.

## Features

- Face Detection with YOLOv8
- Gaze Tracking with MediaPipe
- Phone Detection with YOLOv8
- Person Counting
- Suspicion Score Engine with real-time escalation
- Tab Switch Detection with auto exam termination
- Violation Logging to PostgreSQL
- Admin Dashboard with live monitoring
- AI Report Generation with Llama 3.2 via Ollama
- JWT Authentication
- WebSocket real-time frame streaming

## Tech Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: FastAPI, Python 3.11
- Computer Vision: YOLOv8, MediaPipe, OpenCV
- LLM: Ollama + Llama 3.2 3B (local, free)
- Database: PostgreSQL 16
- Cache: Redis 7
- Auth: JWT
- Real-time: WebSockets
- Infrastructure: Docker, Docker Compose

## Quick Start

### Prerequisites
- Python 3.11
- Node.js 20+
- Docker Desktop
- Ollama from https://ollama.com

### 1. Clone the repo
git clone https://github.com/Benjamin4103/proctoring-system.git
cd proctoring-system

### 2. Start infrastructure
docker compose up -d db redis
ollama pull llama3.2:3b

### 3. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python create_tables.py
python create_users.py
uvicorn app.main:app --reload

### 4. Frontend
cd frontend
npm install
npm run dev

### 5. Open in browser
- Student exam: http://localhost:3000/exam/demo
- Admin dashboard: http://localhost:3000/admin/dashboard
- API docs: http://localhost:8000/docs

### Default credentials
- Admin: admin@test.com / password123
- Student: student@test.com / password123

## Author
Nirmit - https://github.com/Benjamin4103
