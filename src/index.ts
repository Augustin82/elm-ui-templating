export * from './lib/async';
export * from './lib/number';
import express from 'express';

import { initElmEngine } from './lib/renderElm.js';
const elmEngine = initElmEngine();

const app = express();

const PORT = process.env.PORT || 4000;

app.get('/', (_req, res) => res.send('Hello from server!'));

app.get('/default/:text', async (req, res) => {
  const text = req.params.text;
  const content = await elmEngine.render({ page: 'default', params: { text } });

  res.send(content);
});

app.get('/default', async (_req, res) => {
  const html =
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '</head><body>' +
    '<div id="main">' +
    'Plain HTML!' +
    '</div></body></html>';
  res.send(html);
});

app.listen(PORT, () =>
  console.log(`⚡Server is running here 👉 http://localhost:${PORT}`)
);
