
import { console, Emitter, isArray, isBuffer, isNumber, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                                       } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                                        } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities                                } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                                        } from '../../source/Webscraper.mjs';



const RELEASES = {
	'buzz':       1.1,
	'rex':        1.2,
	'bo':         1.3,
	'hamm':       2.0,
	'slink':      2.1,
	'potato':     2.2,
	'woody':      3.0,
	'sarge':      3.1,
	'etch':       4,
	'lenny':      5,
	'squeeze':    6,
	'wheezy':     7,
	'jessie':     8,
	'stretch':    9,
	'buster':    10,
	'bullseye':  11,
	'bookworm':  12,
	'trixie':    13
};

const SEVERITY = [
	'critical',
	'high',
	'medium',
	'low'
];



const findSoftware = function(software) {

	if (isArray(this) === true) {

		let found = null;

		for (let t = 0, tl = this.length; t < tl; t++) {

			let other = this[t];

			if (
				other['name'] === software['name']
				&& other['platform'] === software['platform']
				&& other['version'] === software['version']
			) {
				found = other;
				break;
			}

		}

		return found;

	}

	return null;

};

const merge = function(vulnerability, pkg_name, data) {


};

const parseList = function(buffer) {

	let list  = [];
	let lines = buffer.toString('utf8').split('\n').filter((line) => line.trim() !== '');

	if (lines.length > 0) {

		let entry = {
			date:     null,
			name:     null,
			cves:     null,
			packages: []
		};

		lines.forEach((line) => {

			if (line.startsWith('[') === true) {

				if (entry['name'] !== null) {
					list.push(entry);
				}

				entry = {
					date:     null,
					name:     null,
					cves:     [],
					software: []
				};

				let date = line.substr(1, line.indexOf(']') - 1);
				let name = line.split('] ').pop().split(' ').shift();

				if (
					isString(date) === true
					&& isString(name) === true
					&& (
						name.startsWith('DSA-') === true
						|| name.startsWith('DTSA-') === true
					)
				) {
					entry['date'] = date;
					entry['name'] = name;
				}

			} else if (line.startsWith('\t{') === true && line.endsWith('}') === true) {

				line.substr(2, line.length - 3).split(' ').filter((value) => {
					return value.trim() !== '';
				}).map((value) => {
					return toIdentifier(value);
				}).forEach((cve_id) => {

					if (cve_id !== null) {

						if (entry['cves'].includes(cve_id) === false) {
							entry['cves'].push(cve_id);
						}

					}

				});

			} else if (line.startsWith('\t[') === true) {

				let release = line.trim().substr(1, line.indexOf(']') - 2).trim();
				let details = line.trim().substr(line.indexOf(' - ') + 2).trim().split(' ');


				if (isNumber(RELEASES[release]) === true && details.length === 2) {

					let pkg_name    = details[0];
					let pkg_version = details[1];

					if (pkg_version === '<not-affected>') {

						// XXX: What then?

					} else if (pkg_version === '<unfixed>') {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '*'
						};

						let other = findSoftware.call(entry['software'], software);
						if (other === null) {
							entry['software'].push(software);
						}

					} else if (pkg_version === '<end-of-life>') {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '*'
						};

						let other = findSoftware.call(entry['software'], software);
						if (other === null) {
							entry['software'].push(software);
						}

					} else {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '< ' + pkg_version
						};

						let other = findSoftware.call(entry['software'], software);
						if (other === null) {
							entry['software'].push(software);
						}

					}

				}

			}

		});

	}

	return list;

};

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



const Debian = function(vulnerabilities) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/debian'
	});

	this.webscraper = new Webscraper({
		limit: 5
	});


	this.__state = {
		'dsa':  {},
		'dtsa': {},
		'pkgs': {}
	};


	Emitter.call(this);

};


Debian.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Debian Security Tracker',
	[Symbol.toStringTag]:        'Debian',

	connect: function() {

		this.__state['dsa']  = {};
		this.__state['dtsa'] = {};
		this.__state['pkgs'] = {};

		let dsa = this.filesystem.read('/dsa.list');
		if (isBuffer(dsa) === true) {

			let dsa_list = parseList(dsa);
			console.log(dsa_list);

		}

		// let dtsa = this.filesystem.read('/dtsa.list');

		// TODO: Read data.json
		// TODO: Read dsa.list
		// TODO: Read dtsa.list

		this.emit('connect');

	},

	disconnect: function() {

		this.webscraper.destroy();

		this.emit('disconnect');

	},

	merge: function() {

		console.info('Debian: Merge');

		// TODO: dsa.list Integration
		// TODO: dtsa.list Integration

		let data = this.filesystem.read('/data.json');

		if (
			isObject(data) === true
		) {

			for (let pkg_name in data) {

				let pkg_details = data[pkg_name];

				console.warn(pkg_name);
				console.log(pkg_details);

				if (isObject(pkg_details) === true) {

					Object.keys(pkg_details).forEach((cve_id) => {

						let cve_details   = pkg_details[cve_id];
						let vulnerability = this.vulnerabilities.get(cve_id);
						if (vulnerability['_is_edited'] === false) {

							merge.call(this, vulnerability, pkg_name, cve_details);

							this.vulnerabilities.update(vulnerability);

						}

					});

				}

				break;

			}

		}

	},

	update: function() {

		console.info('Debian: Update');

		this.webscraper.request('https://salsa.debian.org/security-tracker-team/security-tracker/-/raw/master/data/DSA/list', (_, dsa_buffer) => {

			if (isBuffer(dsa_buffer) === true) {
				this.filesystem.write('/dsa.list', dsa_buffer);
			}

			this.webscraper.request('https://salsa.debian.org/security-tracker-team/security-tracker/-/raw/master/data/DTSA/list', (_, dtsa_buffer) => {

				if (isBuffer(dtsa_buffer) === true) {
					this.filesystem.write('/dtsa.list', dtsa_buffer);
				}


				this.webscraper.request('https://security-tracker.debian.org/tracker/data/json', (data) => {

					if (isObject(data) === true) {

						this.filesystem.write('/data.json', data);


						this.once('merge', () => {
							this.emit('update');
						});

						this.merge();

					}

				});

			});

		});

	}

});


export { Debian };

