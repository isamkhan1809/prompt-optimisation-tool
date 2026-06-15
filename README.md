<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c5cfc&height=200&section=header&text=Prompt%20Optimisation%20Tool&fontSize=40&fontColor=ffffff&desc=Iterative%20Prompt%20Rewriting%20%7C%20Claude%20API%20%7C%20Score%20Rubric&descAlignY=65&descSize=16&animation=fadeIn" width="100%"/>

<br/>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&duration=2800&pause=800&color=A78BFA&center=true&vCenter=true&width=600&lines=Prompt+Optimisation+Tool;Claude+API+%7C+Iterative+Rewriting;Score+Against+Rubric+%7C+Track+Improvements;FastAPI+Backend+%7C+React+Frontend" alt="Typing SVG" />
</a>

<br/><br/>

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-7c5cfc?style=for-the-badge&logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)

</div>

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│  Your Prompt│────▶│ Run Through  │────▶│ Evaluate Output │────▶│   Score    │
│  + Outcome  │     │    Claude    │     │ Against Rubric  │     │  (0-100)   │
└─────────────┘     └──────────────┘     └─────────────────┘     └─────┬──────┘
                                                                        │
                    ┌──────────────┐     ┌─────────────────┐           │
                    │  Best Prompt │◀────│  Rewrite Prompt │◀──────────┘
                    │   Returned   │     │  Using Feedback │   (if score < target)
                    └──────────────┘     └─────────────────┘
```

The tool runs up to N iterations, each time:
1. **Running** the current prompt through `claude-3-5-sonnet-20241022`
2. **Evaluating** the output against your rubric (relevance, clarity, completeness, quality)
3. **Rewriting** the prompt using Claude, guided by the evaluation feedback
4. **Stopping** early if the target score is reached

---

## Features

- **Iterative optimisation** — automatically rewrites your prompt up to N times
- **Rubric-based scoring** — define custom criteria with weights; scored 0–100
- **Claude-powered rewriting** — the rewriter sees previous scores and feedback
- **Three-column UI** — input panel, iteration timeline, best result panel
- **Score timeline chart** — visualise improvement across iterations
- **Copy-to-clipboard** — grab your best prompt in one click
- **Dark purple theme** — easy on the eyes

---

## Project Structure

```
prompt-optimisation-tool/
├── backend/
│   ├── main.py                # FastAPI app (routes: /optimise, /evaluate, /run-prompt, /health)
│   ├── optimizer/
│   │   ├── __init__.py
│   │   ├── evaluator.py       # Claude-based output scoring
│   │   ├── rewriter.py        # Claude-based prompt rewriting
│   │   └── runner.py          # Orchestrates the optimisation loop
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── App.css
└── README.md
```

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

1. **Enter your prompt** in the left panel
2. **Describe your desired outcome** — what should a great response look like?
3. **Configure your rubric** — add or remove criteria and set weights
4. **Set max iterations** (1–10) and **target score** (50–100)
5. Click **✨ Optimise Prompt**
6. Watch the iteration timeline fill in real-time
7. **Copy the best prompt** from the right panel

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/optimise` | Run full optimisation loop |
| `POST` | `/evaluate` | Score a single output |
| `POST` | `/run-prompt` | Run a prompt through Claude |

#### Example `/optimise` request

```json
{
  "prompt": "Explain machine learning",
  "desired_outcome": "A clear, concise explanation suitable for a 10-year-old with an analogy",
  "rubric": {
    "Clarity": 2,
    "Analogy Quality": 2,
    "Age Appropriateness": 1,
    "Accuracy": 1
  },
  "max_iterations": 5,
  "target_score": 85
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) |

---

## License

MIT © 2024

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=7c5cfc&height=120&section=footer&animation=fadeIn" width="100%"/>

</div>
