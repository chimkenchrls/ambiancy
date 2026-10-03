import { audioUrl, getSound } from '../catalogue'
import { createBufferLoader } from './bufferLoader'
import { createAudioEngine, type AudioEngine } from './engine'

export function createBrowserEngine(): AudioEngine {
  const context = new AudioContext()
  const loadBuffer = createBufferLoader(context, (soundId) => {
    const sound = getSound(soundId)
    if (!sound) throw new Error(`Unknown sound "${soundId}"`)
    return audioUrl(sound)
  })
  return createAudioEngine({ context, loadBuffer })
}
