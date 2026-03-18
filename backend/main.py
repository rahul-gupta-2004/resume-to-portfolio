from fastapi import FastAPI, UploadFile, File, Form, Response, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import fitz  # PyMuPDF
import spacy
import os
import re
import json
import io
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from ats_score import ATSScoreCalculator
from apify_client import ApifyClient
import requests
from groq import Groq
import razorpay
import hmac
import hashlib

# Load environment variables
load_dotenv()

# Configure Gemini with the new SDK
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
GEMINI_MODEL = "gemini-2.0-flash" # Updated default

# Configure Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

app = FastAPI()

# Apify client
APIFY_API_KEY = os.getenv("APIFY_API_KEY")
apify_client = ApifyClient(APIFY_API_KEY)

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

# ── Razorpay connection (reads from .env) ────────────────────────
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

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
async def process_resume(
    user_id: str = Form(...), 
    file: UploadFile = File(...),
    job_description: str | None = Form(None),
    model_id: str = Form("gemini")
):
    print(f"--- [ANALYSIS] USING MODEL: {model_id} ---")
    try:
        # 1. Extract text from the PDF
        pdf_content = await file.read()
        
        # We'll use ATSScoreCalculator's method
        calculator = ATSScoreCalculator(job_description)
        full_text = calculator.extract_text_from_bytes(pdf_content)

        if not full_text.strip():
            return {"status": "error", "message": "Could not extract text from PDF."}

        # 2. Comprehensive ATS Analysis
        ats_results = calculator.calculate_ats_score_from_text(full_text)
        ats_score = ats_results.get('total_score', 0)

        # 3. AI Recommendations in JSON format
        prompt = f"""
        You are an expert career coach. Analyze these ATS results and the resume text.
        Job Description: {job_description or "General Software Development"}
        
        ATS Analysis Results: {json.dumps(ats_results, indent=2)}
        Extracted Resume Text (Partial): {full_text[:2000]}

        Provide exactly 5 specific, high-impact recommendations to improve the ATS score.
        Return the response as a JSON object with a single key "recommendations" containing an array of strings.
        Each string should be a concise, actionable recommendation.
        Example format: {{"recommendations": ["Add 'Python' to technical skills", "Quantify experience in role X", ...]}}
        """
        try:
            if model_id.lower() == "gemini":
                gemini_resp = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                    }
                )
                ai_data = json.loads(gemini_resp.text)
            else:
                # Use Groq
                completion = groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                ai_data = json.loads(completion.choices[0].message.content)
            
            recommendations_list = ai_data.get("recommendations", [])
        except Exception as e:
            print(f"AI Error ({model_id}): {e}")
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                recommendations_list = [f"API Rate Limit Exceeded: Please wait a moment before trying again. ({error_msg})"]
            else:
                recommendations_list = [f"Could not generate AI recommendations at this time. Error: {error_msg}"]

        # 4. Return comprehensive results
        found_skills = [s for s in calculator.common_skills if s in full_text.lower()]
        return {
            "status": "success",
            "message": "Resume analyzed successfully!",
            "data": {
                "user_id": user_id,
                "ats_score": ats_score,
                "score_breakdown": ats_results,
                "recommendations": recommendations_list,
                "extracted_skills": found_skills
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ── Placement Kanban Endpoints ────────────────────────────────────────

class ApplicationSchema(BaseModel):
    user_id: str
    company: str
    role: str
    status: str = "Applied"
    date_applied: str | None = None
    next_step: str = ""
    notes: str = ""
    salary: str = ""
    location: str = ""

@app.post("/applications")
async def create_application(app_data: ApplicationSchema):
    try:
        data = {
            "user_id": app_data.user_id,
            "company": app_data.company,
            "role": app_data.role,
            "status": app_data.status,
            "date_applied": app_data.date_applied or datetime.now().date().isoformat(),
            "next_step": app_data.next_step,
            "notes": app_data.notes,
            "salary": app_data.salary,
            "location": app_data.location
        }
        res = supabase.table("applications").insert(data).execute()
        if not res.data:
            raise Exception("Failed to insert data into Supabase. Check if table 'applications' exists.")
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/applications/{user_id}")
async def get_applications(user_id: str):
    try:
        res = supabase.table("applications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/applications/{app_id}")
async def update_application(app_id: str, updates: dict):
    try:
        res = supabase.table("applications").update(updates).eq("id", app_id).execute()
        if not res.data:
            raise Exception("Failed to update application. Not found or permission denied.")
        return {"status": "success", "data": res.data[0]}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/applications/{app_id}")
async def delete_application(app_id: str):
    try:
        res = supabase.table("applications").delete().eq("id", app_id).execute()
        return {"status": "success", "message": "Deleted successfully"}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/compile-pdf")
async def compile_pdf(req: dict):
    # This endpoint is kept but cleaned up to avoid LaTeX compilation errors
    # as the user asked to remove resume tailor which used this.
    # However, it might be used by other features, so we'll keep it minimal.
    latex = req.get("latex", "")
    print(f"--- [COMPILE] LaTeX length: {len(latex)} characters ---")
    if not latex.strip():
        return Response(content="Empty LaTeX code.", status_code=400)
        
    try:
        # texlive.net is usually the most reliable for pure cloud compilation
        payload = {
            "filecontents[]": latex,
            "filename[]": "main.tex",
            "engine": "pdflatex",
            "return": "pdf"
        }
        res = requests.post("https://texlive.net/cgi-bin/latexcgi", data=payload, timeout=60)
        if res.status_code == 200 and res.content.startswith(b"%PDF-"):
            return Response(content=res.content, status_code=200, media_type="application/pdf")
        
        return Response(content="Compilation failed.", status_code=400, media_type="text/plain")
    except Exception as e:
        return Response(content=f"Error: {str(e)}", status_code=500, media_type="text/plain")


@app.post("/chatbot")
async def chatbot(payload: dict):
    user_msg = str(payload.get("message", ""))
    chat_history: list = payload.get("history", [])
    
    system_prompt = """
    You are Profilr AI, the official assistant for the Profilr platform. 
    Profilr is an AI-powered ATS optimization and career management tool.
    
    Features of Profilr:
    - Placement Kanban Dashboard (Track job applications).
    - ATS Score Analysis (Industry-standard scoring).
    - AI-Powered Recommendations via Google Gemini.
    - Dynamic Public Portfolios.
    - Visit Analytics.
    
    STRICT RULES:
    1. ONLY answer questions related to Profilr, career growth, resumes, or job search.
    2. Politeness & Professionalism: Always be encouraging.
    3. If the user asks about unrelated topics, say: "I'm specialized in Profilr and career growth."
    4. Keep answers short (max 3 sentences unless asked for details).
    """
    
    try:
        contents = []
        for msg in chat_history:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
        
        prompt_content = f"{system_prompt}\n\nUSER QUESTION: {user_msg}"
        contents.append({"role": "user", "parts": [{"text": prompt_content}]})

        model_id = payload.get("model_id", "gemini").lower()

        if model_id == "gemini":
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents
            )
            reply_text = response.text
        else:
            # Use Groq
            groq_messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
            for msg in chat_history:
                role = "user" if msg.get("role") == "user" else "assistant"
                content = str(msg.get("content", ""))
                groq_messages.append({"role": role, "content": content})
            groq_messages.append({"role": "user", "content": user_msg})

            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=groq_messages
            )
            reply_text = completion.choices[0].message.content

        return {"status": "success", "reply": reply_text}
    except Exception as e:
        return {"status": "error", "message": f"AI Error: {str(e)}"}


