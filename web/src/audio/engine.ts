import { MAX_LAYERS, clampVolume, type Mix } from '../mix/mix'

export type LayerStatus = 'loading' | 'playing' | 'error'

export interface LayerState {
  soundId: string
  volume: number
  status: LayerStatus
}

export interface GainParamLike {
  value: number
  setValueAtTime(value: number, time: number): unknown
  linearRampToValueAtTime(value: number, time: number): unknown
  cancelScheduledValues(time: number): unknown
}

export interface GainNodeLike {
  gain: GainParamLike
  connect(destination: unknown): unknown
  disconnect(): void
}

export interface SourceNodeLike {
  buffer: unknown
  loop: boolean
  connect(destination: unknown): unknown
  disconnect(): void
  start(): void
  stop(): void
}

export interface AudioContextLike {
  currentTime: number
  destination: unknown
  state: string
  resume(): Promise<void>
  createGain(): GainNodeLike
  createBufferSource(): SourceNodeLike
}

export interface EngineDeps {
  context: AudioContextLike
  loadBuffer: (soundId: string) => Promise<unknown>
}

export interface AudioEngine {
  addLayer(soundId: string, volume: number): Promise<void>
  removeLayer(soundId: string): void
  setVolume(soundId: string, volume: number): void
  retryLayer(soundId: string): Promise<void>
  setMasterVolume(volume: number): void
  getMasterVolume(): number
  fadeOut(seconds: number): Promise<void>
  cancelFade(): void
  stopAll(): void
  getMix(): Mix
  loadMix(mix: Mix): Promise<void>
  getLayers(): readonly LayerState[]
  subscribe(listener: () => void): () => void
}

interface Entry {
  soundId: string
  volume: number
  status: LayerStatus
  gain: GainNodeLike | null
  source: SourceNodeLike | null
  /** Changes on every start attempt, so a stale download can tell it is stale. */
  token: number
}

export function createAudioEngine({ context, loadBuffer }: EngineDeps): AudioEngine {
  const master = context.createGain()
  master.connect(context.destination)

  const entries = new Map<string, Entry>()
  const listeners = new Set<() => void>()
  let snapshot: readonly LayerState[] = []
  let masterVolume = 100
  let nextToken = 1
  let fadeTimer: ReturnType<typeof setTimeout> | null = null
  let resolveFade: (() => void) | null = null

  function emit() {
    snapshot = [...entries.values()].map(({ soundId, volume, status }) => ({ soundId, volume, status }))
    listeners.forEach((listener) => listener())
  }

  function isCurrent(entry: Entry, token: number) {
    return entries.get(entry.soundId) === entry && entry.token === token
  }

  async function start(entry: Entry): Promise<void> {
    const token = entry.token
    entry.status = 'loading'
    emit()
    try {
      if (context.state !== 'running') await context.resume()
      const buffer = await loadBuffer(entry.soundId)
      if (!isCurrent(entry, token)) return

      const gain = context.createGain()
      gain.gain.value = entry.volume / 100
      gain.connect(master)

      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()

      entry.gain = gain
      entry.source = source
      entry.status = 'playing'
    } catch {
      if (!isCurrent(entry, token)) return
      entry.status = 'error'
    }
    emit()
  }

  function teardown(entry: Entry) {
    if (entry.source) {
      try {
        entry.source.stop()
      } catch {
        // already stopped
      }
      entry.source.disconnect()
    }
    if (entry.gain) entry.gain.disconnect()
    entry.source = null
    entry.gain = null
  }

  function applyMasterVolume() {
    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(masterVolume / 100, now)
  }

  /** Ends a running fade timer and settles its promise. Returns whether a fade was running. */
  function endFade(): boolean {
    if (fadeTimer === null) return false
    clearTimeout(fadeTimer)
    fadeTimer = null
    resolveFade?.()
    resolveFade = null
    return true
  }

  function cancelFade() {
    if (endFade()) applyMasterVolume()
  }

  function setVolume(soundId: string, volume: number) {
    const entry = entries.get(soundId)
    if (!entry) return
    entry.volume = clampVolume(volume)
    if (entry.gain) entry.gain.gain.value = entry.volume / 100
    emit()
  }

  function addLayer(soundId: string, volume: number): Promise<void> {
    cancelFade()
    if (entries.has(soundId)) {
      setVolume(soundId, volume)
      return Promise.resolve()
    }
    if (entries.size >= MAX_LAYERS) return Promise.resolve()

    const entry: Entry = {
      soundId,
      volume: clampVolume(volume),
      status: 'loading',
      gain: null,
      source: null,
      token: nextToken++,
    }
    entries.set(soundId, entry)
    return start(entry)
  }

  function removeLayer(soundId: string) {
    const entry = entries.get(soundId)
    if (!entry) return
    teardown(entry)
    entries.delete(soundId)
    emit()
  }

  function retryLayer(soundId: string): Promise<void> {
    const entry = entries.get(soundId)
    if (!entry || entry.status !== 'error') return Promise.resolve()
    entry.token = nextToken++
    return start(entry)
  }

  function setMasterVolume(volume: number) {
    endFade()
    masterVolume = clampVolume(volume)
    applyMasterVolume()
    emit()
  }

  function stopAll() {
    endFade()
    entries.forEach(teardown)
    entries.clear()
    applyMasterVolume()
    emit()
  }

  function fadeOut(seconds: number): Promise<void> {
    cancelFade()
    if (entries.size === 0) return Promise.resolve()

    const now = context.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(masterVolume / 100, now)
    master.gain.linearRampToValueAtTime(0, now + seconds)

    return new Promise<void>((resolve) => {
      resolveFade = resolve
      fadeTimer = setTimeout(stopAll, seconds * 1000)
    })
  }

  async function loadMix(mix: Mix): Promise<void> {
    stopAll()
    await Promise.all(mix.map((layer) => addLayer(layer.soundId, layer.volume)))
  }

  return {
    addLayer,
    removeLayer,
    setVolume,
    retryLayer,
    setMasterVolume,
    getMasterVolume: () => masterVolume,
    fadeOut,
    cancelFade,
    stopAll,
    getMix: () => [...entries.values()].map(({ soundId, volume }) => ({ soundId, volume })),
    loadMix,
    getLayers: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
