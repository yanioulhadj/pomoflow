import { useEffect, useState, type FormEvent } from 'react'
import {
  DEFAULT_DURATIONS,
  MAX_MINUTES,
  MIN_MINUTES,
  MODES,
  type Durations,
  type Mode,
} from '../types'
import { DEFAULT_SOUND, SOUNDS, playSound, stopSound, type SoundSettings } from '../sounds'

interface SettingsProps {
  durations: Durations
  sound: SoundSettings
  onSave: (durations: Durations, sound: SoundSettings) => void
  onClose: () => void
}

const clamp = (n: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)))

export function Settings({ durations, sound, onSave, onClose }: SettingsProps) {
  // Valeurs en texte pour permettre de vider le champ pendant la saisie
  const [draft, setDraft] = useState<Record<Mode, string>>(() => ({
    focus: String(durations.focus),
    shortBreak: String(durations.shortBreak),
    longBreak: String(durations.longBreak),
  }))
  const [soundDraft, setSoundDraft] = useState<SoundSettings>(sound)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Coupe l'aperçu en cours à la fermeture du panneau
  useEffect(() => stopSound, [])

  const parse = (mode: Mode) => clamp(Number(draft[mode]) || durations[mode])

  const step = (mode: Mode, delta: number) =>
    setDraft((d) => ({ ...d, [mode]: String(clamp(parse(mode) + delta)) }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave(
      { focus: parse('focus'), shortBreak: parse('shortBreak'), longBreak: parse('longBreak') },
      soundDraft,
    )
  }

  const resetDefaults = () => {
    setDraft({
      focus: String(DEFAULT_DURATIONS.focus),
      shortBreak: String(DEFAULT_DURATIONS.shortBreak),
      longBreak: String(DEFAULT_DURATIONS.longBreak),
    })
    setSoundDraft(DEFAULT_SOUND)
  }

  const selectSound = (id: SoundSettings['id']) => {
    const next = { ...soundDraft, id }
    setSoundDraft(next)
    playSound(next)
  }

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

          <p className="modal-section section-gap">Son de fin</p>
          <div className="sound-grid" role="radiogroup" aria-label="Son de fin">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={soundDraft.id === s.id}
                className={`sound-option ${soundDraft.id === s.id ? 'selected' : ''}`}
                onClick={() => selectSound(s.id)}
                title={s.description}
              >
                <span className="sound-name">{s.label}</span>
                <span className="sound-desc">{s.description}</span>
              </button>
            ))}
          </div>

          <div className={`volume-row ${soundDraft.id === 'none' ? 'disabled' : ''}`}>
            <span className="duration-label">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(soundDraft.volume * 100)}
              disabled={soundDraft.id === 'none'}
              aria-label="Volume du son"
              onChange={(e) => setSoundDraft((d) => ({ ...d, volume: Number(e.target.value) / 100 }))}
              onPointerUp={() => playSound(soundDraft)}
            />
            <span className="volume-value">{Math.round(soundDraft.volume * 100)}%</span>
            <button
              type="button"
              className="play-btn"
              onClick={() => playSound(soundDraft)}
              disabled={soundDraft.id === 'none'}
              aria-label="Écouter le son"
              title="Écouter"
            >
              ▶
            </button>
          </div>
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
