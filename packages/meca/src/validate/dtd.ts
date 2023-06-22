import fs, { createReadStream } from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import which from 'which';
import { makeExecutable, writeFileToFolder } from 'myst-cli-utils';
import chalk from 'chalk';
import type { ISession } from '../types.js';

/**
 * Test if xmllint is available as a cli command
 */
function isXmllintAvailable() {
  return which.sync('xmllint', { nothrow: true });
}

/**
 * Check if JATS file is valid based on JATS version/library/etc.
 *
 * Returns true if valid and false if invalid.
 */
export async function validateJatsAgainstDtd(
  session: ISession,
  file: string,
  localDtdFile: string,
) {
  if (!isXmllintAvailable()) {
    session.log.error(
      `MECA validation against DTD requires xmllint\n\n${chalk.dim(
        'To install:\n  mac:    brew install xmlstarlet\n  debian: apt install libxml2-utils',
      )}`,
    );
    return;
  }

  try {
    // First drop DOCTYPE with DTD in it - we have already fetched the DTD
    const dropDtdCommand = `xmllint --dropdtd`;
    const validateCommand = `xmllint --noout --dtdvalid ${localDtdFile}`;
    await makeExecutable(`${dropDtdCommand} ${file} | ${validateCommand} -`, session.log)();
  } catch {
    return false;
  }
  return true;
}

/**
 * Check if MECA file is valid based on MECA version/library/etc.
 *
 * Logs confirmation message if valid and throws an error if invalid.
 */
export async function validateMecaAgainstDtd(
  session: ISession,
  file: string,
  localDtdFile: string,
) {
  const success = await validateJatsAgainstDtd(session, file, localDtdFile);
  if (success) {
    session.log.info(chalk.greenBright('JATS validation passed!'));
  } else {
    throw new Error('JATS validation failed.');
  }
}
