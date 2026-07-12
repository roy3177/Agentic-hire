from typing import List
from pydantic import BaseModel, Field


class CandidateEvaluation(BaseModel):
    candidate_name: str = Field(..., description="The full name of the candidate found in the resume.")
    score: int = Field(..., description="A score between 0-100 indicating fit for the job.")

    # Lists allow us to display bullet points in the Frontend
    key_strengths: List[str] = Field(..., description="List of 3-5 major strengths relevant to the job.")
    concerns: List[str] = Field(..., description="List of potential concerns or missing skills.")

    # Verbal summary
    reasoning: str = Field(..., description="A concise summary explaining the score and recommendation.")

    # Clear final recommendation
    final_recommendation: str = Field(..., description="One of: 'Strong Hire', 'Hire', 'Caution', 'Reject'.")


class TriageVerdict(BaseModel):
    candidate_name: str = Field(..., description="The candidate's full name, extracted from the resume.")
    is_relevant: bool = Field(..., description="True unless the candidate's background is clearly unrelated to the job's general field.")
    reason: str = Field(..., description="One sentence explaining the verdict.")