class LinkedInRequest(BaseModel):
    url: str


def extract_linkedin_username(url: str) -> str | None:
    match = re.search(r"linkedin\.com/in/([^/?#]+)", url)
    if match:
        return match.group(1).strip('/')
    return None


@app.post("/fetch-linkedin")
async def fetch_linkedin(req: LinkedInRequest):
    username = extract_linkedin_username(req.url)
    if not username:
        return {"status": "error", "message": "Invalid LinkedIn URL."}

    try:
        run_input = {
            "usernames": [username],
            "username": username,
            "proxy": {"useApifyProxy": True}
        }
        run = apify_client.actor("apimaestro/linkedin-profile-detail").call(run_input=run_input)
        dataset_items = list(apify_client.dataset(run["defaultDatasetId"]).iterate_items())
        
        if not dataset_items:
            return {"status": "error", "message": "No data found for this profile."}
        
        profile_data = dataset_items[0]
        basic = profile_data.get("basic_info") or {}
        
        return {
            "status": "success",
            "data": {
                "full_name": basic.get("fullname") or basic.get("fullName") or "",
                "headline": basic.get("headline", ""),
                "bio": basic.get("about") or basic.get("summary") or "",
                "avatar_url": basic.get("profile_picture_url") or profile_data.get("profilePicUrl", ""),
                "linkedin_url": req.url,
                "skills": basic.get("top_skills", []),
                "education": [
                    {
                        "institution": edu.get("school", ""),
                        "degree": edu.get("degree_name") or edu.get("degree", ""),
                        "field": edu.get("field_of_study", ""),
                        "start_year": (edu.get("start_date") or {}).get("year", ""),
                        "end_year": (edu.get("end_date") or {}).get("year", "")
                    }
                    for edu in (profile_data.get("education") or [])
                ],
                "experience": [
                    {
                        "company": exp.get("company", ""),
                        "role": exp.get("title", ""),
                        "description": exp.get("description", ""),
                        "location": exp.get("location", ""),
                        "duration": exp.get("duration", ""),
                        "start_year": (exp.get("start_date") or {}).get("year", ""),
                        "end_year": (exp.get("end_date") or {}).get("year", "Present")
                    }
                    for exp in (profile_data.get("experience") or [])
                ],
                "projects": [
                    {
                        "name": proj.get("name", ""),
                        "description": proj.get("description", ""),
                        "link": proj.get("url", ""),
                        "associated_with": proj.get("associated_with", "")
                    }
                    for proj in (profile_data.get("projects") or [])
                ],
                "certifications": [
                    {
                        "name": cert.get("name", ""),
                        "issuer": cert.get("issuer", ""),
                        "date": cert.get("issued_date", "")
                    }
                    for cert in (profile_data.get("certifications") or [])
                ]
            }
        }

    except Exception as e:
        return {"status": "error", "message": f"API Error: {str(e)}"}


