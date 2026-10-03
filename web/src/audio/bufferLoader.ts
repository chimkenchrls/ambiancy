export function createBufferLoader(
  context: Pick<BaseAudioContext, 'decodeAudioData'>,
  urlFor: (soundId: string) => string,
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
): (soundId: string) => Promise<AudioBuffer> {
  const cache = new Map<string, Promise<AudioBuffer>>()

  return function loadBuffer(soundId) {
    const cached = cache.get(soundId)
    if (cached) return cached

    const download = (async () => {
      const response = await fetchFn(urlFor(soundId))
      if (!response.ok) throw new Error(`Could not load sound "${soundId}" (HTTP ${response.status})`)
      return context.decodeAudioData(await response.arrayBuffer())
    })()

    cache.set(soundId, download)
    download.catch(() => {
      cache.delete(soundId)
    })
    return download
  }
}
