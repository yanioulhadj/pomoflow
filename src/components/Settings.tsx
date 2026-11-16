import { useEffect, useState, type FormEvent } from 'react'
import {
  DEFAULT_DURATIONS,
  MAX_MINUTES,
  MIN_MINUTES,
  MODES,
  type Durations,
  type Mode,
} from '../types'

interface SettingsProps {
  durations: Durations
  onSave: (durations: Durations) => void
  onClose: () => void
}

const clamp = (n: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)))

export function Settings({ durations, onSave, onClose }: SettingsProps) {
  // Valeurs en texte pour permettre de vider le champ pendant la saisie
  const [draft, setDraft] = useState<Record<Mode, string>>(() => ({
    focus: String(durations.focus),
    shortBreak: String(durations.shortBreak),
    longBreak: String(durations.longBreak),
  }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const parse = (mode: Mode) => clamp(Number(draft[mode]) || durations[mode])

  const step = (mode: Mode, delta: number) =>
    setDraft((d) => ({ ...d, [mode]: String(clamp(parse(mode) + delta)) }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ focus: parse('focus'), shortBreak: parse('shortBreak'), longBreak: parse('longBreak') })
  }

  const resetDefaults = () =>
    setDraft({
      focus: String(DEFAULT_DURATIONS.focus),
      shortBreak: String(DEFAULT_DURATIONS.shortBreak),
      longBreak: String(DEFAULT_DURATIONS.longBreak),
    })

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="settings-title">Réglages</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-section">Durées (minutes)</p>
          {(Object.keys(MODES) as Mode[]).map((mode, i) => (
            <div key={mode} className="duration-row">
              <span className="duration-label">
                <span className="mode-index">0{i + 1}</span>
                {MODES[mode].label}
              </span>
              <span className="stepper">
                <button type="button" onClick={() => step(mode, -1)} aria-label="Moins une minute">
                  −
                </button>
                <input
                  type="number"
                  aria-label={`Durée ${MODES[mode].label} en minutes`}
                  inputMode="numeric"
                  min={MIN_MINUTES}
                  max={MAX_MINUTES}
                  value={draft[mode]}
                  onChange={(e) => setDraft((d) => ({ ...d, [mode]: e.target.value }))}
                  onBlur={() => setDraft((d) => ({ ...d, [mode]: String(parse(mode)) }))}
                />
                <button type="button" onClick={() => step(mode, 1)} aria-label="Plus une minute">
                  +
                </button>
              </span>
            </div>
          ))}
          <p className="modal-hint">Modifier la durée du mode en cours réinitialise le minuteur.</p>
        </div>

        <footer className="modal-footer">
          <button type="button" className="link" onClick={resetDefaults}>
            Valeurs par défaut
          </button>
          <button type="submit" className="primary">
            Enregistrer
          </button>
        </footer>
      </form>
    </div>
  )
}
