# StreamPulse — submission preparation

**Team:** Asiya Ali and Taaha Younas. Open to additional frontend, Twitch/OBS and QA teammates.

**Pitch:** Let Twitch chat choose what happens next. StreamPulse pairs an interactive poll overlay with a creator studio and honest connection diagnostics.

## Inspiration

Live participation loses its value when a creator cannot tell whether an overlay has stopped receiving updates. We combined audience polls and application connection visibility in a lightweight local tool, using networking and telecommunications concepts alongside a clear visual interface.

## What it does

Creators start a poll and viewers vote using Twitch chat commands. Results update in an OBS browser overlay. One viewer has one changeable vote, and the creator can close the poll. The studio shows connection state, connected clients and measured browser-to-server round-trip time. Reconnection uses bounded exponential backoff.

## How we built it

Node.js, the ws library, HTTP, Twitch IRC-over-WebSocket, HTML, CSS and browser JavaScript. Codex helped implement the server, poll model, reconnect logic, dashboard, overlay and tests. This work is recorded in Codex session `01a1780b-74ca-7183-a0ea-c332d1c04f6d`.

## Honest validation status

Local polling, simulated voting, overlay broadcasts and heartbeat messages are tested. Read-only Twitch chat connection was verified against twitchdev. A real viewer vote on the team's channel and actual OBS-to-Twitch broadcast are still required before claiming complete Twitch demonstration.

## Under-three-minute video plan

- 0:00–0:20: Explain the audience problem and show the studio.
- 0:20–0:45: Show Codex building the project and the code/test results. Record actual footage, not a fabricated conversation.
- 0:45–1:30: On a real Twitch broadcast, launch a fresh poll, send votes from real viewer accounts and show the overlay updating on Twitch.
- 1:30–2:10: Change one viewer's vote, end the poll, demonstrate the connection display and explain app RTT versus video latency.
- 2:10–2:40: Show setup, repository and scope; mention in-memory prototype limitations.

## Remaining submission requirements

- Public YouTube video under 3 minutes with real Twitch operation and Codex build footage.
- Complete source repository with installation instructions.
- English description and Codex session ID.
- Judge-access instructions: clone repo and run locally without a paid service.
- Final review of entry and confirmation before submission.

**Deadline:** 3 November 2026, 03:00 Pakistan time (2 November, 14:00 PST).
