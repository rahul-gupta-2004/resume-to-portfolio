import PyPDF2
import io
import re
import os
import json
from typing import Dict, List
import nltk
from nltk.corpus import stopwords
import spacy

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')

# Load spaCy model for NLP tasks
try:
    nlp = spacy.load('en_core_web_sm')
except:
    import subprocess
    subprocess.run(['python', '-m', 'spacy', 'download', 'en_core_web_sm'])
    nlp = spacy.load('en_core_web_sm')

class ATSScoreCalculator:
    def __init__(self, job_description: str = None):
        """
        Initialize ATS Score Calculator
        
        Args:
            job_description: Optional job description to compare against
        """
        self.stop_words = set(stopwords.words('english'))
        self.job_description = job_description
        
        # Common resume sections to check
        self.required_sections = [
            'education', 'experience', 'skills', 'summary',
            'projects', 'certifications', 'achievements'
        ]
        
        # Common skills (you can expand this)
        self.common_skills = {
            'python', 'java', 'javascript', 'sql', 'excel', 'powerpoint',
            'word', 'project management', 'leadership', 'communication',
            'teamwork', 'data analysis', 'machine learning', 'aws', 'azure',
            'cloud', 'agile', 'scrum', 'customer service', 'sales', 'django',
            'flask', 'react', 'angular', 'mongodb', 'postgresql', 'mysql',
            'git', 'docker', 'kubernetes', 'jenkins', 'linux', 'bash'
        }
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """
        Extract text from a local PDF file
        
        Args:
            file_path: Path to the local PDF file
            
        Returns:
            Extracted text from the PDF
        """
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                raise Exception(f"File not found: {file_path}")
            
            # Read the PDF file
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract text from all pages
                text = ""
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    extracted_text = page.extract_text()
                    if extracted_text:
                        text += extracted_text + "\n"
                
                if not text.strip():
                    raise Exception("No text could be extracted from the PDF")
                
                return text
        
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {e}")
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess the extracted text
        
        Args:
            text: Raw text from resume
            
        Returns:
            Cleaned and normalized text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and digits
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', ' ', text)
        
        # Remove extra whitespaces
        text = ' '.join(text.split())
        
        return text
    
    def check_resume_sections(self, text: str) -> Dict[str, bool]:
        """
        Check if resume contains required sections
        
        Args:
            text: Resume text
            
        Returns:
            Dictionary of sections and their presence
        """
        text_lower = text.lower()
        sections_present = {}
        
        for section in self.required_sections:
            # Check for section headers (common patterns)
            patterns = [
                rf'\b{section}\b',
                rf'\b{section}s\b',
                rf'\b{section}:\b',
                rf'\b{section} -',
                rf'\b{section}\s*\n',
                rf'\n{section}\s*\n'
            ]
            
            present = any(re.search(pattern, text_lower, re.IGNORECASE) for pattern in patterns)
            sections_present[section] = present
        
        return sections_present
    
    def calculate_formatting_score(self, text: str) -> float:
        """
        Calculate formatting score based on various factors
        
        Args:
            text: Resume text
            
        Returns:
            Formatting score (0-100)
        """
        score = 100
        deductions = []
        
        # Check for bullet points (good for ATS)
        bullet_points = len(re.findall(r'[•●○■▪➢\-]\s', text))
        if bullet_points < 5:
            deductions.append(10)  # Deduct for too few bullet points
        elif bullet_points > 30:
            deductions.append(5)   # Slight deduction for too many
        
        # Check for consistent spacing
        if re.search(r'\n\s*\n\s*\n', text):  # Too many blank lines
            deductions.append(5)
        
        # Check for very long lines (might indicate formatting issues)
        lines = text.split('\n')
        if lines:
            long_lines = sum(1 for line in lines if len(line.split()) > 25)
            if long_lines > len(lines) * 0.3:  # More than 30% are long lines
                deductions.append(10)
        
        # Check for proper section separation
        section_breaks = len(re.findall(r'\n[A-Z\s]{3,}\n', text))
        if section_breaks < 2:
            deductions.append(15)
        elif section_breaks < 4:
            deductions.append(5)
        
        # Check for consistent formatting (dates, etc.)
        date_patterns = len(re.findall(r'\b\d{4}\s*[-–—]\s*(?:\d{4}|present|current)\b', text.lower()))
        if date_patterns < 2:
            deductions.append(10)
        
        # Apply deductions
        total_deduction = min(sum(deductions), 70)  # Cap deduction at 70
        score = max(score - total_deduction, 0)
        
        return score
    
    def calculate_keyword_score(self, text: str) -> float:
        """
        Calculate keyword optimization score
        
        Args:
            text: Resume text
            
        Returns:
            Keyword score (0-100)
        """
        processed_text = self.preprocess_text(text)
        words = processed_text.split()
        
        # Check for action verbs
        action_verbs = {
            'managed', 'led', 'created', 'developed', 'implemented',
            'achieved', 'increased', 'decreased', 'improved', 'designed',
            'built', 'coordinated', 'executed', 'generated', 'reduced',
            'analyzed', 'optimized', 'transformed', 'accelerated', 'delivered',
            'spearheaded', 'pioneered', 'launched', 'architected', 'engineered'
        }
        
        action_verb_count = sum(1 for word in words if word in action_verbs)
        action_verb_score = min(30, action_verb_count * 2)  # Max 30 points
        
        # Check for industry-specific keywords (if job description provided)
        keyword_score = 0
        if self.job_description:
            job_keywords = set(self.preprocess_text(self.job_description).split())
            resume_keywords = set(words)
            
            matching_keywords = resume_keywords.intersection(job_keywords)
            keyword_match_ratio = len(matching_keywords) / len(job_keywords) if job_keywords else 0
            keyword_score = min(40, keyword_match_ratio * 50)
        
        # Check for skills
        skills_found = set()
        for skill in self.common_skills:
            if skill in processed_text:
                skills_found.add(skill)
        
        skills_score = min(30, len(skills_found) * 2.5)  # Max 30 points
        
        total_keyword_score = action_verb_score + keyword_score + skills_score
        return min(total_keyword_score, 100)
    
    def calculate_contact_info_score(self, text: str) -> float:
        """
        Check if resume contains proper contact information
        
        Args:
            text: Resume text
            
        Returns:
            Contact info score (0-100)
        """
        score = 0
        text_lower = text.lower()
        
        # Check for email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if re.search(email_pattern, text):
            score += 30
        
        # Check for phone number (various formats)
        phone_patterns = [
            r'\b[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}\b',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\b\d{10}\b'
        ]
        for pattern in phone_patterns:
            if re.search(pattern, text):
                score += 30
                break
        
        # Check for LinkedIn
        linkedin_patterns = [
            r'linkedin\.com/in/',
            r'linkedin',
            r'linked-in'
        ]
        if any(re.search(pattern, text_lower) for pattern in linkedin_patterns):
            score += 20
        
        # Check for location/address
        location_indicators = ['address', 'city', 'state', 'zip', 'location', 'based in']
        if any(indicator in text_lower for indicator in location_indicators):
            score += 20
        elif re.search(r'\b[A-Z][a-z]+,\s*[A-Z]{2}\b', text):  # City, State format
            score += 15
        
        return min(score, 100)
    
    def calculate_readability_score(self, text: str) -> float:
        """
        Calculate readability score based on sentence structure
        
        Args:
            text: Resume text
            
        Returns:
            Readability score (0-100)
        """
        # Use spaCy for sentence analysis
        doc = nlp(text[:5000])  # Limit to first 5000 chars for performance
        
        sentences = list(doc.sents)
        if not sentences:
            return 0
        
        # Check average sentence length
        valid_sentences = [sent for sent in sentences if len(sent) > 3]
        if not valid_sentences:
            return 0
            
        avg_sentence_length = sum(len(sent) for sent in valid_sentences) / len(valid_sentences)
        
        # Ideal sentence length is between 8-20 words for resumes
        if 8 <= avg_sentence_length <= 20:
            length_score = 35
        elif avg_sentence_length < 8:
            length_score = 25
        else:
            length_score = 15
        
        # Check for varied sentence structure
        sentence_starts = [sent[0].pos_ for sent in valid_sentences if len(sent) > 0]
        if sentence_starts:
            start_variety = len(set(sentence_starts)) / len(sentence_starts)
            variety_score = min(35, start_variety * 35)
        else:
            variety_score = 0
        
        # Check for consistent tense (mostly past for experience)
        verbs = [token for token in doc if token.pos_ == 'VERB']
        if verbs:
            past_tense = sum(1 for verb in verbs if verb.tag_ in ['VBD', 'VBN'])
            tense_ratio = past_tense / len(verbs)
            tense_score = 30 if tense_ratio > 0.4 else 15
        else:
            tense_score = 0
        
        total_readability = length_score + variety_score + tense_score
        return min(total_readability, 100)
    
    def extract_text_from_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes."""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in pdf_reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from bytes: {e}")

    def calculate_ats_score_from_text(self, resume_text: str, gemini_boost: bool = False) -> Dict:
        """Calculate score from pre-extracted text."""
        try:
            if not resume_text.strip():
                return {'error': 'No text provided', 'total_score': 0}
            
            # Calculate individual scores
            sections_present = self.check_resume_sections(resume_text)
            section_score = (sum(sections_present.values()) / len(sections_present)) * 100
            
            formatting_score = self.calculate_formatting_score(resume_text)
            keyword_score = self.calculate_keyword_score(resume_text)
            contact_score = self.calculate_contact_info_score(resume_text)
            readability_score = self.calculate_readability_score(resume_text)
            
            # Weighted average for final score
            weights = {
                'sections': 0.20,
                'formatting': 0.15,
                'keywords': 0.35,
                'contact': 0.15,
                'readability': 0.15
            }
            
            base_score = (
                section_score * weights['sections'] +
                formatting_score * weights['formatting'] +
                keyword_score * weights['keywords'] +
                contact_score * weights['contact'] +
                readability_score * weights['readability']
            )

            final_score = base_score
            
            # Apply Gemini Optimization Boost if it's a tailored resume
            # User requested at least 90% for Gemini-made changes
            if gemini_boost:
                # If it's already decent (above 60), we give a strong boost to hit 90+
                if final_score > 60:
                    # Scale carefully: if 60 -> 90, if 80 -> 95, if 100 -> 100
                    final_score = 90 + (final_score - 60) * (10 / 40)
                else:
                    # Even for lower base scores, we boost them significantly if AI-tailored
                    final_score = max(final_score + 25, 85) # Floor at 85 if tailored
                
                # Final floor at 90.0 as per user request
                final_score = max(final_score, 91.5)

            # Ensure score does not exceed 100
            final_score = min(final_score, 100.0)
            
            return {
                'total_score': round(final_score, 2),
                'section_score': round(section_score, 2),
                'formatting_score': round(formatting_score, 2),
                'keyword_score': round(keyword_score, 2),
                'contact_info_score': round(contact_score, 2),
                'readability_score': round(readability_score, 2),
                'base_score': round(base_score, 2)
            }
        except Exception as e:
            return {'error': str(e), 'total_score': 0}

    def calculate_ats_score(self, file_path: str) -> Dict:
        """Calculate comprehensive ATS score from a file path."""
        try:
            resume_text = self.extract_text_from_pdf(file_path)
            results = self.calculate_ats_score_from_text(resume_text)
            results['file_name'] = os.path.basename(file_path)
            results['file_path'] = file_path
            return results
        except Exception as e:
            return {
                'file_name': os.path.basename(file_path),
                'file_path': file_path,
                'error': str(e),
                'total_score': 0
            }


def analyze_resume(file_path: str, job_description: str = None) -> Dict:
    """
    Analyze a resume from a local PDF file and return JSON
    
    Args:
        file_path: Path to the local PDF file
        job_description: Optional job description for comparison
        
    Returns:
        Dictionary with ATS scores
    """
    
    # Check if file exists
    if not os.path.exists(file_path):
        return {
            'file_name': os.path.basename(file_path),
            'file_path': file_path,
            'error': f"File not found: {file_path}",
            'total_score': 0,
            'section_score': 0,
            'formatting_score': 0,
            'keyword_score': 0,
            'contact_info_score': 0,
            'readability_score': 0
        }
    
    # Initialize calculator
    ats_calculator = ATSScoreCalculator(job_description)
    
    # Calculate score
    results = ats_calculator.calculate_ats_score(file_path)
    
    return results


def analyze_multiple_resumes(file_paths: List[str], job_description: str = None) -> List[Dict]:
    """
    Analyze multiple resume files and return JSON array
    
    Args:
        file_paths: List of paths to PDF files
        job_description: Optional job description for comparison
        
    Returns:
        List of dictionaries with ATS scores
    """
    results = []
    
    for file_path in file_paths:
        result = analyze_resume(file_path, job_description)
        results.append(result)
    
    return results


# Example usage
if __name__ == "__main__":
    import sys
    
    # Check if file path is provided as command line argument
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "Rahul_Havard_Resume.pdf"  # Default file
    
    # Optional job description (can be passed as second argument or from file)
    job_description = None
    if len(sys.argv) > 2:
        # If second argument is a file path, read job description from file
        if os.path.exists(sys.argv[2]):
            with open(sys.argv[2], 'r') as f:
                job_description = f.read()
        else:
            job_description = sys.argv[2]
    
    # Analyze single resume
    result = analyze_resume(file_path, job_description)
    
    # Output JSON
    print(json.dumps(result, indent=2))
    
    # Example for batch analysis (uncomment to use)
    # multiple_files = ["resume1.pdf", "resume2.pdf", "resume3.pdf"]
    # batch_results = analyze_multiple_resumes(multiple_files, job_description)
    # print(json.dumps(batch_results, indent=2))