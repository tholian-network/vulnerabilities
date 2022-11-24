
import { console, Emitter, isArray, isBuffer, isNumber, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                                       } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                                        } from '../../source/Filesystem.mjs';
import { isUpdater                                                         } from '../../source/Updater.mjs';
import { isVulnerabilities, Vulnerabilities, containsSoftware              } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                                        } from '../../source/Webscraper.mjs';



const DTSA_NOT_AFFECTED = [
	'not affected',
	'not vulnerable',
	'vulnerability was introduced later',
	'vulnerable code not yet present',
	'vulnerable code not present',
	'does not contain the vulnerable code',
	'does not seem to be affected'
];

// "sid" is the unstable release, which is ignored by DSA/DTSA
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



const merge_advisory = function(vulnerability, advisory) {

	if (isString(advisory['severity']) === true) {

		if (vulnerability['severity'] === null) {
			vulnerability['severity'] = advisory['severity'];
		}

	}

	if (isArray(advisory['software']) === true) {

		advisory['software'].forEach((software) => {

			if (containsSoftware(vulnerability['software'], software) === false) {
				vulnerability['software'].push(software);
			}

		});

	}

	if (isArray(advisory['references']) === true) {

		advisory['references'].map((url) => url.trim()).forEach((url) => {

			if (vulnerability['references'].includes(url) === false) {
				vulnerability['references'].push(url);
			}

		});

	}

};

const merge_package = function(vulnerability, pkg_name, data) {

	if (isObject(data) === true) {

		if (isObject(data['releases']) === true) {

			Object.keys(data['releases']).forEach((release) => {

				if (isNumber(RELEASES[release]) === true) {

					let details = data['releases'][release];
					if (
						isObject(details) === true
						&& isString(details['status']) === true
					) {

						if (
							details['status'] === 'resolved'
							&& isString(details['fixed_version']) === true
						) {

							let software = {
								name:     pkg_name,
								platform: 'debian-' + RELEASES[release],
								version:  '< ' + details['fixed_version']
							};

							if (containsSoftware(vulnerability['software'], software) === false) {
								vulnerability['software'].push(software);
							}

						} else if (
							details['status'] === 'open'
							&& (
								details['urgency'] === 'end-of-life'
								|| details['urgency'] === 'low'
								|| details['urgency'] === 'not yet assigned'
								|| details['urgency'] === 'unimportant'
							)
						) {

							let software = {
								name:     pkg_name,
								platform: 'debian-' + RELEASES[release],
								version:  '*'
							};

							if (containsSoftware(vulnerability['software'], software) === false) {
								vulnerability['software'].push(software);
							}

						} else if (
							details['status'] === 'undetermined'
							&& (
								details['urgency'] === 'end-of-life'
								|| details['urgency'] === 'low'
								|| details['urgency'] === 'not yet assigned'
								|| details['urgency'] === 'unimportant'
							)
						) {

							let software = {
								name:     pkg_name,
								platform: 'debian-' + RELEASES[release],
								version:  '*'
							};

							if (containsSoftware(vulnerability['software'], software) === false) {
								vulnerability['software'].push(software);
							}

						}

					}

				}

			});

		}

	}

};

