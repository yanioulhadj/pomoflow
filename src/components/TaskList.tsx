import { useState, type FormEvent } from 'react'
import type { Task } from '../types'

interface TaskListProps {
  tasks: Task[]
  activeTaskId: string | null
  onAdd: (title: string, estimatedPomodoros: number) => void
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  onClearDone: () => void
}

function PomodoroDots({ done, total }: { done: number; total: number }) {
  const count = Math.max(done, total)
  if (count > 8) {
    return (
      <span className="dots-text">
        {done}/{total}
      </span>
    )
  }
  return (
    <span className="dots" aria-label={`${done} pomodoros sur ${total}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`dot ${i < done ? 'filled' : ''} ${i >= total ? 'extra' : ''}`} />
      ))}
    </span>
  )
}

export function TaskList({
  tasks,
  activeTaskId,
  onAdd,
  onToggleDone,
  onDelete,
  onSelect,
  onClearDone,
}: TaskListProps) {
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const todo = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, estimate)
    setTitle('')
    setEstimate(1)
  }

  const renderTask = (task: Task, index: number) => (
    <li
      key={task.id}
      className={`task ${task.done ? 'done' : ''} ${task.id === activeTaskId ? 'active' : ''}`}
      onClick={() => !task.done && onSelect(task.id)}
    >
      <span className="task-index">{String(index + 1).padStart(2, '0')}</span>
      <button
        className="check"
        aria-label={task.done ? 'Marquer comme à faire' : 'Marquer comme terminée'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleDone(task.id)
        }}
      >
        {task.done ? '✓' : ''}
      </button>
      <span className="task-title">{task.title}</span>
      <PomodoroDots done={task.completedPomodoros} total={task.estimatedPomodoros} />
      <button
        className="delete"
        aria-label="Supprimer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(task.id)
        }}
      >
        ✕
      </button>
    </li>
  )

  return (
    <section className="tasks">
      <header className="tasks-header">
        <h2>
          À faire<sup>{todo.length}</sup>
        </h2>
        <span className="tasks-summary">
          {done.length}/{tasks.length} ✓
        </span>
      </header>

      {todo.length === 0 && !isAdding && (
        <p className="empty">Rien sur la liste. Ajoute ta première tâche ↓</p>
      )}

      {todo.length > 0 && <ul className="task-list">{todo.map(renderTask)}</ul>}

      {isAdding ? (
        <form className="add-form" onSubmit={submit}>
          <input
            autoFocus
            className="add-title"
            placeholder="Sur quoi travailles-tu ?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setIsAdding(false)}
          />
          <div className="add-row">
            <label className="estimate">
              Pomodoros
              <span className="stepper">
                <button type="button" onClick={() => setEstimate((v) => Math.max(1, v - 1))}>
                  −
                </button>
                <span>{estimate}</span>
                <button type="button" onClick={() => setEstimate((v) => Math.min(20, v + 1))}>
                  +
                </button>
              </span>
            </label>
            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => setIsAdding(false)}>
                Annuler
              </button>
              <button type="submit" className="primary" disabled={!title.trim()}>
                Ajouter →
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <span>+</span> Nouvelle tâche
        </button>
      )}

      {done.length > 0 && (
        <div className="done-section">
          <div className="done-header">
            <h3>Terminées · {done.length}</h3>
            <button className="link" onClick={onClearDone}>
              Tout effacer
            </button>
          </div>
          <ul className="task-list">{done.map(renderTask)}</ul>
        </div>
      )}
    </section>
  )
}
