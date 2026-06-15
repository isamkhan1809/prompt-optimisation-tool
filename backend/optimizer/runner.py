import os
import anthropic
from typing import Any

from .evaluator import score_output
from .rewriter import rewrite_prompt

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def run_prompt(prompt: str) -> str:
    """Run a prompt through Claude and return the output."""
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


class OptimizationRunner:
    def run(
        self,
        original_prompt: str,
        desired_outcome: str,
        rubric: dict[str, Any],
        max_iterations: int = 5,
        target_score: int = 80,
    ) -> dict:
        """
        Run the full optimization loop.

        For each iteration:
          1. Run the current prompt through Claude
          2. Evaluate the output against the rubric
          3. If target score met or max iterations reached, stop
          4. Otherwise, rewrite the prompt using feedback and continue

        Returns a dict with all iteration data and the best result.
        """
        iterations = []
        current_prompt = original_prompt
        best_prompt = original_prompt
        best_score = 0
        converged = False
        feedback = "No previous evaluation — this is the first iteration."
        previous_score = 0

        for i in range(1, max_iterations + 1):
            # Step 1: If not the first iteration, rewrite the prompt
            changes_made = []
            if i > 1:
                rewrite_result = rewrite_prompt(
                    original_prompt=original_prompt,
                    desired_outcome=desired_outcome,
                    previous_score=previous_score,
                    feedback=feedback,
                    iteration=i,
                )
                current_prompt = rewrite_result["improved_prompt"]
                changes_made = rewrite_result["changes_made"]

            # Step 2: Run the prompt
            output = run_prompt(current_prompt)

            # Step 3: Evaluate the output
            scores = score_output(
                original_prompt=original_prompt,
                desired_outcome=desired_outcome,
                actual_output=output,
                rubric=rubric,
            )

            # Track best
            if scores["score"] > best_score:
                best_score = scores["score"]
                best_prompt = current_prompt

            # Record this iteration
            iterations.append(
                {
                    "iteration": i,
                    "prompt": current_prompt,
                    "output": output,
                    "scores": scores,
                    "changes_made": changes_made,
                }
            )

            # Step 4: Check convergence
            feedback = scores["feedback"]
            previous_score = scores["score"]

            if scores["score"] >= target_score:
                converged = True
                break

        return {
            "iterations": iterations,
            "best_prompt": best_prompt,
            "best_score": best_score,
            "converged": converged,
            "total_iterations": len(iterations),
        }