const parseList = function(buffer) {

	let list  = [];
	let lines = buffer.toString('utf8').split('\n').filter((line) => line.trim() !== '').map((line) => {

		if (
			line.startsWith('    ') === true
			|| line.startsWith('\t') === true
			|| line.startsWith(' \t') === true
		) {
			return '\t' + line.trim();
		} else {
			return line.trim();
		}

	});

	if (lines.length > 0) {

		let entry = {
			'date':     null,
			'name':     null,
			'packages': [],
			'severity': null,
			'cves':     [],
			'software': []
		};

		lines.forEach((line) => {

			if (line.startsWith('[') === true) {

				if (entry['name'] !== null) {
					list.push(entry);
				}

				entry = {
					'date':       null,
					'name':       null,
					'packages':   [],
					'severity':   null,
					'cves':       [],
					'references': [],
					'software':   []
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

					let i1 = line.indexOf(name) + name.length;
					let i2 = line.indexOf(' - ', i1);

					if (i1 !== -1 && i2 !== -1) {

						let pkg_name = line.substr(i1, i2 - i1).trim();
						if (pkg_name.includes(',') === true) {
							entry['packages'] = pkg_name.split(',').map((v) => v.trim());
						} else if (pkg_name.includes(' ') === true) {
							entry['packages'] = pkg_name.split(' ').filter((v) => v !== '');
						} else if (pkg_name !== '') {
							entry['packages'] = [ pkg_name ];
						}

					}

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


				if (
					isNumber(RELEASES[release]) === true
					&& details.length > 1
				) {

					let pkg_name    = details[0];
					let pkg_version = details[1];

					let severity = details.slice(2).join(' ') || '';
					if (severity.startsWith('(') === true && severity.endsWith(')') === true) {

						severity = severity.substr(1, severity.length - 2);

						if (severity.includes('bug') === true) {

							if (severity.includes(';') === true) {

								let tmp = severity.split(';').map((v) => v.trim().toLowerCase());

								if (SEVERITY.includes(tmp[0]) === true) {
									severity = tmp[0];
								} else if (SEVERITY.includes(tmp[1]) === true) {
									severity = tmp[1];
								}

							} else {

								severity = null;

							}

						} else if (severity.includes(' ') === true) {

							let not_affected = DTSA_NOT_AFFECTED.find((search) => {
								return severity.toLowerCase().includes(search.toLowerCase()) === true;
							}) || null;

							if (not_affected !== null) {
								pkg_version = '<not-affected>';
								severity    = null;
							}

						}

						if (severity !== null) {

							if (SEVERITY.includes(severity) === true) {
								entry['severity'] = severity;
							}

						}

					}

					if (pkg_version === '<not-affected>') {

						// Do Nothing

					} else if (pkg_version === '<unfixed>') {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '*'
						};

						if (containsSoftware(entry['software'], software) === false) {
							entry['software'].push(software);
						}

					} else if (pkg_version === '<end-of-life>') {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '*'
						};

						if (containsSoftware(entry['software'], software) === false) {
							entry['software'].push(software);
						}

					} else {

						let software = {
							name:     pkg_name,
							platform: 'debian-' + RELEASES[release],
							version:  '< ' + pkg_version
						};

						if (containsSoftware(entry['software'], software) === false) {
							entry['software'].push(software);
						}

					}

				}

			} else if (line.startsWith('\tNOTE:') === true) {

				// Do Nothing

			}

		});

	}

	list.forEach((entry) => {

		let check = entry['name'].split('-');
		if (check.length === 3 && check[2] === '1') {

			let target     = entry;
			let prefix     = check.slice(0, check.length - 1).join('-');
			let cves       = [];
			let references = [ 'https://security-tracker.debian.org/tracker/' + entry['name'] ];
			let software   = [];

			for (let bugfix = 5; bugfix > 1; bugfix--) {

				let source = list.find((e) => e['name'] === prefix + '-' + bugfix) || null;
				if (source !== null) {

					let reference = 'https://security-tracker.debian.org/tracker/' + source['name'];
					if (references.includes(reference) === false) {
						references.push(reference);
					}

					source['cves'].forEach((cve_id) => {

						if (cves.includes(cve_id) === false) {
							cves.push(cve_id);
						}

					});

					source['software'].forEach((update) => {

						let other = software.find((o) => {
							return o['name'] === update['name'] && o['platform'] === update['platform'];
						}) || null;

						if (other === null) {
							software.push(update);
						}

					});

				}

			}

			if (cves.length > 0) {

				cves.forEach((cve_id) => {

					if (target['cves'].includes(cve_id) === false) {
						target['cves'].push(cve_id);
					}

				});

			}

			if (references.length > 0) {

				references.forEach((reference) => {

					if (target['references'].includes(reference) === false) {
						target['references'].push(reference);
					}

				});

			}

			if (software.length > 0) {

				software.forEach((update) => {

					let other = target['software'].find((o) => {
						return o['name'] === update['name'] && o['platform'] === update['platform'];
					}) || null;

					if (other !== null) {
						other['version'] = update['version'];
					} else {
						target['software'].push(update);
					}

				});

			}

		} else if (check.length === 2) {

			entry['references'] = [ 'https://security-tracker.debian.org/tracker/' + entry['name'] ];

		}

	});

	for (let l = 0, ll = list.length; l < ll; l++) {

		let entry = list[l];
		let check = entry['name'].split('-');
		if (check.length === 3) {

			if (check[2] === '1') {

				entry['name'] = check.slice(0, 2).join('-');

			} else if (check[2] !== '1') {

				list.splice(l, 1);
				ll--;
				l--;

			}

		}

	}

	list.forEach((entry) => {

		if (entry['software'].length > 0) {

			entry['software'].forEach((software) => {

				let older_releases = toOutdatedReleases(software);
				if (older_releases.length > 0) {

					older_releases.forEach((release) => {

						let old_software = {
							name:     software['name'],
							platform: 'debian-' + RELEASES[release],
							version:  software['version']
						};

						if (containsSoftware(entry['software'], old_software) === false) {
							entry['software'].push(old_software);
						}

					});

				}

			});

		}

	});


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

const toOutdatedReleases = function(software) {

	let all_releases = Object.keys(RELEASES);
	let cur_version  = null;
	let old_releases = [];

	for (let r = 0, rl = all_releases.length; r < rl; r++) {

		if (software['platform'] === 'debian-' + RELEASES[all_releases[r]]) {
			cur_version = RELEASES[all_releases[r]];
			break;
		}

	}

	if (cur_version !== null) {

		all_releases.forEach((release) => {

			if (RELEASES[release] < cur_version) {
				old_releases.push(release);
			}

		});

	}

	return old_releases;

};



