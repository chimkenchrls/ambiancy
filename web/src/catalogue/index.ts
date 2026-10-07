import type { Mix } from '../mix/mix'
import scenesData from './scenes.json'
import soundsData from './sounds.json'

export interface Sound {
  id: string
  name: string
  description: string
  audioFile: string
  artwork: string | null
  artworkSource: string
  artworkLicence: string
  artworkAuthor: string
  source: string
  licence: string
  author: string
}

export interface Scene {
  id: string
  name: string
  description: string
  layers: Mix
}

export const SOUNDS: readonly Sound[] = soundsData
export const SCENES: readonly Scene[] = scenesData

const soundsById = new Map(SOUNDS.map((sound) => [sound.id, sound]))

export function getSound(id: string): Sound | undefined {
  return soundsById.get(id)
}

export function isSoundId(id: string): boolean {
  return soundsById.has(id)
}

const MEDIA_BASE_URL = (import.meta.env.VITE_MEDIA_BASE_URL ?? 'http://localhost:8081').replace(/\/$/, '')

export function audioUrl(sound: Sound): string {
  return `${MEDIA_BASE_URL}/${sound.audioFile}`
}

/** The address of any other file on the media server, such as the landing page film. */
export function mediaUrl(path: string): string {
  return `${MEDIA_BASE_URL}/${path}`
}

export function artworkUrl(sound: Sound): string | null {
  return sound.artwork ? `${MEDIA_BASE_URL}/${sound.artwork}` : null
}
