from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import fitz  # PyMuPDF
import spacy
import os
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase connection (reads from .env) ────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Load spaCy NLP model ─────────────────────────────────────────
nlp = spacy.load("en_core_web_sm")

# ── Common tech keywords for ATS scoring ────────────────────────
TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "node", "nodejs",
    "fastapi", "django", "flask", "sql", "postgresql", "mysql", "mongodb",
    "docker", "kubernetes", "git", "github", "aws", "azure", "gcp",
    "machine learning", "deep learning", "tensorflow", "pytorch", "nlp",
    "rest", "api", "html", "css", "tailwind", "next.js", "vue", "angular",
    "java", "c++", "c#", "golang", "rust", "linux", "ci/cd", "agile",
    "data analysis", "pandas", "numpy", "scikit-learn", "excel", "tableau",
]


def extract_skills(text: str) -> list[str]:
    """Return a list of tech keywords present in the resume text."""
    text_lower = text.lower()
    return [kw for kw in TECH_KEYWORDS if kw in text_lower]


def compute_ats_score(found_skills: list[str]) -> int:
    """Simple ATS score: % of known tech keywords found in the resume."""
    if not TECH_KEYWORDS:
        return 0
    score = int((len(found_skills) / len(TECH_KEYWORDS)) * 100)
    return min(score, 100)  # cap at 100


@app.post("/process-resume")
async def process_resume(user_id: str = Form(...), file: UploadFile = File(...)):
    try:
        # 1. Extract text from the PDF
        pdf_content = await file.read()
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        full_text = "".join(page.get_text() for page in doc)

        if not full_text.strip():
            return {"status": "error", "message": "Could not extract text from PDF. Ensure the PDF is not image-only/scanned."}

        # 2. NLP processing with spaCy
        doc_ai = nlp(full_text[:100_000])  # cap at 100k chars to avoid memory issues

        # 3. Skill extraction & ATS score
        extracted_skills = extract_skills(full_text)
        missing_skills   = [kw for kw in TECH_KEYWORDS if kw not in [s.lower() for s in extracted_skills]]
        ats_score        = compute_ats_score(extracted_skills)

        # 4. Extract a clean bio (first ~500 chars, stripped)
        extracted_bio = full_text[:500].strip()

        # 5. Update the Supabase profile
        supabase.table("profiles").update({
            "bio": extracted_bio,
        }).eq("id", user_id).execute()

        # 6. Return structured data the frontend analyzer page expects
        return {
            "status": "success",
            "message": "Resume parsed successfully!",
            "data": {
                "user_id":          user_id,
                "ats_score":        ats_score,
                "extracted_skills": extracted_skills,
                "missing_skills":   missing_skills[:20],  # show up to 20 missing
                "bio":              extracted_bio,
                "tailored_content": full_text,
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/export-latex")
async def export_latex(payload: dict):
    """Placeholder for LaTeX export — implement PDF generation here."""
    return {"status": "error", "message": "LaTeX export not yet implemented on this server."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)