# Discord review bot

`discord_review_bot.py` watches the "review-request" forum channel. When a
thread is opened, the bot works out which stories are meant: explicit story
links if present, otherwise a Codex intent classification of the free-text
request ("please check sets 1 and 2", "finished set 14 of Czech", …) against
the course list — which may also conclude the thread is not a review request
at all (no_action, logged but silent).

It then runs the automatic story checks (the editor lint, executed
server-side via the Convex endpoint `/discord/review-stories`) and replies
**set by set**: clean sets get a one-line pass notice with story links; at
the first set with findings it posts the full per-story details (line
numbers link straight into the editor via `?line=`) and pauses with a
"post `recheck` and I will continue" note, so long requests don't drown in
comments. Optionally an AI review (Codex CLI) follows for the stories of the
paused set, clearly labeled. Posting `recheck` re-runs everything and
naturally continues where work is left.

It is a separate process from `discord_reacting_bot.py` on purpose: a crash or
hang here must never affect role syncing.

## Setup

`.env.local` in this directory needs:

```
DISCORD_TOKEN=...                # bot token (may be the same bot user)
CONVEX_REVIEW_URL=https://posh-caribou-319.convex.site/discord/review-stories
DISCORD_REVIEW_SECRET=...        # must match the Convex env var of the same name
ENABLE_AI_REVIEW=0               # set to 1 once the Codex CLI is set up
CODEX_MODEL=gpt-5.5              # optional
AI_REVIEW_MAX_STORIES=3          # optional, AI reviews per thread
AI_REVIEW_TIMEOUT_SECONDS=900    # optional
AI_REVIEW_CONCURRENCY=1          # optional, simultaneous codex processes
REVIEW_COOLDOWN_SECONDS=60       # optional, per-user trigger cooldown
INTENT_TIMEOUT_SECONDS=180       # optional, intent-classification timeout
```

Set the matching secret on the Convex prod deployment:

```
pnpm exec convex env set DISCORD_REVIEW_SECRET <secret> --prod
```

The bot reads the review checklists from `../docs/review-checklists/`, so run
it from an up-to-date checkout of this repository.

For the AI review, the `codex` CLI must be installed and authenticated for the
user running the bot.

## Security notes

- The AI review feeds *untrusted story text* into the Codex CLI, so all
  codex invocations run with `--disable shell_tool`: codex has no
  command-execution tool at all and cannot read local files, which makes
  prompt injection in story text unable to exfiltrate anything from the
  machine. Codex also runs with an isolated `CODEX_HOME`
  (`discord_roles/.codex_home`, created automatically with a minimal config
  and a symlink to the real `auth.json`), so the user's own
  `~/.codex/config.toml` — including any MCP servers that would reintroduce
  tools — is never inherited. `--sandbox read-only` and an empty working
  directory remain as additional layers. Because of this, running under a
  normal user is acceptable; a dedicated unix user is still nice-to-have
  defense in depth.
- A spend cap on the Codex account is still recommended as a general
  abuse backstop.
- Bot output is scrubbed for every value from `.env.local` before posting,
  all messages are sent with `AllowedMentions.none()` (injected `@everyone`
  cannot ping), and error details only go to the bot log channel.
- Abuse limits: one review at a time per thread, a per-user cooldown
  (`REVIEW_COOLDOWN_SECONDS`), at most `AI_REVIEW_CONCURRENCY` codex
  processes at once, and at most 30 stories (8 sets) per request (also
  enforced server-side by the Convex endpoint).

## systemd example

```
[Unit]
Description=Duostories Discord review bot
After=network-online.target

[Service]
User=duostories-review-bot
WorkingDirectory=/home/duostories-review-bot/unofficial-duolingo-stories/discord_roles
ExecStart=/usr/bin/python3 discord_review_bot.py
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
```
