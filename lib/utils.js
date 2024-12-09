import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { platform } from 'node:os';
import { maxSatisfying } from 'semver';

const NODE_INDEX = 'https://nodejs.org/dist/index.json';

const isWindows = platform() === 'win32';

function executeNvm(command, version) {
    return spawnSync(isWindows ? 'nvm' : '. $NVM_DIR/nvm.sh; nvm', [command, version], {
        shell: true,
        stdio: 'inherit',
    });
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function getRequestedVersion(path) {
    try {
        await access(path);
    } catch (err) {
        throw new Error('No package.json file found in current working directory');
    }

    /**
     * @type {string | undefined}
     */
    let enginesVersion;

    try {
        const pkg = JSON.parse(await readFile(path, 'utf-8'));
        enginesVersion = pkg?.engines?.node;
    } catch {}

    if (enginesVersion === undefined) {
        throw new Error('Cannot find supported version of node in engines field of package.json');
    }

    return enginesVersion;
}

export async function findSatisfyingVersion(requestedVersion) {
    /**
     * @type {Array<{version: string}> | undefined}
     */
    let indexJson;

    const response = await fetch(NODE_INDEX).catch((error) => {
        throw new Error(`Fetching ${NODE_INDEX} unknown error: ${error.message}`);
    });

    if (!response.ok) {
        throw new Error(`Fetching ${NODE_INDEX} error: [${response.status}] ${response.statusText}`);
    }

    indexJson = await response.json().catch((error) => {
        throw new Error(`${NODE_INDEX} parsing error: ${error.message}`);
    });

    if (!Array.isArray(indexJson)) {
        throw new Error(`${NODE_INDEX} invalid format: expected array, received: ${typeof indexJson}`);
    }

    const versions = indexJson.map(({ version }) => (version.startsWith('v') ? version.substring(1) : version));

    const version = maxSatisfying(versions, requestedVersion);

    if (!version) {
        throw new Error(`Cannot find supported version of node@${requestedVersion}`);
    }

    return String(version);
}

/**
 * @param {string} version
 * @returns {Promise<void>}
 */
export async function switchNodeVersion(version) {
    const isWindows = platform() === 'win32';
    executeNvm('install', version);
    if (isWindows) {
        executeNvm('use', version);
    }
}
