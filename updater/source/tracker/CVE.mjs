
import child_process from 'child_process';

import { console, Emitter, isArray, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                   } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                    } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities            } from '../../source/Vulnerabilities.mjs';



const DISPUTED = [
	'** DISPUTED **',
	'** UNVERIFIABLE **',
	'** UNVERIFIABLE, PRERELEASE **',
	'** PRODUCT NOT SUPPORTED WHEN ASSIGNED **',
	'** UNSUPPORTED WHEN ASSIGNED **'
];

const SEVERITY = [
	'critical',
	'high',
	'medium',
	'low'
];

const STATE = [
	'published',
	'disputed',
	'rejected',
	'invalid'
];



const toIdentifier = function(name) {

	if (name.startsWith('CVE-') === true) {

		if (name.endsWith('.json') === true) {
			name = name.substr(0, name.length - 5);
		}

		let check = name.split('-');
		if (
			check.length === 3
			&& check[0] === 'CVE'
			&& /^([0-9]{4})$/g.test(check[1]) === true
			&& /^([0-9]+)$/g.test(check[2]) === true
		) {
			return check.slice(0, 3).join('-');
		}

	}

	return null;

};

const toVersions = function(data) {

	data = isArray(data) ? data : [];


	let versions = [];

	data.forEach((entry) => {

		if (
			isObject(entry) === true
			&& isString(entry['status']) === true
			&& isString(entry['version']) === true
			&& entry['status'] === 'affected'
		) {

			if (
				entry['versionType'] === 'custom'
				&& isString(entry['lessThanOrEqual']) === true
				&& entry['lessThanOrEqual'] !== 'n/a'
				&& entry['lessThanOrEqual'] !== 'unspecified'
			) {

				versions.push('<= ' + entry['lessThanOrEqual']);

			} else if (
				entry['versionType'] === 'custom'
				&& isString(entry['lessThan']) === true
				&& entry['lessThan'] !== 'n/a'
				&& entry['lessThan'] !== 'unspecified'
			) {

				versions.push('< ' + entry['lessThan']);

			} else if (
				entry['versionType'] === 'custom'
				&& isString(entry['version']) === true
				&& entry['version'] !== 'n/a'
				&& entry['version'] !== 'unspecified'
			) {

				versions.push(entry['version']);

			} else if (
				isString(entry['version']) === true
				&& entry['version'] !== 'n/a'
				&& entry['version'] !== 'unspecified'
			) {

				versions.push(entry['version']);

			}

		}

	});

	return versions;

};

const merge = function(vulnerability, data) {

	if (
		isObject(data) === true
		&& isString(data['dataType']) === true
		&& data['dataType'] === 'CVE_RECORD'
		&& isString(data['dataVersion']) === true
		&& data['dataVersion'] === '5.0'
	) {

		if (isString(data['cveMetadata']['state']) === true) {

			if (data['cveMetadata']['state'] === 'PUBLISHED') {
				vulnerability['state'] = 'published';
			} else if (data['cveMetadata']['state'] === 'REJECTED') {
				vulnerability['state'] = 'rejected';
			}

		}

		if (isArray(data['containers']['cna']['descriptions']) === true) {

			let descriptions = data['containers']['cna']['descriptions'].filter((desc) => desc['lang'] === 'en');
			if (descriptions.length > 0) {
				vulnerability['description'] = descriptions.map((desc) => desc['value'].trim()).join('\n');
				vulnerability['description'] = vulnerability['description'].trim();
			}

		}

		if (isArray(data['containers']['cna']['affected']) === true) {

			let affected_description = '';

			data['containers']['cna']['affected'].forEach((affected) => {

				if (
					isObject(affected) === true
					&& isString(affected['vendor']) === true
					&& isString(affected['product']) === true
					&& isArray(affected['versions']) === true
				) {

					let versions = toVersions(affected['versions']);

					if (
						affected['product'] !== 'n/a'
						&& versions.length > 0
					) {
						affected_description += 'Affected: ' + affected['vendor'] + ' ' + affected['product'] + ' ' + versions.join(', ') + '\n';
					}

				}

			});

			if (affected_description.length > 0 && vulnerability['description'].includes(affected_description) === false) {
				vulnerability['description'] += '\n\n' + affected_description;
				vulnerability['description']  = vulnerability['description'].trim();
				vulnerability['state']        = 'invalid';
			}

		}

		if (isArray(data['containers']['cna']['metrics']) === true) {

			let metric = data['containers']['cna']['metrics'][0] || null;
			if (
				isObject(metric) === true
				&& isObject(metric['other']) === true
				&& isObject(metric['other']['content']) === true
				&& isString(metric['other']['content']['other']) === true
				&& SEVERITY.includes(metric['other']['content']['other']) === true
			) {
				vulnerability['severity'] = metric['other']['content']['other'];
			}

		}

		if (isArray(data['containers']['cna']['references']) === true) {

			data['containers']['cna']['references'].forEach((ref) => {

				if (
					isObject(ref) === true
					&& isString(ref['url']) === true
					&& (
						ref['url'].startsWith('ftps://')
						|| ref['url'].startsWith('ftp://')
						|| ref['url'].startsWith('https://')
						|| ref['url'].startsWith('http://')
					)
				) {

					let url = ref['url'].trim();
					if (vulnerability['references'].includes(url) === false) {
						vulnerability['references'].push(url);
					}

				}

			});

		}

	} else if (
		isObject(data) === true
		&& isString(data['dataType']) === true
		&& data['dataType'] === 'CVE_RECORD'
		&& isString(data['dataVersion']) === true
		&& data['dataVersion'] === '4.0'
	) {

		// XXX: Support for CVE Schema 4.0?

	}


	if (isString(vulnerability['description']) === true) {

		DISPUTED.forEach((string) => {

			if (vulnerability['description'].toLowerCase().includes(string.toLowerCase()) === true) {

				if (vulnerability['state'] === 'published') {
					vulnerability['state'] = 'disputed';
				}

			}

		});

	}

};

