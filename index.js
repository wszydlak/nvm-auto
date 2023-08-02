#!/usr/bin/env node

const https = require('https');
const semver = require('semver');
const process = require('process');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');

const isWindows = os.platform() === 'win32';

const errorExit = (err) => {
	console.error(err.message);
	process.exit(1);
};

const executeNvm = (command, version) => {
	return childProcess.spawnSync(isWindows ? 'nvm' : '. $NVM_DIR/nvm.sh; nvm', [command, version], {
		shell: true,
		stdio: 'inherit',
	});
};

const cwd = process.cwd();

if (fs.existsSync(cwd + '/package.json')) {
	const pkg = require(cwd + '/package.json');

	if (!pkg.engines || !pkg.engines.node) {
		errorExit(new Error("Cannot find supported version of node in 'engines' field of package.json"));
	} else {
		https
			.get('https://nodejs.org/dist/index.json', (response) => {
				let data = '';
				response.on('data', (chunk) => {
					data += chunk;
				});

				response.on('end', () => {
					try {
						const versions = JSON.parse(data).map(({ version }) =>
							version.startsWith('v') ? version.substring(1) : version
						);
						const version = semver.maxSatisfying(versions, pkg.engines.node);

						if (version) {
							executeNvm('install', version.toString());
							if (isWindows) {
								executeNvm('use', version.toString());
							}
						} else {
							throw new Error('Cannot find supported version of node@' + pkg.engines.node);
						}
					} catch (err) {
						errorExit(err);
					}
				});
			})
			.on('error', (err) => {
				errorExit(err);
			});
	}
} else {
	errorExit(new Error('No package.json file found in current working directory'));
}
