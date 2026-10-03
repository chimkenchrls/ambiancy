import { describe, expect, it } from 'vitest'
import { SCENES, SOUNDS, audioUrl, getSound, isSoundId } from './index'
import { MAX_LAYERS } from '../mix/mix'

describe('sound catalogue', () => {
  it('has unique ids made of lowercase letters and hyphens', () => {
    const ids = SOUNDS.map((sound) => sound.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/)
  })

  it('records a source, licence and author for every sound', () => {
    for (const sound of SOUNDS) {
      expect(sound.source, sound.id).not.toBe('')
      expect(sound.licence, sound.id).not.toBe('')
      expect(sound.author, sound.id).not.toBe('')
    }
  })

  it('looks sounds up by id', () => {
    expect(getSound('rain')?.name).toBe('Rain')
    expect(getSound('nope')).toBeUndefined()
    expect(isSoundId('rain')).toBe(true)
    expect(isSoundId('nope')).toBe(false)
  })

  it('builds an audio address under the media base', () => {
    const rain = getSound('rain')!
    expect(audioUrl(rain)).toMatch(/^https?:\/\/.+\/audio\/rain\.mp3$/)
  })
})

describe('scenes', () => {
  it('has unique ids', () => {
    const ids = SCENES.map((scene) => scene.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses catalogue sounds, valid volumes and at most MAX_LAYERS layers', () => {
    for (const scene of SCENES) {
      expect(scene.layers.length, scene.id).toBeGreaterThan(0)
      expect(scene.layers.length, scene.id).toBeLessThanOrEqual(MAX_LAYERS)
      const ids = scene.layers.map((layer) => layer.soundId)
      expect(new Set(ids).size, scene.id).toBe(ids.length)
      for (const layer of scene.layers) {
        expect(isSoundId(layer.soundId), `${scene.id}/${layer.soundId}`).toBe(true)
        expect(Number.isInteger(layer.volume), `${scene.id}/${layer.soundId}`).toBe(true)
        expect(layer.volume).toBeGreaterThanOrEqual(0)
        expect(layer.volume).toBeLessThanOrEqual(100)
      }
    }
  })
})
