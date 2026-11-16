import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Compte à rebours basé sur une date de fin (et non sur des ticks),
 * pour rester précis même si l'onglet passe en arrière-plan.
 */
export function useTimer(durationSeconds: number, onComplete: () => void) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const remainingRef = useRef(durationSeconds)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isRunning) return
    const endAt = Date.now() + remainingRef.current * 1000

    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      remainingRef.current = left
      setRemaining(left)
      if (left === 0) {
        window.clearInterval(id)
        setIsRunning(false)
        onCompleteRef.current()
      }
    }, 250)

    return () => window.clearInterval(id)
  }, [isRunning])

  const toggle = useCallback(() => setIsRunning((r) => !r), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    remainingRef.current = durationSeconds
    setRemaining(durationSeconds)
  }, [durationSeconds])

  return { remaining, isRunning, toggle, reset }
}
