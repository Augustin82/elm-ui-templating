import { Script } from 'vm';

import * as fs from 'fs-extra';
import { JSDOM } from 'jsdom';

export function initElmEngine() {
  const elmAppPath = './views/view.js';
  const html =
    '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<script type="module">import hotwiredTurbo from "https://cdn.skypack.dev/@hotwired/turbo";</script>' +
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
    const script = new Script(`${elmApp}`);
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
  function render({ page, params }) {
    const local = `window.elmApp.ports.changePage.send(${JSON.stringify({
      page,
      ...params
    })});`;
    new Script(local).runInContext(vmContext);
    return new Promise((resolve) => {
      dom.window.requestAnimationFrame(() =>
        resolve(dom.window.document.body.innerHTML)
      );
    });
  }
  return { render };
}
