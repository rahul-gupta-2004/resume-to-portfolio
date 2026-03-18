# Profilr: AI-Powered Career Management Hub

**Profilr** is a comprehensive, advanced career management platform designed for students and job-seekers to optimize their applications, track their progress, and showcase their professional identity.

## Key Features

*   **ATS Score Analysis**: Get real-time, industry-standard scores for your resumes using NLP-based analysis.
*   **AI Recommendations**: Personalized, high-impact suggestions powered by **Google Gemini** and **Groq** to improve your resume content.
*   **Placement Kanban Dashboard**: Track your job applications through various stages—Applied, Interviewing, Offer, or Rejected—with a sleek drag-and-drop interface.
*   **LinkedIn Integration**: Seamlessly fetch and import profile data to build your resume or update your dashboard.
*   **Public Portfolios**: Generate a dynamic, premium public portfolio to impress recruiters.
*   **Visit Analytics**: Gain insights into how often your public profile is viewed.

## Tech Stack

### Frontend
- **React + Vite**: High-performance development.
- **Glassmorphism UI**: Modern, premium design aesthetics.
- **Tailwind CSS**: Responsive, utility-first styling.

### Backend
- **FastAPI**: Scalable, high-performance asynchronous API.
- **Supabase**: Robust database, authentication, and real-time features.
- **NLP (spaCy)**: Advanced text extraction and entity recognition for ATS scoring.
- **Multi-Model AI**: Orchestrated integration with **Google Gemini 2.0 Flash** and **Groq (Llama-3)**.
- **Razorpay**: Integrated payment gateway for premium subscription tiers.

---

## Getting Started

### Backend Setup
1. Create a virtual environment:
   ```bash
   python3 -m venv spd_venv
   source spd_venv/bin/activate
   ```
2. Install dependencies (refer to `setup_venv.txt`).
3. Configure your `.env` file with the following keys:
   `GOOGLE_API_KEY`, `GROQ_API_KEY`, `APIFY_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
