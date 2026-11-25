const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('mr-davies signalling server');
});
const wss = new WebSocket.Server({ server });

// rooms: Map<roomId, Map<peerId, ws>>
const rooms = new Map();

function send(ws, obj) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }

wss.on('connection', (ws) => {
  ws.roomId = null;
  ws.peerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'join': {
        const { roomId, peerId, password } = msg;
        ws.roomId = roomId; ws.peerId = peerId;
        if (!rooms.has(roomId)) rooms.set(roomId, new Map());
        const room = rooms.get(roomId);
        // send existing peers to joiner
        send(ws, { type: 'joined', peers: [...room.keys()] });
        // notify others
        for (const [pid, pws] of room) {
          send(pws, { type: 'peer-joined', peerId });
        }
        room.set(peerId, ws);
        break;
      }
      case 'signal': {
        const room = rooms.get(ws.roomId);
        if (!room) return;
        const target = room.get(msg.target);
        if (target) send(target, { type: 'signal', from: ws.peerId, signal: msg.signal });
        break;
      }
      case 'set-password': { break; }
      case 'delete-room': {
        const room = rooms.get(ws.roomId);
        if (room) {
          for (const [pid, pws] of room) {
            if (pws !== ws) send(pws, { type: 'room-deleted' });
          }
          rooms.delete(ws.roomId);
        }
        break;
      }
      case 'close-room': { break; }
      case 'list-rooms': {
        send(ws, { type: 'room-list', rooms: [...rooms.keys()] });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.roomId) return;
    const room = rooms.get(ws.roomId);
    if (!room) return;
    room.delete(ws.peerId);
    for (const [pid, pws] of room) {
      send(pws, { type: 'peer-left', peerId: ws.peerId });
    }
    if (room.size === 0) rooms.delete(ws.roomId);
  });
});

server.listen(PORT, () => console.log('mr-davies signalling server on port', PORT));
