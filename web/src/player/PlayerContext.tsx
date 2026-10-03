import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { AudioEngine, LayerState } from '../audio/engine'

const EngineContext = createContext<AudioEngine | null>(null)

export function PlayerProvider({ engine, children }: { engine: AudioEngine; children: ReactNode }) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

export function useEngine(): AudioEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine must be used inside <PlayerProvider>')
  return engine
}

export function useLayers(): readonly LayerState[] {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getLayers)
}

export function useMasterVolume(): number {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribe, engine.getMasterVolume)
}
