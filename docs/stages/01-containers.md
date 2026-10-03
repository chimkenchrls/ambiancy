# Stage 1: the player, in containers

## What was added

- The player itself: a React app that mixes ambient sounds in the browser.
- A `Dockerfile` that turns the app into a container image.
- A `compose.yaml` that runs two containers together: the app and a media server.

## Why containers

A container image holds the app together with everything it needs to run. The image built on this laptop is the same one that will later run in Azure, so "it works on my machine" and "it works in production" become the same statement.

## How the Dockerfile works

It has two stages:

1. **Build.** Starts from an image with Node installed, installs the dependencies, and runs `npm run build`. The result is a folder of plain HTML, CSS and JavaScript files.
2. **Serve.** Starts again from a small nginx image and copies in only that folder. Node, the source code and the dependencies are left behind, which keeps the final image small and gives an attacker less to work with.

`package.json` and `package-lock.json` are copied before the rest of the code. Docker caches each step, so the slow dependency install only reruns when those two files change.

## How Compose works

`compose.yaml` describes containers that belong together, so one command starts them all.

- **web** is built from `web/Dockerfile` and published on port 8080.
- **media** is a stock nginx image serving the `media/` folder on port 8081.

The media server is separate on purpose. In production the audio comes from Azure Blob Storage, a different address from the app. Running it separately locally means the cross-origin rules (the `Access-Control-Allow-Origin` header) are exercised here too, instead of being discovered for the first time in production.

## Things worth knowing

- **`VITE_MEDIA_BASE_URL` is a build-time setting.** The address of the media server is baked into the JavaScript when the image is built, because static files cannot read environment variables when they run. A different media address means a rebuild.
- **The `z` on the volume mounts** is for Fedora. SELinux blocks containers from reading host folders unless the mount is labelled, and `z` applies that label.
- **`try_files $uri /index.html`** in `web/nginx.conf` sends addresses such as `/play` to the app, which decides what to show. Without it, reloading `/play` would return a 404.
- **`media/` is not in git.** Audio is large and will live in object storage. The sounds here are generated noise from `tools/make-dev-sounds.sh`, standing in until licensed recordings are sourced.

## Commands

    docker compose up -d --build   # build and start
    docker compose ps              # what is running
    docker compose logs -f web     # follow the web container's logs
    docker compose down            # stop and remove the containers
