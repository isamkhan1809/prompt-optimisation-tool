import json
import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def rewrite_prompt(
    original_prompt: str,
    desired_outcome: str,
    previous_score: int,
    feedback: str,
    iteration: int,
) -> dict:
    """
    Rewrite a prompt to improve its score against a desired outcome.
    Uses feedback from the previous evaluation to guide improvements.
    Returns a dict with improved_prompt, changes_made, and reasoning.
    """
    system_prompt = """You are an expert prompt engineer. Your job is to iteratively improve prompts so they produce outputs that better match a desired outcome.

You MUST respond with valid JSON only — no extra text, no markdown fences.

The JSON must have exactly these fields:
{
  "improved_prompt": "<the full rewritten prompt>",
  "changes_made": ["<change 1>", "<change 2>", ...],
  "reasoning": "<explanation of why these changes will improve the score>"
}

Guidelines for rewriting:
- Be specific and clear about the desired output format, length, and style
- Add context or constraints that steer toward the desired outcome
- Address all feedback points explicitly
- Don't make the prompt overly long or complex — precision is key
- Ensure the improved prompt is self-contained and complete"""

    user_message = f"""Improve this prompt to better achieve the desired outcome.

ITERATION: {iteration}
CURRENT SCORE: {previous_score}/100

ORIGINAL PROMPT:
{original_prompt}

DESIRED OUTCOME:
{desired_outcome}

FEEDBACK FROM PREVIOUS EVALUATION:
{feedback}

Rewrite the prompt to address the feedback and increase the score. Focus on the most impactful changes.
Return the full improved prompt, a list of specific changes you made, and your reasoning."""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    result = json.loads(raw)

    return {
        "improved_prompt": str(result.get("improved_prompt", original_prompt)),
        "changes_made": list(result.get("changes_made", [])),
        "reasoning": str(result.get("reasoning", "")),
    }


class Rewriter:
    def rewrite_prompt(
        self, original_prompt, desired_outcome, previous_score, feedback, iteration
    ):
        return rewrite_prompt(
            original_prompt, desired_outcome, previous_score, feedback, iteration
        )
