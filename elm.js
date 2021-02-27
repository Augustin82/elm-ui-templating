#!/usr/bin/env node

/* eslint-env node */

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Remove --debug from an argument list to disable the Elm debugger.
 *
 * @param arguments An array of command-line arguments.
 * @returns A modified list of arguments.
 */
function disableDebug(arguments) {
  return arguments.filter((arg) => arg != '--debug');
}

/**
 * Add --optimize to an argument list to enable Elm compiler optimisations
 * (implies disableDebug).
 *
 * @param arguments An array of command-line arguments.
 * @returns A modified list of arguments.
 */
function enableOptimize(arguments) {
  return [...disableDebug(arguments), '--optimize'];
}

/**
 * Keep only those arguments that elm-optimize-level-2 accepts (input and output
 * file names).
 *
 * @param arguments An array of command-line arguments.
 * @returns A modified list of arguments.
 */
function inputAndOutputOnly(arguments) {
  return arguments.filter(
    (arg) => arg.endsWith('.elm') || arg == '--output' || arg.endsWith('.js')
  );
}

/**
 *
 * @param arguments An array of command-line arguments.
 * @returns The string path to the output JavaScript file, or undefined if no
 * output file is specified.
 */
function getOutputFile(arguments) {
  return arguments.find((arg) => arg.endsWith('.js'));
}

/**
 * Determine what to actually run based on the desired optimisation level.
 *
 * @param optimizationLevel One of the optimisation level constants:
 * "DISABLE_DEBUG", "ENABLE_OPTIMIZE" or "ELM_OPTIMIZE_LEVEL_2". If anything
 * else, the Elm compiler will be invoked as normal without any changes.
 * @param elm Path to the Elm compiler.
 * @param elmOptimizeLevel2 Path to elm-optimize-level-2.
 * @param originalArguments Original arguments passed to Elm (by Parcel etc.).
 * @returns An object with 'executable' and 'arguments' fields that can be
 * passed to process.spawn() or similar.
 */
function proxy(
  optimizationLevel,
  { elm, elmOptimizeLevel2, originalArguments }
) {
  switch (optimizationLevel) {
    case 'DISABLE_DEBUG':
      return {
        executable: elm,
        arguments: disableDebug(originalArguments)
      };

    case 'ENABLE_OPTIMIZE':
      return {
        executable: elm,
        arguments: enableOptimize(originalArguments)
      };

    case 'ELM_OPTIMIZE_LEVEL_2':
      return {
        executable: elmOptimizeLevel2,
        arguments: inputAndOutputOnly(originalArguments)
      };

    default:
      return {
        executable: elm,
        arguments: originalArguments
      };
  }
}

/**
 * Remove the elm-proxy directory from a PATH variable value.
 *
 * @param originalPath Original (current) value of the PATH variable.
 * @returns A modified PATH string.
 */
function removeElmProxyFromPath(originalPath) {
  return originalPath
    .split(path.delimiter)
    .filter((entry) => !entry.includes('elm-proxy'))
    .join(path.delimiter);
}

/**
 * Post-process resulting JS so that elm-hot works properly. This is needed
 * since elm-optimize-level-2 reformats the output JavaScript slightly.
 *
 * @param output A string of JavaScript output from elm-optimize-level-2.
 * @returns A string of modified output.
 */
function fixupForElmHot(output) {
  // Relevant code from elm-hot (in inject.js):
  //
  //   // attach a tag to Browser.Navigation.Key values. It's not really fair to call this a hack
  //   // as this entire project is a hack, but this is evil evil evil. We need to be able to find
  //   // the Browser.Navigation.Key in a user's model so that we do not swap out the new one for
  //   // the old. But as currently implemented (2018-08-19), there's no good way to detect it.
  //   // So we will add a property to the key immediately after it's created so that we can find it.
  //   const navKeyDefinition = "var key = function() { key.a(onUrlChange(_Browser_getUrl())); };";
  //   const navKeyTag = "key['elm-hot-nav-key'] = true";
  //   modifiedCode = originalElmCodeJS.replace(navKeyDefinition, navKeyDefinition + "\n" + navKeyTag);
  //   if (modifiedCode === originalElmCodeJS) {
  //       throw new Error("[elm-hot] Browser.Navigation.Key def not found. Version mismatch?");
  //   }
  //
  // elm-optimize-level-2 adds a space after 'function' in its output, so the
  // above replace operation fails.
  const originalString =
    'var key = function () { key.a(onUrlChange(_Browser_getUrl())); };';
  const replacementString =
    'var key = function() { key.a(onUrlChange(_Browser_getUrl())); };';
  return output.replace(originalString, replacementString);
}

// Find path to node_modules directory
let nodeModules = path.resolve(__dirname, '..', '..', 'node_modules');

// Find the path the actual Elm compiler binary
let elm = path.resolve(nodeModules, 'elm', 'bin', 'elm');

// Find the path to elm-optimize-level-2
let elmOptimizeLevel2 = path.resolve(
  nodeModules,
  'elm-optimize-level-2',
  'bin',
  'elm-optimize-level-2.js'
);

// Drop the first two command-line arguments ('node' and the path to this script
// file itself)
let originalArguments = process.argv.slice(2);

// Choose what to actually run based on the current optimisation level
let optimizationLevel = process.env.ELM_PROXY_OPTIMIZATION_LEVEL;
let { executable, arguments } = proxy(optimizationLevel, {
  elm: elm,
  elmOptimizeLevel2: elmOptimizeLevel2,
  originalArguments: originalArguments
});

// Remove the elm-proxy directory from the PATH to avoid weird cyclical calls
// (e.g. if elm-optimize-level-2 calling back into this script instead of the
// Elm compiler itself).
let modifiedEnv = {
  ...process.env,
  PATH: removeElmProxyFromPath(process.env.PATH)
};

// Actually run the chosen executable with the (possibly modified) arguments
let { status } = child_process.spawnSync(executable, arguments, {
  stdio: 'inherit',
  env: modifiedEnv
});

// Post-process the output file so elm-hot works properly (only necessary when
// using elm-optimize-level-2, since it reformats the output slightly in a way
// that confuses elm-hot)
const outputFile = getOutputFile(arguments);
if (outputFile && executable == elmOptimizeLevel2) {
  const contents = fs.readFileSync(outputFile, { encoding: 'utf8' });
  const modifiedContents = fixupForElmHot(contents);
  fs.writeFileSync(outputFile, modifiedContents, { encoding: 'utf8' });
}

// Exit with the status code from whatever executable was run
process.exit(status);
