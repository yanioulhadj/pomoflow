import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'pomoflow:timer'

interface StoredTimer {
  /** Identifie le minuteur (mode + durée) auquel l'état sauvegardé appartient. */
  id: string
  remaining: number
  /** Date de fin (ms) si le minuteur tournait, sinon null. */
  endAt: number | null
}

function loadTimer(id: string | undefined, durationSeconds: number) {
  const fresh = { remaining: durationSeconds, endAt: null as number | null }
  if (!id) return fresh
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredTimer | null
    if (!stored || stored.id !== id) return fresh
    if (stored.endAt) {
      return {
        remaining: Math.max(0, Math.round((stored.endAt - Date.now()) / 1000)),
        endAt: stored.endAt,
      }
    }
    return { remaining: Math.min(durationSeconds, Math.max(0, stored.remaining)), endAt: null }
  } catch {
    return fresh
  }
}

/**
 * Compte à rebours basé sur une date de fin (et non sur des ticks),
 * pour rester précis même si l'onglet passe en arrière-plan.
 *
 * Si `persistId` est fourni, l'état est sauvegardé dans le localStorage et
 * restauré au rechargement (y compris après fermeture du navigateur).
 */
export function useTimer(durationSeconds: number, onComplete: () => void, persistId?: string) {
  const [initial] = useState(() => loadTimer(persistId, durationSeconds))
  const [remaining, setRemaining] = useState(initial.remaining)
  const [isRunning, setIsRunning] = useState(initial.endAt !== null)
  const remainingRef = useRef(initial.remaining)
  const endAtRef = useRef<number | null>(initial.endAt)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isRunning) {
      endAtRef.current = null
      return
    }
    // Reprend la date de fin restaurée si elle existe, sinon en calcule une nouvelle
    const endAt = endAtRef.current ?? Date.now() + remainingRef.current * 1000
    endAtRef.current = endAt

    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      remainingRef.current = left
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(id)
        endAtRef.current = null
        setIsRunning(false)
        onCompleteRef.current()
      }
    }
    const id = window.setInterval(tick, 250)

    return () => window.clearInterval(id)
  }, [isRunning])

  // Sauvegarde : à chaque démarrage / pause / reset, et à chaque seconde
  useEffect(() => {
    if (!persistId) return
    const state: StoredTimer = {
      id: persistId,
      remaining,
      endAt: isRunning ? endAtRef.current : null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [persistId, remaining, isRunning])

  const toggle = useCallback(() => setIsRunning((r) => !r), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    endAtRef.current = null
    remainingRef.current = durationSeconds
    setRemaining(durationSeconds)
  }, [durationSeconds])

  return { remaining, isRunning, toggle, reset }
}
