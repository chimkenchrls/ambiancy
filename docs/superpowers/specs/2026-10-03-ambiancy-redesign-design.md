# Ambiancy redesign: design spec

Date: 2026-10-03
Status: awaiting review

## 1. Purpose

Ambiancy becomes two things at once:

- **A real product.** A free ambient sound mixer that people can use, install and come back to.
- **A DevOps portfolio piece.** The way it is built, shipped and run shows container, pipeline, infrastructure-as-code and monitoring skill.

The owner is an aspiring DevOps engineer working solo, who wants to understand every part of the setup, not only have it. Terraform and Go are new to them.

### Success criteria

- A visitor can open the landing page and hear a scene within one click, with no account and no install.
- A signed-in user can save a mix, find it on another device, publish it and see it in the gallery.
- The site installs as an app and plays previously loaded sounds offline.
- Every change reaches production only through a pull request and the pipeline.
- All Azure resources are created by Terraform; none by hand in the portal.
- A public status page shows current health, 90-day uptime and the running version.
- Running cost stays inside the Azure for Students credit (about $100 a year).
- Every sound and image has a recorded source and licence.
- The owner can explain each pipeline step and each Terraform resource.

## 2. Background

The existing repo (`chimkenchrls/ambiancy`, private) is a May 2025 school project: a static landing page and a web player in plain HTML, CSS and JavaScript. Forms post nowhere, reviews and store links are placeholders, and there is no backend, build, test or deployment.

Two problems carry into the redesign:

- **The audio came from YouTube** and has no licence. It cannot be served publicly.
- **The media is in all 72 commits**, so the repo cannot be made public as it is.

## 3. Scope

### Version one

| Feature | Needs an account | Needs the API |
|---|---|---|
| Mixer: layer up to 8 sounds, each with its own volume | No | No |
| Sleep timer (fades out) and focus timer | No | No |
| Ready-made scenes | No | No |
| Share a mix by link | No | No |
| Install as an app, play offline | No | No |
| Save, rename and delete named mixes | Yes | Yes |
| Publish a mix to the public gallery | Yes | Yes |
| Browse the gallery | No | Yes |
| Like a mix | Yes | Yes |
| Public status page | No | No |

### Later, not in version one

- Volumes that drift over time
- Session history and streaks
- Embeddable player
- Working support form
- User-facing "report this mix" button

### Out of scope

- User-uploaded sounds (copyright and moderation risk)
- Native mobile apps
- Payments
- Kubernetes
- An always-on staging environment

## 4. Architecture

```
                 Browser (installable app, works offline)
                    |                 |                |
        static files|        API calls|          audio |
                    v                 v                v
          Azure Static Web      Go API on         Azure Blob
          Apps (free tier)   Container Apps        Storage
          React + TypeScript  (scales to zero)   sounds, images,
                                      |           uptime data
                                      v
                               Neon Postgres
                          accounts, mixes, likes
```

### Components

| Component | Does | Depends on |
|---|---|---|
| Web app | Mixer, timers, scenes, gallery, status page, offline support | Media storage always; API only for accounts, saved mixes, gallery |
| API | Sign-in, saved mixes, gallery, likes, version info | Postgres, Key Vault secrets |
| Database | Stores users, sessions, mixes, likes | Nothing |
| Media storage | Serves audio, artwork and the uptime data file | Nothing |

### Principles

- **Playback never depends on the API.** The API scales to zero when idle and may take a moment to wake. Opening the site, playing scenes, mixing, timers and share links all work with the API asleep or down.
- **A mix is data.** It is a list of sound IDs and volumes. Audio files are never copied per user.
- **The sound catalogue is code.** Sounds and scenes are files in the repo, changed by pull request.

### Domains

Sign-in uses a session cookie, which browsers only send between addresses on the same site. A custom domain is therefore required:

- `ambiancy.<tld>` for the web app
- `api.ambiancy.<tld>` for the API

The domain comes from the GitHub Student Developer Pack's domain offer. The exact name is chosen when stage 4 begins; nothing before stage 4 depends on it.

### Region

Azure Southeast Asia, falling back to East Asia if the student subscription does not allow a needed service there.

## 5. Web app

### Stack

- React with TypeScript, built by Vite to static files
- React Router for pages
- `vite-plugin-pwa` for the service worker and install manifest
- Vitest for unit tests, Playwright for end-to-end tests

