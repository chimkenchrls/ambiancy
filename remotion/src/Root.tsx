import { loadFont } from '@remotion/fonts'
import { Composition, staticFile } from 'remotion'
import { fonts } from '../theme'
import { Journey } from './Journey'
import { DURATION, FPS, H, W } from './timeline'

// Tuffy is not a system font, so the two weights the site uses ship with the video.
for (const weight of [fonts.weight.regular, fonts.weight.bold]) {
  loadFont({ family: 'Tuffy', url: staticFile(`fonts/tuffy-latin-${weight}-normal.woff2`), weight: String(weight) })
}

export function Root() {
  return <Composition id="AmbiancyJourney" component={Journey} defaultProps={{ captions: true }} durationInFrames={DURATION * FPS} fps={FPS} width={W} height={H} />
}
