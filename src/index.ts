export * from './lib/async';
export * from './lib/number';
import express from 'express';
import WebSocket from 'ws';

import { initElmEngine } from './lib/renderElm.js';
const elmEngine = initElmEngine();

const app = express();

const PORT = process.env.PORT || 4000;

const wss = new WebSocket.Server({ noServer: true, handleProtocols: true });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});

app.get('/', (_req, res) => res.send('Hello from server!'));

app.get('/default/:text', async (req, res) => {
  const text = req.params.text;
  const content = await elmEngine.render({ page: 'default', params: { text } });

  res.send(content);
});

app.get('/default', async (_req, res) => {
  const html =
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<script>window.test = "hey";</script>' +
    '<script type="module">import hotwiredTurbo from "https://cdn.skypack.dev/@hotwired/turbo";</script>' +
    '</head><body>' +
    '<div id="main">' +
    'Plain HTML!' +
    '<a href="/default/blah" data-turbo-action="advance">Show me blah!</a>' +
    '</div></body></html>';
  res.send(html);
});

const server = app.listen(PORT, () =>
  console.log(`⚡Server is running here 👉 http://localhost:${PORT}`)
);

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});
