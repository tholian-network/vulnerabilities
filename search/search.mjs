#!/usr/bin/env node

import fs      from 'fs';
import path    from 'path';
import process from 'process';
import url     from 'url';

import { console, isArray } from './extern/base.mjs';



const isPunctuation = (chr) => {

	if (chr === ';') {
		return true;
	} else if (chr === ',') {
		return true;
	} else if (chr === '/') {
		return true;
	} else if (chr === '(') {
		return true;
	} else if (chr === ')') {
		return true;
	} else if (chr === '!') {
		return true;
	} else if (chr === '?') {
		return true;
	} else if (chr === '.') {
		return true;
	}

	return false;

};


const ROOT     = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../');
const KEYWORDS = (() => {

	let keywords = [];

	let args = Array.from(process.argv.slice(2));
	if (args.length === 1 && args[0].endsWith('.txt')) {

		let buffer = null;

		try {
			buffer = fs.readFileSync(args[0]);
		} catch (err) {
			buffer = null;
		}

		if (buffer !== null) {

			buffer.toString('utf8').trim().split('\n').forEach((line) => {

				let word = line.trim();
				if (word !== '') {
					keywords.push(word);
				}

			});

		}

	} else {

		args.forEach((arg) => {

			let word = arg.trim();
			if (word !== '') {
				keywords.push(word);
			}

		});

	}

	return keywords;

})();



const show_help = () => {

	console.info('');
	console.info('Tholian Vulnerabilities Database Search');
	console.info('');

	console.log('');
	console.log('Usage: search [Keyword or Keywords.txt]');
	console.log('');
	console.log('Usage Notes:');
	console.log('');
	console.log('    This search tool will iterate over each keyword and return the fuzzy-matched CVEs.');
	console.log('');
	console.log('Examples:');
	console.log('');
	console.log('    search "Microsoft"');
	console.log('    search "buffer overflow"');
	console.log('    search ./path/to/keywords.txt');
	console.log('');

};

if (KEYWORDS.length > 0) {

	console.log('Searching for ' + KEYWORDS.length + ' keywords ...');

	fs.readdir(ROOT + '/vulnerabilities', (err, filenames) => {

		if (err === null) {

			let results = {};

			filenames.filter((file) => {
				return file.startsWith('CVE-') && file.endsWith('.json');
			}).map((file) => {

				let cve = null;

				try {
					cve = JSON.parse(fs.readFileSync(ROOT + '/vulnerabilities/' + file).toString('utf8'));
				} catch (err) {
					cve = null;
				}

				return cve;

			}).filter((cve) => {
				return cve !== null;
			}).forEach((cve) => {

				let text = cve.description.toLowerCase();

				KEYWORDS.forEach((keyword) => {

					let matches = false;

					let index = text.indexOf(keyword.toLowerCase());
					if (index !== -1) {

						let chunk = text.substr(index - 1, keyword.length + 1).trim();
						if (chunk.length === keyword.length) {

							matches = true;

						} else {

							if (chunk.startsWith(keyword.toLowerCase())) {
								matches = isPunctuation(chunk.substr(keyword.length));
							} else if (chunk.endsWith(keyword.toLowerCase())) {
								matches = isPunctuation(chunk.substr(0, 1));
							}

						}

					}

					if (matches === true) {

						if (isArray(results[cve.id]) === false) {
							results[cve.id] = [];
						}

						if (results[cve.id].includes(keyword) === false) {
							results[cve.id].push(keyword);
						}

					}

				});

			});

			if (Object.keys(results).length > 0) {

				Object.keys(results).sort().forEach((cve_id) => {

					let keywords = results[cve_id];

					console.warn(cve_id + ': matches "' + keywords.join('"," ') + '"');

				});

				process.exit(0);

			} else {

				console.warn("No CVEs match the given keywords.");
				process.exit(0);

			}

		}

	});

} else {

	show_help();
	process.exit(1);

}

