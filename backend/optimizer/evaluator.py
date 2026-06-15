import json
import os
import anthropic
from typing import Any

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def score_output(
    original_prompt: str,
    desired_outcome: str,
    actual_output: str,
    rubric: dict[str, Any],
) -> dict:
    """
    Evaluate an LLM output against a rubric using Claude.
    Returns a dict with score, sub-scores, feedback, and passed flag.
    """
    rubric_text = "\n".join(
        f"- {criterion}: weight {weight}" for criterion, weight in rubric.items()
    )

    system_prompt = """You are an expert prompt evaluator. Your job is to objectively score LLM outputs against a desired outcome and rubric.

You MUST respond with valid JSON only — no extra text, no markdown fences.

The JSON must have exactly these fields:
{
  "score": <integer 0-100 overall score>,
  "relevance": <integer 0-25>,
  "clarity": <integer 0-25>,
  "completeness": <integer 0-25>,
  "quality": <integer 0-25>,
  "feedback": "<string: specific, actionable feedback for improvement>",
  "passed": <boolean: true if score >= 75>
}

Be strict but fair. A score of 75 means the output adequately meets the desired outcome."""

    user_message = f"""Evaluate the following LLM output against the desired outcome and rubric.

ORIGINAL PROMPT:
{original_prompt}

DESIRED OUTCOME:
{desired_outcome}

RUBRIC CRITERIA (with weights):
{rubric_text}

ACTUAL OUTPUT FROM THE PROMPT:
{actual_output}

Score the output. The four sub-scores (relevance, clarity, completeness, quality) should add up to the overall score.
Provide specific feedback on what's missing or could be improved."""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result = json.loads(raw)

    # Ensure all required fields exist with defaults
    return {
        "score": int(result.get("score", 0)),
        "relevance": int(result.get("relevance", 0)),
        "clarity": int(result.get("clarity", 0)),
        "completeness": int(result.get("completeness", 0)),
        "quality": int(result.get("quality", 0)),
        "feedback": str(result.get("feedback", "")),
        "passed": bool(result.get("passed", False)),
    }


class Evaluator:
    def score_output(self, original_prompt, desired_outcome, actual_output, rubric):
        return score_output(original_prompt, desired_outcome, actual_output, rubric)