### Pages

| Path | Content |
|---|---|
| `/` | Landing page: what Ambiancy is, one scene playable in place, an "Open the player" button |
| `/play` | The full player: mixer, scenes, timers |
| `/mix` | Opens the mix encoded in the link in the player |
| `/gallery` | Public mixes, sorted by newest or most liked |
| `/me` | Saved mixes (signed in) |
| `/status` | Status page |
| `/licences` | Source and licence of every sound and image |
| `/terms`, `/privacy` | Rewritten to match what the product really does |

The placeholder reviews, fake store buttons, non-working sign-up form and non-working support form from the old site are removed.

### Audio engine

One module owns all playback, using the Web Audio API:

- Each sound is fetched, decoded once and looped from a buffer, which gives seamless loops.
- Each layer has its own gain node; a master gain node sits above them.
- The sleep timer fades the master gain to zero, then stops playback.
- Interface: `addLayer(soundId, volume)`, `removeLayer(soundId)`, `setVolume(soundId, volume)`, `setMasterVolume(volume)`, `fadeOut(seconds)`, `stopAll()`, `getMix()`, `loadMix(mix)`.
- The UI talks only to this interface.

### Catalogue and scenes

- `web/src/catalogue/sounds.json`: one entry per sound with `id`, `name`, `description`, `audioFile`, `artwork`, `source`, `licence`, `author`.
- `web/src/catalogue/scenes.json`: one entry per scene with `id`, `name` and a list of layers.
- The API holds a copy of the valid sound IDs, generated from `sounds.json` at build time, to validate mixes.

### Share links

- Format: `/mix#<soundId>=<volume>,<soundId>=<volume>`, for example `/mix#rain=70,fireplace=40`.
- The mix lives in the part of the address the browser does not send to a server, so links work with no API.
- Unknown sound IDs are dropped; volumes are clamped to 0–100; more than 8 layers are truncated.

### Offline and install

- The same site serves desktop and mobile. The player works in the browser everywhere; installing is offered, never required.
- The installed app opens at `/play`, skipping the landing page.
- The install suggestion appears only after the visitor has played something. On Android and desktop Chrome or Edge it is an "Install" button; on iPhone and iPad, where sites cannot trigger installation, it is a hint to use Share, then "Add to Home Screen".
- The service worker precaches the app shell.
- Audio and artwork are cached on first play, then served from the cache.
- Each sound has a "keep offline" control that caches it without playing.
- Offline, the gallery and saved mixes show the last loaded data with an "offline" notice.

### Failure handling

| Situation | Behaviour |
|---|---|
| Save fails or API is waking | Mix is kept in browser storage, shown as "not saved yet", retried with backoff |
| Session expired | Prompt to sign in again; the mix on screen is preserved |
| A sound fails to load | That layer shows an error and a retry control; other layers keep playing |
| Gallery unreachable | Clear message with a retry control; mixer unaffected |

## 6. API

### Stack

- Go, standard library HTTP server and router
- `pgx` for Postgres, `sqlc` for typed queries, `goose` for migrations
- `golang.org/x/oauth2` for sign-in
- OpenTelemetry for logs, metrics and traces
- Container image: multi-stage build ending in a minimal base image, running as a non-root user

### Endpoints

| Method and path | Purpose | Sign-in |
|---|---|---|
| `GET /healthz` | Process is alive | No |
| `GET /readyz` | Database is reachable | No |
| `GET /version` | Commit ID and deploy time | No |
| `GET /auth/{provider}/login` | Start sign-in (`google` or `github`) | No |
| `GET /auth/{provider}/callback` | Finish sign-in, set session cookie | No |
| `POST /auth/logout` | End session | Yes |
| `GET /me` | Current user | Yes |
| `DELETE /me` | Delete account and all its mixes and likes | Yes |
| `GET /mixes` | My mixes | Yes |
| `POST /mixes` | Create a mix | Yes |
| `PATCH /mixes/{id}` | Rename, edit layers, publish or unpublish | Yes, owner |
| `DELETE /mixes/{id}` | Delete a mix | Yes, owner |
| `GET /gallery?sort=new\|top&cursor=` | Public mixes, 24 per page | No |
| `PUT /mixes/{id}/like` | Like a public mix | Yes |
| `DELETE /mixes/{id}/like` | Remove a like | Yes |

