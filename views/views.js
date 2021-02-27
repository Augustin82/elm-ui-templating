import { Elm } from './Main.elm';

globalThis.document.app = Elm.Main.init({
  node: globalThis.document.getElementById('main')
});
