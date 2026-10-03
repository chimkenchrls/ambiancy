#!/usr/bin/env bash
# Generates placeholder ambient loops into media/audio/ using FFmpeg.
# Usage: ./tools/make-dev-sounds.sh
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p media/audio

# make <id> <noise colour> <low-cut Hz> <high-cut Hz> <swell rate Hz> <swell depth 0-1>
make() {
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "anoisesrc=color=$2:duration=20:sample_rate=44100:amplitude=0.4" \
    -af "highpass=f=$3,lowpass=f=$4,tremolo=f=$5:d=$6" \
    -ac 2 -b:a 128k "media/audio/$1.mp3"
  echo "made media/audio/$1.mp3"
}

make rain            white  400  6000 0.3 0.2
make wind            pink   80   900  0.1 0.7
make creek           white  900  4500 2.0 0.3
make cicadas         white  3500 8000 6.0 0.5
make coffee-shop     pink   200  2500 0.7 0.3
make fireplace       brown  100  3000 4.0 0.6
make birds-chirping  white  2500 7000 3.0 0.8
make ocean-waves     brown  40   1200 0.1 0.9
make thunderstorm    brown  30   500  0.2 0.8
make night-forest    pink   150  1800 0.2 0.4