Errors are JSON: `{"error": {"code": "...", "message": "..."}}` with a matching HTTP status.

### Rules

- A mix has 1 to 8 layers; each layer's sound ID must be in the catalogue; volume is an integer 0–100.
- Mix names are 1 to 60 characters, trimmed.
- A user may hold at most 100 mixes.
- Rate limits: 60 requests a minute per signed-in user, 30 a minute per address for anonymous requests.
- Only public mixes can be liked or appear in the gallery.
- The API accepts browser requests only from the web app's domain.

### Sign-in

- Google and GitHub, using the authorisation-code flow. No passwords are stored.
- A session is a random ID in an HTTP-only, secure cookie; the session row lives in Postgres and expires after 30 days.
- For end-to-end tests, a `POST /auth/dev-login` endpoint exists only when `AUTH_DEV_LOGIN=true`. The API refuses to start if that flag is set while `APP_ENV=production`.

### Moderation

- Mix names are the only user text shown publicly.
- A mix has a `hidden` flag that removes it from the gallery. The owner of the project sets it directly in the database, following a runbook entry.

## 7. Data

Postgres on Neon's free plan (0.5 GB storage, compute suspends when idle). This is chosen over Azure Database for PostgreSQL because a paid Azure instance would cost more than the whole yearly credit, and the free allowance for it on a student subscription could not be confirmed.

| Table | Columns |
|---|---|
| `users` | `id`, `provider`, `provider_user_id`, `display_name`, `avatar_url`, `created_at`; unique on (`provider`, `provider_user_id`) |
| `sessions` | `id`, `user_id`, `expires_at`, `created_at` |
| `mixes` | `id`, `owner_id`, `name`, `layers` (JSON list of `{soundId, volume}`), `is_public`, `hidden`, `like_count`, `created_at`, `updated_at` |
| `likes` | `user_id`, `mix_id`, `created_at`; primary key (`user_id`, `mix_id`) |

- Deleting a user removes their sessions, mixes and likes.
- `like_count` is updated in the same transaction as the `likes` row.
- Gallery indexes: (`is_public`, `hidden`, `created_at`) and (`is_public`, `hidden`, `like_count`).
- Migrations are additive first: a change that removes or renames a column ships in two releases, so the previous revision keeps working during a deploy.

## 8. Media and licensing

- All 11 existing sounds are replaced. Preferred source: CC0 recordings from Freesound. Also acceptable: Pixabay's licence, or the owner's own recordings.
- Sound artwork and any photos are replaced or their licence confirmed on the same terms.
- Each sound is a seamless loop, MP3 at 128 kbps, at most 2 MB.
- Media lives in Azure Blob Storage with long cache lifetimes and cross-origin access allowed for the web app's domain. It is not committed to git.
- Source files and an upload script live in the repo's tooling; `sounds.json` and the `/licences` page are the licence record.
- A CDN is added in front of storage only if traffic requires it.

## 9. Repository

- A **new public repository with clean history**. The current repository stays private as an archive.
- The design and player logic carry over; the old media does not.

```
web/                  front end
api/                  Go service
infra/                Terraform
.github/workflows/    pipelines
docs/                 spec, stage notes, runbooks, licences
compose.yaml          local stack
```

## 10. Delivery pipeline

### Local

`docker compose up` starts the API, Postgres and the web dev server. The API image is the same one that ships.

### Pull request checks

| Area | Steps |
|---|---|
| Web | Lint, type-check, unit tests, build |
| API | Lint, unit tests, integration tests against a Postgres container, image build |
| End-to-end | Playwright against the Compose stack |
| Security | Image and dependency vulnerability scan, secret scan |
| Infrastructure | `terraform fmt` and `validate`; `terraform plan` posted as a pull-request comment |
| Preview | Static Web Apps preview site for the front end |

`main` is protected: all checks must pass before merging.

### Deploy on merge to `main`

1. Build the API image, tag it with the commit ID, push to GitHub Container Registry.
2. Run database migrations.
3. Deploy the image as a new Container Apps revision receiving no traffic.
4. Smoke-test that revision directly: `/readyz` and one gallery request.
5. On success, shift all traffic to it. On failure, stop; the previous revision keeps serving.
6. Publish the front end to Static Web Apps.

### Infrastructure

