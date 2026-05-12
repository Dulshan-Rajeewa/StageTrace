from __future__ import annotations

import json
from pydantic import BaseModel, Field
from typing import List, Literal

from google import genai
from google.genai import types  

from app.config import GEMINI_API_KEY
from diff_engine import Delta

client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
You are a senior DevOps engineer performing forensic root cause analysis on a production incident.
Given configuration differences between staging and production, identify which delta most likely caused the observed failure. 
Use your engineering judgment to consider runtime behaviour, code paths, and system dependencies.
If an incident description is provided, consider it while making the analysis.
"""


class ForensicReport(BaseModel):
    top_cause: str = Field(description="The single most likely root cause key identifying the delta.")
    ranked_causes: List[str] = Field(description="A list of all identified deltas ranked by suspicion level.")
    summary: str = Field(description="A plain English explanation of the findings in a few sentences.")
    confidence: Literal["high", "medium", "low"] = Field(description="The assessed certainty of the root cause identification.")
    suggested_fix: str = Field(description="An actionable engineering recommendation to resolve the incident.")
    

def _FALLBACK(e):
    return ForensicReport(
        top_cause="unknown",
        ranked_causes=[],
        summary=f"Analysis failed: {str(e)}",
        confidence="low",
        suggested_fix="Compare staging and production configs manually.",
    )


def rank_deltas(deltas: List[Delta], incident_description: str | None = None) -> ForensicReport:
    if not deltas:
        return ForensicReport(
            top_cause="none",
            ranked_causes=[],
            summary="No configuration differences detected.",
            confidence="high",
            suggested_fix="N/A",
        )
        
    deltas_payload = [
        {
            "key": d.key,
            "staging_value": d.staging_value,
            "production_value": d.production_value,
            "category": d.category,
            "severity_hint": d.severity_hint,
        } for d in deltas
    ]
    
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=ForensicReport,
    )
    
    try:
        context = f"Incident description: {incident_description}\n\n" if incident_description else ""
        user_prompt = f"{context}Analyse these configuration deltas:\n\n{json.dumps(deltas_payload, indent=2)}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=config
        )
        
        return ForensicReport.model_validate_json(response.text) # type: ignore
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        return _FALLBACK(e)