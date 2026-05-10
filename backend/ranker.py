from __future__ import annotations

import json
from dataclasses import dataclass
from typing import List

from mistralai.client import Mistral

from app.config import MISTRAL_API_KEY
from diff_engine import Delta

client = Mistral(api_key=MISTRAL_API_KEY)

SYSTEM_PROMPT = """
You are a senior DevOps engineer performing forensic root cause analysis.

You will receive a list of configuration differences between a staging environment and a production environment.
Each difference has a key, staging value, production value, category, and severity hint.

Your job is to rank which differences most likely caused a production incident and explain why.

Respond ONLY with valid JSON in this exact structure, no preamble, no markdown:
{
  "top_cause": "string — the single most likely root cause key",
  "ranked_causes": ["string", "string"],
  "summary": "string — plain English explanation in 2-3 sentences",
  "confidence": "high | medium | low",
  "suggested_fix": "string — actionable fix"
}"""


@dataclass
class ForensicReport:
    top_cause: str
    ranked_causes: List[str]
    summary: str
    confidence: str
    suggested_fix: str
    

_FALLBACK = ForensicReport(
    top_cause="unknown",
    ranked_causes=[],
    summary="AI ranking failed. Review the diffs manully.",
    confidence="low",
    suggested_fix="Compare staging and production configs manually.",
)


def rank_deltas(deltas: List[Delta]) -> ForensicReport:
    if not deltas:
        return ForensicReport(
            top_cause="none",
            ranked_causes=[],
            summary="No configuration differences detected.",
            confidence="high",
            suggested_fix="No action required.",
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
    
    try:
        response = client.chat.complete(
            model="mistral-small-latest",
            max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Analyse these configuration deltas and identify the root cause:\n\n{json.dumps(deltas_payload, indent=2)}",
                },
            ],
        )
        
        raw = response.choices[0].message.content.strip() # type: ignore
        data = json.loads(raw)

        return ForensicReport(
            top_cause=data["top_cause"],
            ranked_causes=data["ranked_causes"],
            summary=data["summary"],
            confidence=data["confidence"],
            suggested_fix=data["suggested_fix"],
        )
        
    except Exception:
        return _FALLBACK       