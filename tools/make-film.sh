#!/usr/bin/env bash
# Renders the landing-page film with Remotion and encodes it into media/video/.
# Needs Node and FFmpeg, and `npm install` run once in remotion/.
# Usage: ./tools/make-film.sh
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p media/video

# The soundtrack is generated, not stored: make it if it is not there yet.
[ -f remotion/public/audio/music.wav ] || (cd remotion && npm run audio)

(
  cd remotion
  npx remotion render src/index.ts AmbiancyJourney out/ambiancy.mp4 --log=error
  # The poster is the finished mix, without the burned-in caption (frame 701 is 23.4s).
  npx remotion still src/index.ts AmbiancyJourney out/poster.png --frame=701 --props='{"captions":false}' --log=error
)

encode() {
  ffmpeg -hide_banner -loglevel error -y -i remotion/out/ambiancy.mp4 -vf scale=1280:-2 "$@"
  echo "made ${*: -1}"
}

encode -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -c:a libopus -b:a 96k media/video/ambiancy.webm
encode -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart media/video/ambiancy.mp4

ffmpeg -hide_banner -loglevel error -y -i remotion/out/poster.png -vf scale=1280:-2 -q:v 4 media/video/ambiancy-poster.jpg
echo "made media/video/ambiancy-poster.jpg"
