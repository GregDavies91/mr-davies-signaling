# mr-davies signalling server

Dedicated WebRTC signalling server for mr-davies classroom projects (3D classroom, revision games, etc.).

## Deploy on Render

1. New → Web Service → connect this repo (`GregDavies91/mr-davies-signaling`)
2. Runtime: Node
3. Build command: `npm install`
4. Start command: `npm start`
5. Deploy

The `npm start` script runs `node server.js`. Render injects `PORT` automatically; the server listens on that port.

## Config for your classroom front-end

Set `signalingServer` in your classroom `config.js` to the wss URL Render gives you, e.g.:

```js
signalingServer: "wss://mr-davies-signaling.onrender.com"
```

The server exposes a plain WebSocket at the root path. No auth on connections themselves — room passwords are optional and set by the first peer to join a room ID.

## Protocol

- `join { roomId, peerId, password }` — join/create a room
- `signal { target, signal }` — relay WebRTC SDP/ICE to a peer in the same room
- `set-password { password }` — first joiner locks the room
- `delete-room` — creator nukes the room for everyone
- `list-rooms` — list active room IDs
