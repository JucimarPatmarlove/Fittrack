import { useState, useEffect, useRef, useCallback } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue } catch { return defaultValue }
  })
  const set = useCallback((val) => {
    setValue(prev => {
      const next = typeof val === 'function' ? val(prev) : val
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])
  return [value, set]
}

export function useWakeLock(active) {
  const lockRef = useRef(null)
  useEffect(() => {
    if (!active) { lockRef.current?.release?.(); lockRef.current = null; return }
    if (!('wakeLock' in navigator)) return
    navigator.wakeLock.request('screen').then(l => { lockRef.current = l }).catch(() => {})
    return () => { lockRef.current?.release?.(); lockRef.current = null }
  }, [active])
}

export function useBeep() {
  const ctxRef = useRef(null)
  const beep = useCallback((freq = 880, dur = 0.13, vol = 0.3) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctxRef.current.createOscillator(), g = ctxRef.current.createGain()
      o.connect(g); g.connect(ctxRef.current.destination)
      o.frequency.value = freq; g.gain.value = vol
      o.start(); o.stop(ctxRef.current.currentTime + dur)
    } catch {}
  }, [])
  const beepDone = useCallback(() => {
    setTimeout(() => beep(1046, 0.10), 0)
    setTimeout(() => beep(1046, 0.10), 160)
    setTimeout(() => beep(698, 0.22), 330)
  }, [beep])
  return { beep, beepDone }
}

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return elapsed
}
