# StreamPulse

A local-first interactive Twitch poll overlay and connection dashboard, built for the Codex × TwitchCon Hackathon by team Asiya Ali and Taaha Younas.

## Run

Requires Node.js 22 or later.

```sh
npm install
npm start
```

Open the **private studio URL** printed in the terminal. Its randomly generated token unlocks creator controls; keep that URL private. The token is removed from the address bar and retained in browser session storage. Open `http://127.0.0.1:4317/overlay` as an OBS Browser Source, width 960, height 540. The overlay background is transparent. OBS and the server must run on the same computer. Public hosting is not required for this workflow.

1. Enter your Twitch channel name and connect. The dashboard confirms when the chat room has joined.
2. Write a question and 2–4 answers, then launch a poll.
3. Viewers vote in Twitch chat with `!vote 1` through `!vote 4`. Each Twitch user has one vote and can change it.
4. End the poll to freeze results. Start a new poll to clear all votes.
5. Use **Simulate** buttons to rehearse offline. These synthetic votes count in the displayed totals: start a fresh poll before a real broadcast.

## Networking design

- A Node HTTP/WebSocket service broadcasts a shared poll state to studio and OBS clients.
- Browser heartbeats measure application round-trip time, **not Twitch video latency or internet packet loss**.
- WebSocket ping/pong detects dead clients. Browser and Twitch connections reconnect with bounded exponential backoff.
- Twitch chat is read-only; the app does not post messages or request moderation privileges.
- An anonymous read-only chat connection was verified against the `twitchdev` channel during development. Twitch officially documents authenticated IRC. For channels/environments requiring authentication, set `TWITCH_USERNAME` and `TWITCH_OAUTH_TOKEN` in the process environment before starting; use a Twitch user access token with the relevant chat scopes. Never commit a token. See https://dev.twitch.tv/docs/chat/irc/.

## Security and limitations

The server binds only to `127.0.0.1`. Creator mutations require a random per-process bearer token. WebSocket connections validate browser Origin. Chat contents and usernames are not retained; numeric Twitch IDs are held in memory solely to deduplicate active-poll votes and are never sent to overlays. Everything resets on server restart. Do not expose this development server through a public tunnel: production hosting requires accounts, durable storage, TLS and per-channel access control. This is a one-creator prototype, not a hosted multi-tenant service.

The app can run without external fonts; optional Google Fonts have system fallbacks. No paid AI runtime or API key is required. Codex is the development tool, not an invented runtime AI component.

## Checks

```sh
npm test
```

Tests cover unique and changed votes, closed polls, malformed inputs, IRC command parsing, HTTP authorization, WebSocket broadcasts and heartbeat round-trip messages. Real chat votes, vote changes and closed-poll rejection were verified on asiyaali08. A live 720p Twitch broadcast of the browser overlay was verified and captured on asiyaali08 using FFmpeg. OBS itself was not used for this test.

## Hackathon evidence

Built during the event submission period with OpenAI Codex. Codex session: `01a1780b-74ca-7183-a0ea-c332d1c04f6d`.

See `docs/SUBMISSION.md` for the project description and demo script. Submitted entry: https://devpost.com/software/streampulse-jwk5d7. Public demo: https://www.youtube.com/watch?v=SBq0YpMLI3I. The video includes real Twitch playback and a source walkthrough explaining Codex use; direct Codex-app recording was unavailable and is disclosed in the entry.

MIT license.
