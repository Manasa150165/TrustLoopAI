import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.provider = "openai" if os.getenv("OPENAI_API_KEY") else "gemini" if os.getenv("GEMINI_API_KEY") else "mock"

    def _with_fallback(self, message: str, agent: str = "system") -> dict[str, Any]:
        return {
            "summary": message,
            "analysis": [{"agent": agent, "finding": message}],
        }

    def _call_openai(self, prompt: str) -> str:
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a senior software reviewer."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    def _call_gemini(self, prompt: str) -> str:
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2},
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    def get_agent_summary(self, language: str, code: str, requirements: str) -> dict[str, Any]:
        if self.provider == "mock":
            return {
                "summary": "LLM mock mode is active. Add an API key to enable live LLM review.",
                "analysis": [
                    {"agent": "logic-agent", "finding": "Potential divide-by-zero risk detected in runtime arithmetic operations."},
                    {"agent": "security-agent", "finding": "Check user-controlled input before executing external operations."},
                ],
            }

        prompt = (
            f"You are a senior software reviewer. Review the following {language} code and requirements. "
            f"Return a compact JSON object with keys: summary and analysis. "
            f"The analysis should be a list of objects with keys agent and finding.\n\n"
            f"Requirements: {requirements}\n\nCode:\n{code}"
        )

        try:
            raw = self._call_openai(prompt) if self.provider == "openai" else self._call_gemini(prompt)
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict) and isinstance(parsed.get("analysis"), list):
                    return parsed
            except json.JSONDecodeError:
                pass

            return {
                "summary": raw.strip()[:4000],
                "analysis": [{"agent": self.provider, "finding": raw.strip()[:4000]}],
            }
        except Exception as exc:
            return self._with_fallback(f"Live {self.provider} call failed. Falling back to local review: {exc}", self.provider)
