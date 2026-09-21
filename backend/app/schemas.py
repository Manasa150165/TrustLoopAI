from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AnalysisRequest(BaseModel):
    language: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    requirements: str = ""

    @field_validator("language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Code cannot be empty")
        return cleaned


class Finding(BaseModel):
    category: Literal["logic", "security", "quality", "testing"]
    title: str
    description: str
    severity: Literal["low", "medium", "high"]
    evidence: str
    status: Literal["confirmed", "potential", "warning"]


class Correction(BaseModel):
    summary: str
    code: str


class AnalysisResponse(BaseModel):
    language: str
    status: Literal["success", "warning", "error"]
    summary: str
    findings: list[Finding]
    corrections: list[Correction]
    confidence: float
    execution_time_ms: int
    metadata: dict[str, Any]
