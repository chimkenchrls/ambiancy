# Ambiancy

A free ambient sound mixer. Layer sounds such as rain, a fireplace and a coffee shop, set each one's volume, and share the mix by link.

This repository is also a DevOps portfolio project: the app is small, and the way it is built, shipped and run is the point. See `docs/superpowers/specs/` for the design and `docs/stages/` for a plain-language note on each stage.

## Run it locally

Requirements: Docker, Node 22, FFmpeg.

    ./tools/make-dev-sounds.sh     # generate placeholder sounds into media/
    docker compose up -d --build   # web on http://localhost:8080, media on :8081

For development with hot reload:

    docker compose up -d media
    cd web && npm install && npm run dev   # http://localhost:5173

## Tests

    cd web && npm test

## Licences

Sounds and their licences are listed in `web/src/catalogue/sounds.json` and on the `/licences` page.
