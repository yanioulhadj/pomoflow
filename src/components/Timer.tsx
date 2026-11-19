import { useCallback, useEffect } from 'react'
import { MODES, type Mode } from '../types'
import { useTimer } from '../hooks/useTimer'
import { stopSound, unlockAudio } from '../sounds'

interface TimerProps {
  mode: Mode
  minutes: number
  onModeChange: (mode: Mode) => void
  onComplete: () => void
}

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Timer({ mode, minutes, onModeChange, onComplete }: TimerProps) {
  const total = minutes * 60
  const { remaining, isRunning, toggle: toggleTimer, reset } = useTimer(
    total,
    onComplete,
    `${mode}-${minutes}`,
  )
  const toggle = useCallback(() => {
    unlockAudio()
    stopSound()
    toggleTimer()
  }, [toggleTimer])
  const progress = 1 - remaining / total
  const [mm, ss] = formatTime(remaining).split(':')

  useEffect(() => {
    document.title = `${formatTime(remaining)} · ${MODES[mode].message}`
  }, [remaining, mode])

  // Barre d'espace = démarrer / pause (sauf si on tape dans un champ)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return (
    <section className={`timer-card ${isRunning ? 'is-running' : ''}`}>
      <nav className="mode-tabs" role="tablist">
        {(Object.keys(MODES) as Mode[]).map((m, i) => (
          <button
            key={m}
            role="tab"
            aria-selected={m === mode}
            className={`mode-tab ${m === mode ? 'active' : ''}`}
            onClick={() => onModeChange(m)}
          >
            <span className="mode-index">0{i + 1}</span>
            {MODES[m].label}
          </button>
        ))}
      </nav>

      <div className="dial">
        <svg className="ring" viewBox="0 0 280 280" aria-hidden>
          <circle className="ring-track" cx="140" cy="140" r={RADIUS} />
          <circle
            className="ring-fill"
            cx="140"
            cy="140"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * progress}
          />
        </svg>
        <div className="time" aria-live="polite">
          <span>{mm}</span>
          <span className="colon">:</span>
          <span>{ss}</span>
        </div>
        <div className="dial-label">{MODES[mode].message}</div>
      </div>

      <div className="controls">
        <button className="start-btn" onClick={toggle}>
          {isRunning ? '■ Pause' : '▶ Start'}
        </button>
        <button
          className="reset-btn"
          onClick={reset}
          title="Réinitialiser"
          disabled={!isRunning && remaining === total}
        >
          ↺
        </button>
      </div>
    </section>
  )
}
