import { Script } from 'vm';

import * as fs from 'fs-extra';
import { JSDOM } from 'jsdom';

const elmAppPath = './views/view.js';
const html =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
  '</head><body>' +
  '<div id="main">' +
  '</div></body></html>';
const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const vmContext = dom.getInternalVMContext();
try {
  const elmApp = fs.readFileSync(elmAppPath, 'utf8');
  const starter =
    'var app = Elm.Main.init({' +
    '  node: document.getElementById("main"),' +
    '});';
  const script = new Script(`${elmApp}\n${starter}`);
  script.runInContext(vmContext);
} catch (err) {
  console.log(err);
}

/**
 * renderElmApp.
 *
 * @param {Record<string, any>} params
 * @returns {Promise<string>}
 */
export function renderElmApp(params) {
  const local = `app.ports.changePage.send(${JSON.stringify(params)});`;
  new Script(local).runInContext(vmContext);
  return new Promise((resolve) => {
    dom.window.requestAnimationFrame(() =>
      resolve(dom.window.document.body.innerHTML)
    );
  });
}