# ── Razorpay Endpoints ──────────────────────────────────────────

class PaymentVerifyRequest(BaseModel):
    user_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/create-razorpay-order")
async def create_razorpay_order(payload: dict):
    user_id = payload.get("user_id")
    amount = payload.get("amount", 29900)  # Default 299 INR in paise
    
    try:
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"rcpt_{str(user_id)[-10:]}_{int(datetime.now().timestamp())}",
            "payment_capture": 1
        }
        order = razorpay_client.order.create(data=order_data)
        return {"status": "success", "order": order}
    except Exception as e:
        print(f"Razorpay Order Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/verify-razorpay-payment")
async def verify_razorpay_payment(req: PaymentVerifyRequest):
    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        }
        
        # This will raise an error if signature is invalid
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # If verification successful, update user tier in Supabase
        res = supabase.table("profiles").update({
            "subscription_tier": "pro",
            "razorpay_payment_id": req.razorpay_payment_id
        }).eq("id", req.user_id).execute()
        if not res.data:
            # Maybe the profile doesn't exist yet, but it should if they are paying
            # Or handle it gracefully
            pass

        return {"status": "success", "message": "Payment verified and tier updated to PRO!"}
    except Exception as e:
        print(f"Razorpay Verification Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid payment signature or database error.")

@app.get("/get-user-tier/{user_id}")
async def get_user_tier(user_id: str):
    try:
        res = supabase.table("profiles").select("subscription_tier, custom_slug").eq("id", user_id).single().execute()
        if res.data:
            return {"status": "success", "tier": res.data.get("subscription_tier", "free"), "custom_url": res.data.get("custom_slug")}
        return {"status": "success", "tier": "free"}
    except Exception:
        return {"status": "success", "tier": "free"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)