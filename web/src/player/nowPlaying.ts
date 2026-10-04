import { SCENES } from '../catalogue'
import type { Layer } from '../mix/mix'

/** The scene's name when the mix has exactly that scene's sounds; otherwise "Your mix". */
export function mixTitle(layers: readonly Layer[]): string {
  const scene = SCENES.find(
    (candidate) =>
      candidate.layers.length === layers.length &&
      candidate.layers.every((layer) => layers.some((live) => live.soundId === layer.soundId)),
  )
  return scene?.name ?? 'Your mix'
}

export function mixSummary(layers: readonly Layer[]): string {
  return layers.length === 1 ? '1 sound' : `${layers.length} sounds`
}
