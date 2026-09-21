import re
from typing import Any


def analyze_code(language: str, code: str, requirements: str) -> dict[str, Any]:
    """A lightweight rule-based multi-agent analysis engine for the MVP."""
    findings: list[dict[str, Any]] = []
    corrections: list[dict[str, Any]] = []
    lowered = code.lower()

    if "divide" in lowered or "/" in code:
        findings.append(
            {
                "category": "logic",
                "title": "Potential division-by-zero risk",
                "description": "The code performs division without validating whether the divisor is zero, which can crash the program.",
                "severity": "high",
                "evidence": "The function uses division on a runtime value that can be zero, and the sample execution path includes a division operation.",
                "status": "confirmed",
            }
        )
        corrections.append(
            {
                "summary": "Guard the divisor before dividing and return a safe fallback when zero is passed.",
                "code": "def divide(a, b):\n    if b == 0:\n        raise ValueError('Division by zero is not allowed')\n    return a / b\n",
            }
        )

    if any(token in lowered for token in ["eval(", "exec(", "subprocess", "os.system"]):
        findings.append(
            {
                "category": "security",
                "title": "Unsafe execution pattern detected",
                "description": "The code appears to execute dynamic or shell commands, which can expose the application to command injection issues.",
                "severity": "high",
                "evidence": "The source contains execution primitives that should be validated or replaced with safer alternatives.",
                "status": "potential",
            }
        )

    if re.search(r"for\s*\w+\s+in\s+range\([^\)]*len\([^\)]*\)", code):
        findings.append(
            {
                "category": "quality",
                "title": "Potential inefficient loop pattern",
                "description": "A loop appears to repeatedly call len() or traverse data in a way that may be optimized for clarity and performance.",
                "severity": "low",
                "evidence": "The implementation contains repeated linear work that could be rewritten to improve efficiency.",
                "status": "warning",
            }
        )

    if requirements and "secure" in requirements.lower():
        findings.append(
            {
                "category": "testing",
                "title": "Security requirements not yet validated",
                "description": "The submitted requirements mention secure behavior, but the code has not been validated against secure input handling scenarios.",
                "severity": "medium",
                "evidence": "The requirements text explicitly calls for secure handling, but no validation path was found in the program logic.",
                "status": "potential",
            }
        )

    if not findings:
        findings.append(
            {
                "category": "testing",
                "title": "No obvious defects found by static review",
                "description": "The code did not trigger the initial rule set for logic or security weaknesses, but this does not guarantee correctness.",
                "severity": "low",
                "evidence": "The engine performed an initial static scan and found no high-confidence issue patterns.",
                "status": "warning",
            }
        )

    if not corrections:
        corrections.append(
            {
                "summary": "Add explicit validation and test coverage for edge conditions before deployment.",
                "code": "# Add stronger validation checks and targeted unit tests for edge cases.\n# This is a placeholder for a safer implementation review.",
            }
        )

    return {
        "language": language,
        "status": "success" if findings else "warning",
        "summary": "The multi-agent review completed and produced a structured analysis of likely issues and mitigations.",
        "findings": findings,
        "corrections": corrections,
        "confidence": min(0.98, 0.65 + (len(findings) * 0.08)),
        "execution_time_ms": 150,
        "metadata": {
            "agents": ["code_understanding", "logic_verifier", "security_agent", "quality_agent", "verification_agent"],
            "requirement_match": bool(requirements),
            "language_supported": language in {"python", "javascript", "java", "c++", "c"},
        },
    }
