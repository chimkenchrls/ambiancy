#!/usr/bin/env node
// Downloads each sound's picture from Wikimedia Commons into media/images/,
// resized and converted to WebP. The pictures and their licences are listed in
// web/src/catalogue/sounds.json; nothing is committed to git.
// Usage: node tools/fetch-artwork.mjs   (needs ffmpeg)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const sounds = JSON.parse(fs.readFileSync(path.join(root, 'web/src/catalogue/sounds.json'), 'utf8'))
const headers = { 'User-Agent': 'AmbiancyDev/0.1 (https://github.com/chimkenchrls/ambiancy)' }
const WIDTH = 1280

fs.mkdirSync(path.join(root, 'media/images'), { recursive: true })

for (const sound of sounds) {
  const title = decodeURIComponent(sound.artworkSource.split('/wiki/')[1])
  const api =
    'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: String(WIDTH),
    })
  const info = await (await fetch(api, { headers })).json()
  const thumb = Object.values(info.query.pages)[0]?.imageinfo?.[0]?.thumburl
  if (!thumb) throw new Error(`No picture found for ${sound.id} at ${sound.artworkSource}`)

  const response = await fetch(thumb, { headers })
  if (!response.ok) throw new Error(`Download failed for ${sound.id}: HTTP ${response.status}`)
  const original = path.join(os.tmpdir(), `ambiancy-${sound.id}`)
  fs.writeFileSync(original, Buffer.from(await response.arrayBuffer()))

  const output = path.join(root, 'media', sound.artwork)
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', original, '-vf', `scale=${WIDTH}:-2`, '-quality', '76', output])
  fs.rmSync(original)
  console.log(`made media/${sound.artwork}`)
}
