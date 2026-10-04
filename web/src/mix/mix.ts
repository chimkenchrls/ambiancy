export const MAX_LAYERS = 8

export interface Layer {
  soundId: string
  volume: number
}

export type Mix = Layer[]

export function clampVolume(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function normaliseMix(layers: readonly Layer[], isValidSoundId: (id: string) => boolean): Mix {
  const seen = new Set<string>()
  const result: Mix = []
  for (const layer of layers) {
    if (result.length === MAX_LAYERS) break
    if (!isValidSoundId(layer.soundId) || seen.has(layer.soundId)) continue
    seen.add(layer.soundId)
    result.push({ soundId: layer.soundId, volume: clampVolume(layer.volume) })
  }
  return result
}
