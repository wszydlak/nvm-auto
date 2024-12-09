import { resolve } from 'node:path';
import { cwd, exit } from 'node:process';
import { findSatisfyingVersion, getRequestedVersion, switchNodeVersion } from './utils.js';

export async function main() {
    try {
        const requestedVersion = await getRequestedVersion(resolve(cwd(), 'package.json'));
        const satisfyingVersion = await findSatisfyingVersion(requestedVersion);

        await switchNodeVersion(satisfyingVersion);
    } catch (error) {
        console.error(error);
        exit(1);
    }
}
