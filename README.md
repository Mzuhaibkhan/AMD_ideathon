# NutriTrack AI

A full-stack AI-powered nutrition tracking application.

## Tech Stack
- **Frontend**: Next.js 16, React 19, GSAP & Lenis (Smooth Scrolling)
- **Backend**: Python, Flask, Scikit-learn (ML modeling)
- **Database**: Supabase
- **AI/ML**: Google Generative AI (Gemini)
- **Deployment**: Docker, Nginx

## Prerequisites
- Node.js (v20+)
- Python (3.11+)
- Supabase Project (Database)
- Google Gemini API Key

## Environment Variables
Copy the `.env.example` file to create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Update the `.env` file with your specific `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.

## Local Development

### 1. Backend Setup
Navigate to the backend directory, install Python requirements, and run the Flask server:
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*The backend API will run on http://localhost:5000*

### 2. Frontend Setup
In a new terminal window, navigate to the frontend directory, install dependencies, and start the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on http://localhost:3000*

## Docker Deployment
To build and run the application using Docker (this will start the frontend, backend, and Nginx proxy in a single container):
```bash
docker build -t nutritrack-ai .
docker run -p 8080:8080 --env-file .env nutritrack-ai
```
*The application will be accessible at http://localhost:8080*
