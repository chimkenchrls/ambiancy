import { describe, expect, it, vi } from 'vitest'
import { createBufferLoader } from './bufferLoader'

function setup(responses: Array<{ ok: boolean; status: number }>) {
  const decoded = { decoded: true } as unknown as AudioBuffer
  const context = {
    decodeAudioData: vi.fn(async () => decoded),
  } as unknown as Pick<BaseAudioContext, 'decodeAudioData'>
  const fetchFn = vi.fn(async () => {
    const next = responses.shift()!
    return { ok: next.ok, status: next.status, arrayBuffer: async () => new ArrayBuffer(8) }
  }) as unknown as typeof fetch
  const loadBuffer = createBufferLoader(context, (id) => `http://media.test/audio/${id}.mp3`, fetchFn)
  return { loadBuffer, fetchFn, decoded }
}

describe('createBufferLoader', () => {
  it('fetches the sound from its address and decodes it', async () => {
    const { loadBuffer, fetchFn, decoded } = setup([{ ok: true, status: 200 }])
    await expect(loadBuffer('rain')).resolves.toBe(decoded)
    expect(fetchFn).toHaveBeenCalledWith('http://media.test/audio/rain.mp3')
  })

  it('downloads each sound only once', async () => {
    const { loadBuffer, fetchFn } = setup([{ ok: true, status: 200 }])
    await loadBuffer('rain')
    await loadBuffer('rain')
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('rejects when the server answers with an error', async () => {
    const { loadBuffer } = setup([{ ok: false, status: 404 }])
    await expect(loadBuffer('rain')).rejects.toThrow('HTTP 404')
  })

  it('tries again after a failure instead of remembering it', async () => {
    const { loadBuffer, fetchFn, decoded } = setup([
      { ok: false, status: 503 },
      { ok: true, status: 200 },
    ])
    await expect(loadBuffer('rain')).rejects.toThrow()
    await expect(loadBuffer('rain')).resolves.toBe(decoded)
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('rejects when the address cannot be built', async () => {
    const context = { decodeAudioData: vi.fn() } as unknown as Pick<BaseAudioContext, 'decodeAudioData'>
    const loadBuffer = createBufferLoader(context, () => {
      throw new Error('Unknown sound "nope"')
    })
    await expect(loadBuffer('nope')).rejects.toThrow('Unknown sound')
  })
})
