import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { AudioEngine, LayerState } from '../audio/engine'
import { SLEEP_FADE_SECONDS, type ActiveTimer, type TimerMode } from '../timer/timer'
import { useTimer } from '../timer/useTimer'

interface PlayerTimer {
  timer: ActiveTimer | null
  remaining: number
  /** What happened when the last timer finished, until a new one starts. */
  message: string | null
  start(mode: TimerMode, minutes: number): void
  cancel(): void
}

const EngineContext = createContext<AudioEngine | null>(null)
const TimerContext = createContext<PlayerTimer | null>(null)

// The timer is held here, next to the engine, so it shares the audio's lifetime:
// both keep going while the visitor moves between pages.
export function PlayerProvider({ engine, children }: { engine: AudioEngine; children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const { timer, remaining, start, cancel } = useTimer((finished) => {
    if (finished === 'sleep') {
      void engine.fadeOut(SLEEP_FADE_SECONDS)
      setMessage('Sleep timer finished. Fading out.')
    } else {
      setMessage('Focus session complete.')
    }
  })

  const startTimer = useCallback(
    (mode: TimerMode, minutes: number) => {
      setMessage(null)
      start(mode, minutes)
    },
    [start],
  )

  const playerTimer = useMemo(
    () => ({ timer, remaining, message, start: startTimer, cancel }),
    [timer, remaining, message, startTimer, cancel],
  )

  return (
    <EngineContext.Provider value={engine}>
      <TimerContext.Provider value={playerTimer}>{children}</TimerContext.Provider>
    </EngineContext.Provider>
  )
}

export function useEngine(): AudioEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine must be used inside <PlayerProvider>')
  return engine
}

export function usePlayerTimer(): PlayerTimer {
  const playerTimer = useContext(TimerContext)
  if (!playerTimer) throw new Error('usePlayerTimer must be used inside <PlayerProvider>')
  return playerTimer
}

export function useLayers(): readonly LayerState[] {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getLayers)
}

export function useMasterVolume(): number {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getMasterVolume)
}

export function usePaused(): boolean {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.isPaused)
}

export function useAudioBlocked(): boolean {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.isAudioBlocked)
}
