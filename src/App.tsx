import { useCallback, useEffect, useMemo, useState } from 'react'
import { Timer } from './components/Timer'
import { TaskList } from './components/TaskList'
import { Settings } from './components/Settings'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  DEFAULT_DURATIONS,
  LONG_BREAK_INTERVAL,
  type Durations,
  type Mode,
  type Task,
} from './types'
import { DEFAULT_SOUND, playSound, type SoundSettings } from './sounds'

export default function App() {
  const [mode, setMode] = useLocalStorage<Mode>('pomoflow:mode', 'focus')
  const [focusCount, setFocusCount] = useLocalStorage('pomoflow:focusCount', 0)
  const [tasks, setTasks] = useLocalStorage<Task[]>('pomoflow:tasks', [])
  const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('pomoflow:activeTask', null)
  const [storedDurations, setDurations] = useLocalStorage<Durations>(
    'pomoflow:durations',
    DEFAULT_DURATIONS,
  )
  const [storedSound, setSound] = useLocalStorage<SoundSettings>('pomoflow:sound', DEFAULT_SOUND)
  const sound = useMemo(() => ({ ...DEFAULT_SOUND, ...storedSound }), [storedSound])
  const [showSettings, setShowSettings] = useState(false)
  const durations = { ...DEFAULT_DURATIONS, ...storedDurations }
  const closeSettings = useCallback(() => setShowSettings(false), [])

  const activeTask = tasks.find((t) => t.id === activeTaskId && !t.done) ?? null

  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  const handleComplete = useCallback(() => {
    playSound(sound)
    if (mode === 'focus') {
      const next = focusCount + 1
      setFocusCount(next)
      if (activeTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTaskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t,
          ),
        )
      }
      setMode(next % LONG_BREAK_INTERVAL === 0 ? 'longBreak' : 'shortBreak')
    } else {
      setMode('focus')
    }
  }, [mode, focusCount, activeTaskId, sound, setFocusCount, setTasks, setMode])

  const addTask = (title: string, estimatedPomodoros: number) => {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      estimatedPomodoros,
      completedPomodoros: 0,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [...prev, task])
    if (!activeTask) setActiveTaskId(task.id)
  }

  const toggleDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
    if (id === activeTaskId) setActiveTaskId(null)
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (id === activeTaskId) setActiveTaskId(null)
  }

  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done))

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Pomo<em>flow</em>
        </h1>
        <div className="header-right">
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Réglages"
            title="Réglages"
          >
            ⚙
          </button>
          <div className="stamp">
            <span>Session</span>
            <strong>#{focusCount + (mode === 'focus' ? 1 : 0)}</strong>
          </div>
        </div>
      </header>

      <main className="layout">
        <div className="left-col">
          <Timer
            key={`${mode}-${durations[mode]}`}
            mode={mode}
            minutes={durations[mode]}
            onModeChange={setMode} onComplete={handleComplete} />

          <div className="session-info">
            <span className="session-label">{mode === 'focus' ? 'En cours' : 'Pause'}</span>
            <span className="session-task">
              {mode === 'focus'
                ? (activeTask?.title ?? 'Choisis une tâche →')
                : 'Respire, tu l’as méritée.'}
            </span>
          </div>
        </div>

        <TaskList
          tasks={tasks}
          activeTaskId={activeTask?.id ?? null}
          onAdd={addTask}
          onToggleDone={toggleDone}
          onDelete={deleteTask}
          onSelect={setActiveTaskId}
          onClearDone={clearDone}
        />
      </main>

      {showSettings && (
        <Settings
          durations={durations}
          sound={sound}
          onSave={(d, snd) => {
            setDurations(d)
            setSound(snd)
            setShowSettings(false)
          }}
          onClose={closeSettings}
        />
      )}
    </div>
  )
}
