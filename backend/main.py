import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any

from optimizer.runner import OptimizationRunner, run_prompt
from optimizer.evaluator import score_output

app = FastAPI(
    title="Prompt Optimisation Tool",
    description="Iteratively rewrite and benchmark prompts using Claude API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

runner = OptimizationRunner()


# ── Request models ──────────────────────────────────────────────────────────

class OptimiseRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The original prompt to optimise")
    desired_outcome: str = Field(..., min_length=1, description="What a good response looks like")
    rubric: dict[str, Any] = Field(
        default={"Relevance": 1, "Clarity": 1, "Completeness": 1, "Quality": 1},
        description="Criteria name → weight",
    )
    max_iterations: int = Field(default=5, ge=1, le=10)
    target_score: int = Field(default=80, ge=1, le=100)


class EvaluateRequest(BaseModel):
    prompt: str
    desired_outcome: str
    output: str
    rubric: dict[str, Any] = Field(
        default={"Relevance": 1, "Clarity": 1, "Completeness": 1, "Quality": 1}
    )


class RunPromptRequest(BaseModel):
    prompt: str


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "prompt-optimisation-tool"}


@app.post("/run-prompt")
def run_prompt_endpoint(body: RunPromptRequest):
    try:
        output = run_prompt(body.prompt)
        return {"output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate")
def evaluate_endpoint(body: EvaluateRequest):
    try:
        result = score_output(
            original_prompt=body.prompt,
            desired_outcome=body.desired_outcome,
            actual_output=body.output,
            rubric=body.rubric,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimise")
def optimise_endpoint(body: OptimiseRequest):
    try:
        result = runner.run(
            original_prompt=body.prompt,
            desired_outcome=body.desired_outcome,
            rubric=body.rubric,
            max_iterations=body.max_iterations,
            target_score=body.target_score,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
