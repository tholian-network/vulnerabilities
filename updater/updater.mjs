#!/usr/bin/env node

import process from 'process';

import { console     } from './extern/base.mjs';
import { Updater     } from './source/Updater.mjs';
import { ENVIRONMENT } from './source/ENVIRONMENT.mjs';



const show_help = () => {

	console.info('');
	console.info('Tholian Vulnerabilities Updater (node.js build)');
	console.info('');

	console.log('');
	console.log('Usage: updater [Action] [--Flag=Value...]');
	console.log('');
	console.log('Available Actions:');
	console.log('');
	console.log('    Action     | Description                                    ');
	console.log('    -----------|------------------------------------------------');
	console.log('    update     | Updates vulnerabilities from online Security Tracker data.');
	console.log('    merge      | Merges vulnerabilities from local Security Tracker data.');
	console.log('');
	console.log('Available Flags:');
	console.log('');
	console.log('    Flag       | Default | Values           | Description                                                                   ');
	console.log('    -----------|---------|------------------|-------------------------------------------------------------------------------');
	console.log('    --debug    | false   | true, false      | Enable/Disable debugging messages. Defaulted with false.                      ');
	console.log('    --database | null    | "(Folder Path)"  | Overrides the Vulnerabilities database path. Defaulted with null.             ');
	console.log('    --trackers | ()      | "(Tracker Name)" | If set, uses the comma-separated list of Security Trackers. Defaulted with ().');
	console.log('');
	console.log('Examples:');
	console.log('');
	console.log('    updater update;');
	console.log('    updater merge --trackers="Debian,Archlinux"');
	console.log('');
	console.log('    updater update --debug=true --database=/tmp/vulnerabilities;');
	console.log('');

};



if (ENVIRONMENT.action === 'update') {

	let updater = new Updater({
		action:   'update',
		database: ENVIRONMENT.flags.database || null,
		debug:    ENVIRONMENT.flags.debug    || false,
		trackers: ENVIRONMENT.flags.trackers.length > 0 ? ENVIRONMENT.flags.trackers : Updater.TRACKERS
	});

	updater.on('disconnect', (result) => {
		process.exit(result === true ? 0 : 1);
	});

	updater.connect();

} else if (ENVIRONMENT.action === 'merge') {

	let updater = new Updater({
		action:   'merge',
		database: ENVIRONMENT.flags.database || null,
		debug:    ENVIRONMENT.flags.debug    || false,
		trackers: ENVIRONMENT.flags.trackers.length > 0 ? ENVIRONMENT.flags.trackers : Updater.TRACKERS
	});

	updater.once('disconnect', (result) => {
		process.exit(result === true ? 0 : 1);
	});

	updater.connect();

} else {

	show_help();
	process.exit(1);

}

