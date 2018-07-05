import { EditorValues } from '../interfaces';

export interface InstallModulesOptions {
  dir: string;
}

/**
 * Finds npm modules in editor values, returning an array of modules.
 *
 * @param {EditorValues} values
 * @returns {Array<string>}
 */
export async function findModulesInEditors(values: EditorValues): Promise<Array<string>> {
  const files = [ values.main, values.renderer ];
  const modules: Array<string> = [];

  for (const file of files) {
    const fileModules = await findModules(file);
    modules.push(...fileModules);
  }

  return modules;
}

/**
 * Uses a simple regex to find `require()` statements in a string.
 * Tries to exclude electron and Node built-ins as well as file-path
 * references.
 *
 * @param {string} input
 * @returns {Array<string>}
 */
export async function findModules(input: string): Promise<Array<string>> {
  const matchRequire = /require\(['"]{1}([\w\d\/\-\_]*)['"]{1}\)/;
  const matched = input.match(matchRequire);
  const result: Array<string> = [];
  const builtinModules = await import('builtin-modules');

  if (matched && matched.length > 0) {
    const candidates = matched.slice(1);
    candidates.forEach((candidate) => {
      if (candidate === 'electron') return;
      if (builtinModules.indexOf(candidate) > -1) return;
      if (candidate.startsWith('.')) return;
      result.push(candidate);
    });
  }

  return result;
}

/**
 * Installs given modules to a given folder.
 *
 * @param {InstallModulesOptions} { dir }
 * @param {...Array<string>} names
 * @returns {Promise<string>}
 */
export function installModules({ dir }: InstallModulesOptions, ...names: Array<string>): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const { exec } = await import('child_process');
    const args = ['-S'];
    const cliArgs = ['npm i'].concat(args, names).join(' ');

    exec(cliArgs, { cwd: dir }, (error, result) => {
      if (error) {
        reject(error);
      }

      resolve(result.toString());
    });
  });
}