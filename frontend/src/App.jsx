import { useState, useCallback } from 'react'
import axios from 'axios'

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreBadgeClass(score) {
  if (score >= 75) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, passed, totalIterations, converged }) {
  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="score-ring-container">
      <div className="score-ring">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#2e2860" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="score-ring-text">
          {score}<span>/100</span>
        </div>
      </div>
      <div className="score-meta">
        <div className="score-meta-title">Best Score</div>
        <div className="score-meta-sub">{totalIterations} iteration{totalIterations !== 1 ? 's' : ''} run</div>
        <div className={`score-meta-passed ${passed ? 'yes' : 'no'}`}>
          {passed ? '✓ Passed' : '✗ Not passed'}
        </div>
        {converged && (
          <div className="score-meta-sub" style={{ color: '#22c55e', fontSize: '11px' }}>
            ⚡ Converged early
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBars({ scores }) {
  const bars = [
    { key: 'relevance',    label: 'Relevance',    max: 25 },
    { key: 'clarity',      label: 'Clarity',      max: 25 },
    { key: 'completeness', label: 'Completeness', max: 25 },
    { key: 'quality',      label: 'Quality',      max: 25 },
  ]
  return (
    <div className="score-bars">
      {bars.map(({ key, label, max }) => (
        <div className="bar-row" key={key}>
          <div className="bar-label-row">
            <span>{label}</span>
            <span>{scores[key] ?? 0}/{max}</span>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill ${key}`}
              style={{ width: `${((scores[key] ?? 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="bar-row">
        <div className="bar-label-row">
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>Overall</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{scores.score ?? 0}/100</span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill overall"
            style={{ width: `${scores.score ?? 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ImprovementChart({ iterations }) {
  if (!iterations || iterations.length < 1) return null
  const scores = iterations.map(it => it.scores?.score ?? 0)
  const W = 280, H = 100, PAD = 16
  const xs = scores.map((_, i) => PAD + (i / Math.max(scores.length - 1, 1)) * (W - PAD * 2))
  const ys = scores.map(s => H - PAD - ((s / 100) * (H - PAD * 2)))

  const pathD = scores.length === 1
    ? `M ${xs[0]} ${ys[0]}`
    : xs.map((x, i) => (i === 0 ? `M ${x} ${ys[i]}` : `L ${x} ${ys[i]}`)).join(' ')

  const areaD = scores.length === 1
    ? ''
    : `${pathD} L ${xs[xs.length - 1]} ${H - PAD} L ${xs[0]} ${H - PAD} Z`

  return (
    <div className="chart-container">
      <div className="section-label" style={{ marginBottom: 10 }}>Score Timeline</div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} height="100">
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = H - PAD - ((v / 100) * (H - PAD * 2))
          return (
            <g key={v}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#2e2860" strokeWidth="1" strokeDasharray="3,3" />
              <text x={PAD - 2} y={y + 4} fontSize="8" fill="#8b82b8" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {/* Area */}
        {areaD && <path d={areaD} fill="url(#area-grad)" />}
        {/* Line */}
        <path d={pathD} fill="none" stroke="#7c5cfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r="4" fill="#0d0b1a" stroke="#a78bfa" strokeWidth="2" />
            <text x={x} y={ys[i] - 7} fontSize="8" fill="#c4b5fd" textAnchor="middle">{scores[i]}</text>
          </g>
        ))}
        {/* X labels */}
        {xs.map((x, i) => (
          <text key={i} x={x} y={H - 2} fontSize="8" fill="#8b82b8" textAnchor="middle">
            #{i + 1}
          </text>
        ))}
      </svg>
    </div>
  )
}

function IterationCard({ iter, isBest }) {
  const [expanded, setExpanded] = useState(false)
  const scoreClass = scoreBadgeClass(iter.scores?.score ?? 0)

  return (
    <div className={`iteration-card ${isBest ? 'best' : ''}`} onClick={() => setExpanded(e => !e)}>
      <div className="iter-header">
        <span className="iter-num">Iteration {iter.iteration}</span>
        {isBest && <span className="best-tag">BEST</span>}
        <span className={`score-badge ${scoreClass}`}>{iter.scores?.score ?? 0}/100</span>
      </div>
      <div className="iter-body">
        {iter.changes_made && iter.changes_made.length > 0 && (
          <div>
            <div className="iter-section-label">Changes Made</div>
            <div className="changes-list">
              {iter.changes_made.map((c, i) => (
                <div className="change-item" key={i}>{c}</div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="iter-section-label">Prompt</div>
          <div className={`iter-prompt ${expanded ? 'expanded' : ''}`}
               style={expanded ? { maxHeight: 'none' } : {}}>
            {iter.prompt}
          </div>
        </div>
        <div>
          <div className="iter-section-label">Output Preview</div>
          <div className={`iter-output`}
               style={expanded ? { maxHeight: 'none' } : {}}>
            {iter.output}
          </div>
        </div>
        {expanded && iter.scores?.feedback && (
          <div>
            <div className="iter-section-label">Evaluator Feedback</div>
            <div className="feedback-box">{iter.scores.feedback}</div>
          </div>
        )}
        {expanded && (
          <ScoreBars scores={iter.scores} />
        )}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </div>
      </div>
    </div>
  )
}

function RubricBuilder({ rubric, onChange }) {
  const handleCriterionChange = (idx, field, value) => {
    const updated = rubric.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'weight' ? Number(value) : value } : item
    )
    onChange(updated)
  }

  const addCriterion = () => {
    onChange([...rubric, { criterion: '', weight: 1 }])
  }

  const removeCriterion = (idx) => {
    onChange(rubric.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="rubric-list">
        {rubric.map((item, idx) => (
          <div className="rubric-item" key={idx}>
            <input
              type="text"
              placeholder="Criterion name"
              value={item.criterion}
              onChange={e => handleCriterionChange(idx, 'criterion', e.target.value)}
            />
            <input
              type="number"
              min="1"
              max="10"
              value={item.weight}
              onChange={e => handleCriterionChange(idx, 'weight', e.target.value)}
              title="Weight (1-10)"
            />
            <button className="btn-icon" onClick={() => removeCriterion(idx)} title="Remove">×</button>
          </div>
        ))}
      </div>
      <button className="btn-add" onClick={addCriterion}>+ Add Criterion</button>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [rubric, setRubric] = useState([
    { criterion: 'Relevance', weight: 1 },
    { criterion: 'Clarity', weight: 1 },
    { criterion: 'Completeness', weight: 1 },
    { criterion: 'Quality', weight: 1 },
  ])
  const [maxIterations, setMaxIterations] = useState(5)
  const [targetScore, setTargetScore] = useState(80)

  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const rubricAsObject = useCallback(() => {
    const obj = {}
    rubric.forEach(({ criterion, weight }) => {
      if (criterion.trim()) obj[criterion.trim()] = weight
    })
    return obj
  }, [rubric])

  const handleOptimise = async () => {
    if (!prompt.trim() || !desiredOutcome.trim()) {
      setError('Please fill in both the prompt and desired outcome.')
      return
    }
    setError(null)
    setResult(null)
    setRunning(true)

    try {
      const { data } = await axios.post('/optimise', {
        prompt: prompt.trim(),
        desired_outcome: desiredOutcome.trim(),
        rubric: rubricAsObject(),
        max_iterations: maxIterations,
        target_score: targetScore,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong.')
    } finally {
      setRunning(false)
    }
  }

  const handleCopy = () => {
    if (!result?.best_prompt) return
    navigator.clipboard.writeText(result.best_prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const bestIteration = result?.iterations?.reduce(
    (best, it) => (it.scores?.score > (best?.scores?.score ?? -1) ? it : best),
    null
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header-logo">✨</span>
        <h1>Prompt Optimisation Tool</h1>
        <span className="header-sub">Claude API · Iterative Rewriting · Rubric Scoring</span>
      </header>

      <main className="main">
        {/* ── Left: Input panel ─────────────────────────────────────────── */}
        <section className="panel">
          <div className="panel-header">⚙ Input</div>
          <div className="panel-body">
            <div className="field">
              <label>Original Prompt</label>
              <textarea
                rows={5}
                placeholder="Enter the prompt you want to optimise…"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={running}
              />
            </div>

            <div className="field">
              <label>Desired Outcome</label>
              <textarea
                rows={4}
                placeholder="Describe what a great response looks like…"
                value={desiredOutcome}
                onChange={e => setDesiredOutcome(e.target.value)}
                disabled={running}
              />
            </div>

            <div className="field">
              <label>Rubric Criteria</label>
              <RubricBuilder rubric={rubric} onChange={setRubric} />
            </div>

            <div className="field">
              <label>Max Iterations</label>
              <div className="slider-row">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxIterations}
                  onChange={e => setMaxIterations(Number(e.target.value))}
                  disabled={running}
                />
                <span className="slider-val">{maxIterations}</span>
              </div>
            </div>

            <div className="field">
              <label>Target Score</label>
              <div className="slider-row">
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={targetScore}
                  onChange={e => setTargetScore(Number(e.target.value))}
                  disabled={running}
                />
                <span className="slider-val">{targetScore}</span>
              </div>
            </div>

            {running && (
              <div className="running-banner">
                <span className="spinner" />
                <span>Optimising your prompt… this may take a moment.</span>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn-optimise"
              onClick={handleOptimise}
              disabled={running}
            >
              {running
                ? <><span className="spinner" /> Running…</>
                : '✨ Optimise Prompt'
              }
            </button>
          </div>
        </section>

        {/* ── Middle: Iteration timeline ─────────────────────────────────── */}
        <section className="panel">
          <div className="panel-header">🔄 Iteration Timeline</div>
          <div className="panel-body">
            {!result && !running && (
              <div className="empty-state">
                <div className="empty-icon">🔄</div>
                <div>Iterations will appear here as the optimiser runs.</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Each card shows the rewritten prompt, Claude's output, and scores.
                </div>
              </div>
            )}
            {running && (
              <div className="empty-state">
                <div className="empty-icon" style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚙</div>
                <div>Optimisation in progress…</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Claude is rewriting and evaluating your prompt.
                </div>
              </div>
            )}
            {result?.iterations?.map((iter, idx) => (
              <IterationCard
                key={iter.iteration}
                iter={iter}
                isBest={iter.iteration === bestIteration?.iteration}
              />
            ))}
          </div>
        </section>

        {/* ── Right: Best result panel ───────────────────────────────────── */}
        <section className="panel">
          <div className="panel-header">🏆 Best Result</div>
          <div className="panel-body">
            {!result && !running && (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <div>The best optimised prompt will appear here.</div>
              </div>
            )}

            {result && (
              <>
                {result.converged && (
                  <div className="converged-badge">
                    ⚡ Target score reached — converged in {result.total_iterations} iteration{result.total_iterations !== 1 ? 's' : ''}!
                  </div>
                )}

                <ScoreRing
                  score={result.best_score}
                  passed={result.best_score >= targetScore}
                  totalIterations={result.total_iterations}
                  converged={result.converged}
                />

                <div className="field">
                  <div className="section-label">Optimised Prompt</div>
                  <div className="best-prompt-box">{result.best_prompt}</div>
                  <button
                    className={`btn-copy ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? '✓ Copied!' : '⎘ Copy to Clipboard'}
                  </button>
                </div>

                {bestIteration?.scores && (
                  <>
                    <div className="section-label">Score Breakdown</div>
                    <ScoreBars scores={bestIteration.scores} />
                  </>
                )}

                {bestIteration?.scores?.feedback && (
                  <div className="field">
                    <div className="section-label">Final Evaluator Feedback</div>
                    <div className="feedback-box">{bestIteration.scores.feedback}</div>
                  </div>
                )}

                <ImprovementChart iterations={result.iterations} />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