const Debian = function(vulnerabilities, updater) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();
	this.updater         = isUpdater(updater)                 ? updater         : null;

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/debian'
	});

	this.webscraper = new Webscraper({
		limit:    5,
		insecure: this.updater !== null ? this.updater._settings.insecure : false
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


		let dsa_buffer = this.filesystem.read('/dsa.list');
		if (isBuffer(dsa_buffer) === true) {

			let dsa_list = parseList(dsa_buffer);
			if (dsa_list.length > 0) {
				dsa_list.forEach((dsa) => {
					this.__state['dsa'][dsa['name']] = dsa;
				});
			}

		}

		let dtsa_buffer = this.filesystem.read('/dsa.list');
		if (isBuffer(dtsa_buffer) === true) {

			let dtsa_list = parseList(dtsa_buffer);
			if (dtsa_list.length > 0) {
				dtsa_list.forEach((dtsa) => {
					this.__state['dtsa'][dtsa['name']] = dtsa;
				});
			}

		}

		let data = this.filesystem.read('/data.json');
		if (isObject(data) === true) {
			this.__state['pkgs'] = data;
		}


		setTimeout(() => {
			this.emit('connect');
		}, 0);

	},

	disconnect: function() {

		this.webscraper.destroy();


		setTimeout(() => {
			this.emit('disconnect');
		}, 0);

	},

	merge: function() {

		console.info('Debian: Merge');


		Object.values(this.__state['dsa']).forEach((dsa) => {

			if (
				dsa['cves'].length > 0
				&& dsa['software'].length > 0
			) {

				dsa['cves'].forEach((cve_id) => {

					let vulnerability = this.vulnerabilities.get(cve_id);
					if (vulnerability['_is_edited'] === false) {

						merge_advisory.call(this, vulnerability, dsa);

						this.vulnerabilities.update(vulnerability);

					}

				});

			} else if (
				dsa['cves'].length === 0
				&& dsa['software'].length > 0
			) {

				let vulnerability = this.vulnerabilities.get(dsa['name']);
				if (vulnerability['_is_edited'] === false) {

					merge_advisory.call(this, vulnerability, dsa);

					this.vulnerabilities.update(vulnerability);

				}

			}

		});

		Object.values(this.__state['dtsa']).forEach((dtsa) => {

			if (
				dtsa['cves'].length > 0
				&& dtsa['software'].length > 0
			) {

				dtsa['cves'].forEach((cve_id) => {

					let vulnerability = this.vulnerabilities.get(cve_id);
					if (vulnerability['_is_edited'] === false) {

						merge_advisory.call(this, vulnerability, dtsa);

						this.vulnerabilities.update(vulnerability);

					}

				});

			} else if (
				dtsa['cves'].length === 0
				&& dtsa['software'].length > 0
			) {

				let vulnerability = this.vulnerabilities.get(dtsa['name']);
				if (vulnerability['_is_edited'] === false) {

					merge_advisory.call(this, vulnerability, dtsa);

					this.vulnerabilities.update(vulnerability);

				}

			}

		});


		Object.keys(this.__state['pkgs']).forEach((pkg_id) => {

			let pkg_details = this.__state['pkgs'][pkg_id];

			if (isObject(pkg_details) === true) {

				Object.keys(pkg_details).forEach((cve_id) => {

					let cve_details   = pkg_details[cve_id];
					let vulnerability = this.vulnerabilities.get(cve_id);

					if (vulnerability['_is_edited'] === false) {

						merge_package.call(this, vulnerability, pkg_id, cve_details);

						this.vulnerabilities.update(vulnerability);

					}

				});

			}

		});


		setTimeout(() => {

			console.info('Debian: Merge complete.');

			this.emit('merge');

		}, 0);

	},

	update: function() {

		console.info('Debian: Update');

		this.webscraper.request('https://salsa.debian.org/security-tracker-team/security-tracker/-/raw/master/data/DSA/list', (_, dsa_buffer) => {

			if (isBuffer(dsa_buffer) === true) {

				this.filesystem.write('/dsa.list', dsa_buffer);


				let dsa_list = parseList(dsa_buffer);
				if (dsa_list.length > 0) {
					dsa_list.forEach((dsa) => {
						this.__state['dsa'][dsa['name']] = dsa;
					});
				}

			}


			this.webscraper.request('https://salsa.debian.org/security-tracker-team/security-tracker/-/raw/master/data/DTSA/list', (_, dtsa_buffer) => {

				if (isBuffer(dtsa_buffer) === true) {

					this.filesystem.write('/dtsa.list', dtsa_buffer);


					let dtsa_list = parseList(dsa_buffer);
					if (dtsa_list.length > 0) {
						dtsa_list.forEach((dtsa) => {
							this.__state['dtsa'][dtsa['name']] = dtsa;
						});
					}

				}


				this.webscraper.request('https://security-tracker.debian.org/tracker/data/json', (data) => {

					if (isObject(data) === true) {

						this.filesystem.write('/data.json', data);


						this.__state['pkgs'] = data;


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

