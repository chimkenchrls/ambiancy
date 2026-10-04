import { describe, expect, it } from 'vitest'
import { SCENES } from '../catalogue'
import { mixSummary, mixTitle } from './nowPlaying'

describe('mixTitle', () => {
  it('names the scene when the mix has exactly its sounds, whatever the volumes', () => {
    const scene = SCENES.find((candidate) => candidate.id === 'stormy-cabin')!
    const mix = scene.layers.map((layer) => ({ soundId: layer.soundId, volume: 5 })).reverse()
    expect(mixTitle(mix)).toBe('Stormy cabin')
  })

  it('calls anything else "Your mix"', () => {
    expect(mixTitle([{ soundId: 'rain', volume: 60 }])).toBe('Your mix')
  })
})

describe('mixSummary', () => {
  it('counts the sounds', () => {
    expect(mixSummary([{ soundId: 'rain', volume: 60 }])).toBe('1 sound')
    expect(
      mixSummary([
        { soundId: 'rain', volume: 60 },
        { soundId: 'wind', volume: 60 },
      ]),
    ).toBe('2 sounds')
  })
})
