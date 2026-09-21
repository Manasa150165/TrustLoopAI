from app.agent_engine import analyze_code
from app.llm_service import LLMService


class AgentOrchestrator:
    def __init__(self) -> None:
        self.llm = LLMService()

    def run_analysis(self, language: str, code: str, requirements: str):
        heuristic_result = analyze_code(language, code, requirements)
        llm_result = self.llm.get_agent_summary(language, code, requirements)
        heuristic_result["metadata"]["llm_provider"] = self.llm.provider
        heuristic_result["metadata"]["llm_summary"] = llm_result.get("summary", "")
        heuristic_result["metadata"]["agent_plan"] = llm_result.get("analysis", [])
        return heuristic_result
