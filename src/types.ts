export type Mode = 'focus' | 'shortBreak' | 'longBreak'

export interface Task {
  id: string
  title: string
  estimatedPomodoros: number
  completedPomodoros: number
  done: boolean
  createdAt: number
}

/** Durée de chaque mode, en minutes. */
export type Durations = Record<Mode, number>

export const MODES: Record<Mode, { label: string; message: string }> = {
  focus: { label: 'Focus', message: 'Au travail !' },
  shortBreak: { label: 'Pause courte', message: 'Petite pause ☕' },
  longBreak: { label: 'Pause longue', message: 'Grande pause 🌿' },
}

export const DEFAULT_DURATIONS: Durations = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
}

export const MIN_MINUTES = 1
export const MAX_MINUTES = 120

/** Nombre de sessions de focus avant une pause longue. */
export const LONG_BREAK_INTERVAL = 4