- Terraform defines: resource group, Container Apps environment and app, storage account, Static Web App, Key Vault, Application Insights, alert rules, budget alerts, DNS records, and the Neon project (through the community Neon provider).
- Terraform state is stored in an Azure storage account with locking.
- Applies run in the pipeline behind a manual approval in GitHub, not from a laptop, once stage 4 is complete.
- GitHub authenticates to Azure with short-lived federated tokens; no long-lived Azure credential is stored.
- Application secrets (OAuth client secrets, database URL, session key) live in Key Vault and are read by the API through a managed identity.

### Environments

Local, pull-request previews (front end only, at most 3 at once on the free plan) and production. The zero-traffic revision check stands in for staging.

### Housekeeping

- Automated dependency update pull requests.
- Runbooks in `docs/runbooks/`: deploy, roll back, rotate a secret, hide a gallery mix, restore the database.

## 11. Monitoring

### Telemetry

- Structured logs, one line per request, with status, duration and request ID.
- Metrics: request count, error rate, response time, database query time.
- Traces across the API and database.
- Sent to Application Insights through OpenTelemetry, with a daily ingestion cap.

### Uptime checks

- A scheduled GitHub Actions workflow runs every 15 minutes, requests the site and the API's `/readyz` and `/version`, and records status and response time.
- Results are appended to `status/uptime.json` in Blob Storage, trimmed to 90 days.
- The status page reads that file directly, so it works when the API is down.

### Status page

- Current state of site, API and database
- 90-day uptime and response-time history
- Running version: commit ID and deploy time
- Incident log, kept as `web/src/status/incidents.json` and updated by pull request

### Alerts by email

- Three consecutive failed uptime checks
- API error rate above 5% over 10 minutes
- Spending at 50% and 80% of the yearly credit

## 12. Testing

| Level | Covers | Runs |
|---|---|---|
| Unit | Share-link encoding, mix rules, timer logic, audio engine interface with a mocked audio context, API validation | Every pull request |
| Integration | Every API endpoint against a real Postgres container, including authorisation and rate limits | Every pull request |
| End-to-end | Play a scene; build and share a mix; sign in with the dev login; save, publish and like a mix; offline reload | Every pull request |
| Smoke | Readiness and one real request on the new revision | Every deploy |

## 13. Build stages

Each stage works on its own and adds one concept. Each ends with a short note in `docs/stages/` explaining what was added and why.

| Stage | Delivers | Concept learned |
|---|---|---|
| 1 | Web app and API running locally in Docker Compose, with licensed sounds | Containers, Compose |
| 2 | Pull-request checks | GitHub Actions |
| 3 | First Azure resources, applied by hand | Terraform plan, apply, state |
| 4 | Deploy pipeline, custom domain, Terraform in the pipeline | Continuous delivery, secrets, federated login |
| 5 | Telemetry, uptime checks, status page, alerts | Observability |

Stage 1 is the largest and is split in the implementation plan: audio engine and mixer, then scenes and share links, then the API and accounts, then gallery and likes, then offline support.

## 14. Costs

| Item | Expected cost |
|---|---|
| Static Web Apps | Free plan: 100 GB bandwidth a month, 250 MB per environment |
| Container Apps | Free monthly grant: 180,000 vCPU-seconds, 360,000 GiB-seconds, 2 million requests |
| Neon Postgres | Free plan |
| GitHub Container Registry, Actions | Free for public repositories |
| Blob Storage | Cents a month at this size |
| Key Vault | Cents a month |
| Application Insights | Within the free allowance, enforced by the daily cap |
| Domain | Expected free for the first year through the Student Pack's domain offer; confirmed at stage 4, with a renewal fee after that |

## 15. Risks and assumptions

- **Student subscription limits.** Azure for Students may restrict regions or services. Stage 3 confirms Container Apps and Static Web Apps are available before anything else is built on them.
- **Free-plan terms change.** Figures in section 14 were checked on 2026-10-03 and should be rechecked at stage 3.
- **Cold starts.** The first API request after idle waits for both the container and the database to wake. The web app's "waking up" state covers this; uptime checks every 15 minutes will record it honestly.
- **Uptime checks wake the API** about 96 times a day. This is well inside the free grant.
- **Scheduled workflows can run late** on GitHub's side, so uptime samples are approximate.
- **Finding good CC0 loops** for all sounds may take time; the catalogue can launch with fewer than 11.