const update = function(callback) {

	if (this.filesystem.exists('/.git') === true) {

		let handle = child_process.spawn('git', [
			'pull',
			'origin',
			'master'
		], {
			cwd: this.filesystem.root
		});

		handle.stdout.on('data', () => {
			// Do nothing
		});

		handle.stderr.on('data', () => {
			// Do nothing
		});

		handle.on('exit', (code) => {
			callback(code === 0 ? true : false);
		});

	} else {

		let handle = child_process.spawn('git', [
			'clone',
			'--depth=1',
			'--single-branch',
			'--branch=master',
			'https://github.com/CVEProject/cvelistV5',
			this.filesystem.root
		], {
			cwd: this.filesystem.root
		});

		handle.stdout.on('data', () => {
			// Do nothing
		});

		handle.stderr.on('data', () => {
			// Do nothing
		});

		handle.on('exit', (code) => {
			callback(code === 0 ? true : false);
		});

	}

};



const CVE = function(vulnerabilities) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/cve'
	});


	Emitter.call(this);

};

CVE.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'MITRE CVE',
	[Symbol.toStringTag]:        'CVE',

	connect: function() {

		// Don't cache CVE files due to their corrupted state

		setTimeout(() => {
			this.emit('connect');
		}, 0);

	},

	disconnect: function() {

		setTimeout(() => {
			this.emit('disconnect');
		}, 0);

	},

	merge: function() {

		console.info('CVE: Merge');

		this.filesystem.index('/review_set').forEach((year) => {

			this.filesystem.index(year).sort().forEach((prefix) => {

				this.filesystem.index(prefix, 'CVE-*.json').sort().map((path) => {

					let id   = toIdentifier(path.split('/').pop());
					let data = this.filesystem.read(path);

					if (id !== null && data !== null) {
						return {
							'id':   id,
							'data': data
						};
					}

					return null;

				}).filter((entry) => {
					return entry !== null;
				}).forEach((entry) => {

					let vulnerability = this.vulnerabilities.get(entry['id']);
					if (
						vulnerability['_is_edited'] === false
						&& STATE.includes(vulnerability['state']) === true
					) {

						merge.call(this, vulnerability, entry['data']);

						this.vulnerabilities.update(vulnerability);

					}

				});

			});

		});

		setTimeout(() => {

			console.info('CVE: Merge complete.');

			this.emit('merge');

		}, 0);

	},

	update: function() {

		console.info('CVE: Update');

		update.call(this, (result) => {

			if (result === true) {

				this.once('merge', () => {

					console.info('CVE: Update complete.');

					this.emit('update');

				});

				this.merge();

			} else {

				console.error('CVE: Cannot synchronize with GitHub repository.');

				this.emit('error');

			}

		});

	}

});


export { CVE };

