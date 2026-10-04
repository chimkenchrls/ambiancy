import { clampVolume, normaliseMix, type Layer, type Mix } from './mix'

export function encodeMix(mix: Mix): string {
  return mix.map((layer) => `${encodeURIComponent(layer.soundId)}=${clampVolume(layer.volume)}`).join(',')
}

export function decodeMix(hash: string, isValidSoundId: (id: string) => boolean): Mix {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  if (body === '') return []

  const layers: Layer[] = []
  for (const part of body.split(',')) {
    const pieces = part.split('=')
    if (pieces.length !== 2) continue
    const [rawId, rawVolume] = pieces as [string, string]
    if (!/^\d+$/.test(rawVolume)) continue
    let soundId: string
    try {
      soundId = decodeURIComponent(rawId)
    } catch {
      continue
    }
    layers.push({ soundId, volume: Number(rawVolume) })
  }
  return normaliseMix(layers, isValidSoundId)
}

export function shareUrl(mix: Mix, origin: string): string {
  return `${origin}/mix#${encodeMix(mix)}`
}
