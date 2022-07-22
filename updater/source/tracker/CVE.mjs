
import child_process from 'child_process';

import { console, Emitter, isArray, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                   } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                    } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities            } from '../../source/Vulnerabilities.mjs';



/*
 * XXX: Outdated and not regularly updated: 'https://github.com/CVEProject/cvelistV5'
 */

const toASCII = (str) => {

	let out = '';

	str.split('').forEach((chr) => {

		let code = chr.charCodeAt(0);
		if (code <= 127) {
			out += chr;
		} else if (code === 160) {
			out += ' ';
		} else if (code === 8211) {
			out += '-';
		} else if (code === 8239) {
			out += ' ';
		}

	});

	return out;

};



const DISPUTED = [
	'** DISPUTED **',
	'** UNVERIFIABLE **',
	'** UNVERIFIABLE, PRERELEASE **',
	'** PRODUCT NOT SUPPORTED WHEN ASSIGNED **',
	'** UNSUPPORTED WHEN ASSIGNED **'
];

const RESERVED = [
	'** RESERVED **'
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
	'reserved',
	'invalid'
];

const VERSIONS_IGNORE = [
	'&#x80', // Seriously?
	'&#xe2', // Seriously?
	'N/A',
	'NA',
	'n/a',
	'na',
	'Unknown',
	'unknown',
	'Multiple',
	'multiple',
	'Unspecified',
	'unspecified',
	'Various',
	'various'
];

const VERSIONS_GRAMMAR = [

	// TODO: Prior to 8.17 and 9.09

	{ op: '<=', prefix: null, suffix: ' and below versions'                 },
	{ op: '<=', prefix: null, suffix: ' and earlier without hotfix applied' },
	{ op: '<=', prefix: null, suffix: ' and earlier unsupported versions'   },
	{ op: '<=', prefix: null, suffix: ' and earlier versions'               },
	{ op: '<=', prefix: null, suffix: ' and earlier version'                },
	{ op: '<=', prefix: null, suffix: ' and earlier'                        },
	{ op: '<=', prefix: null, suffix: ' or earlier'                         },
	{ op: '<=', prefix: null, suffix: ' and prior versions'                 },
	{ op: '<=', prefix: null, suffix: ' and prior version'                  },
	{ op: '<=', prefix: null, suffix: ' and prior'                          },

	{ op: '>=', prefix: null, suffix: ' and later versions'                 },
	{ op: '>=', prefix: null, suffix: ' and later version'                  },
	{ op: '>=', prefix: null, suffix: ' and later'                          },
	{ op: '>=', prefix: null, suffix: ' and after versions'                 },
	{ op: '>=', prefix: null, suffix: ' and after version'                  },
	{ op: '>=', prefix: null, suffix: ' and after'                          },

	{ op: '<=', prefix: 'all versions <= ',               suffix: null      },
	{ op: '<',  prefix: 'all versions < ',                suffix: null      },
	{ op: '>=', prefix: 'all versions >= ',               suffix: null      },
	{ op: '>',  prefix: 'all versions > ',                suffix: null      },

	{ op: '<',  prefix: 'all versions prior to version ', suffix: null      },
	{ op: '<',  prefix: 'all versions prior to ',         suffix: null      },
	{ op: '<',  prefix: 'before ',                        suffix: null      },
	{ op: '<',  prefix: 'fixed in version ',              suffix: null      },
	{ op: '<',  prefix: 'fixed in ',                      suffix: null      },
	{ op: '<',  prefix: 'versions earlier than ',         suffix: null      },
	{ op: '<',  prefix: 'versions earlier before ',       suffix: null      },
	{ op: '<',  prefix: 'earlier versions than ',         suffix: null      },
	{ op: '<',  prefix: 'prior to ',                      suffix: null      },
	{ op: '<',  prefix: 'prior to version ',              suffix: null      },
	{ op: '<',  prefix: 'through ',                       suffix: null      },
	{ op: '<',  prefix: 'up to and including ',           suffix: null      },
	{ op: '<',  prefix: 'versions below ',                suffix: null      },
	{ op: '<',  prefix: 'versions prior to ',             suffix: null      },

	{ op: '<',  prefix: 'earlier than ', suffix: ' versions' }

];

const VERSIONS_SYNTAX = [

	{ op: '>', version: 'prefix', prefix: /^([Vv]?)([0-9.]+)$/g,       midfix: ' to ',             suffix: /^([Vv]?)([0-9.]+)\+$/g     },

	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9A-Za-z.]+)$/g, midfix: ' before version ', suffix: /^([Vv]?)([0-9A-Za-z.]+)$/g },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9.]+)$/g,       midfix: ' before version ', suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9A-Za-z.]+)$/g, midfix: ' before ',         suffix: /^([Vv]?)([0-9A-Za-z.]+)$/g },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9.]+)$/g,       midfix: ' before ',         suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9A-Za-z.]+)$/g, midfix: ' through ',        suffix: /^([Vv]?)([0-9A-Za-z.]+)$/g },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9.]+)$/g,       midfix: ' through ',        suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9A-Za-z.]+)$/g, midfix: ' to ',             suffix: /^([Vv]?)([0-9A-Za-z.]+)$/g },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9.]+)$/g,       midfix: ' to ',             suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9XYZxyz.]+)$/g, midfix: ' before version ', suffix: /^([Vv]?)([0-9A-Za-z.]+)$/g },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9XYZxyz.]+)$/g, midfix: ' before ',         suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9XYZxyz.]+)$/g, midfix: ' through ',        suffix: /^([Vv]?)([0-9.]+)$/g       },
	{ op: '<', version: 'suffix', prefix: /^([Vv]?)([0-9XYZxyz.]+)$/g, midfix: ' to ',             suffix: /^([Vv]?)([0-9.]+)$/g       },

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

const toProductsV4 = function(data) {

	data = isArray(data) ? data : [];


	let products = [];

	data.forEach((entry) => {

		if (
			isObject(entry) === true
			&& isString(entry['product_name']) === true
			&& entry['product_name'] !== 'N/A'
			&& entry['product_name'] !== 'n/a'
			&& entry['product_name'].trim() !== ''
			&& isObject(entry['version']) === true
			&& isArray(entry['version']['version_data']) === true
		) {

			products.push({
				'name':     entry['product_name'].trim(),
				'versions': toVersionsV4(entry['version']['version_data'])
			});

		}

	});

	return products;

};

const toVersion = function(data) {

	data = isString(data) ? toASCII(data) : null;


	let version = null;

	if (data !== null) {

		if (data === 'and their earlier versions') {

			// TODO: Parsing Mistake in toVersions()?
			data = '';

		} else if (data === 'and earlier') {

			// TODO: Parsing Mistake in toVersions()?
			data = '';

		} else if (data.startsWith('and ') === true) {
			data = data.substr(4);
		}

		if (data.endsWith('.') === true) {
			data = data.substr(0, data.length - 1).trim();
		}

		let fuzzy = data.toLowerCase();

		for (let g = 0; g < VERSIONS_GRAMMAR.length; g++) {

			let grammar = VERSIONS_GRAMMAR[g];
			if (isString(grammar.prefix) === true && isString(grammar.suffix) === true) {

				if (fuzzy.startsWith(grammar.prefix) === true && fuzzy.endsWith(grammar.suffix) === true) {

					let tmp1 = data.substr(grammar.prefix.length).trim();
					let tmp2 = tmp1.substr(0, tmp1.length - grammar.suffix.length).trim();

					version = grammar.op + ' ' + tmp2;
					break;

				}

			} else if (isString(grammar.prefix) === true && grammar.suffix === null) {

				if (fuzzy.startsWith(grammar.prefix) === true) {

					let tmp1 = data.substr(grammar.prefix.length).trim();

					version = grammar.op + ' ' + tmp1;
					break;

				}

			} else if (grammar.prefix === null && isString(grammar.suffix) === true) {

				if (fuzzy.endsWith(grammar.suffix) === true) {

					let tmp1 = data.substr(0, data.length - grammar.suffix.length).trim();

					version = grammar.op + ' ' + tmp1;
					break;

				}

			}

		}

		data    = '2.0 to 2.1.4+';
		version = null;

		if (version === null) {

			for (let s = 0; s < VERSIONS_SYNTAX.length; s++) {

				let syntax = VERSIONS_SYNTAX[s];

				if (data.includes(syntax.midfix) === true) {

					let tmp = data.split(syntax.midfix);
					console.warn(tmp);
					if (tmp.length === 2) {

						if (syntax.prefix.test(tmp[0]) === true) {
							console.info(tmp[0], syntax.prefix, ' -> ', syntax.prefix.test(tmp[0]));
						} else {
							console.error(tmp[0], syntax.prefix, ' -> ', syntax.prefix.test(tmp[0]));
						}

						if (syntax.suffix.test(tmp[1]) === true) {
							console.info(tmp[1], syntax.suffix, ' -> ', syntax.suffix.test(tmp[1]));
						} else {
							console.error(tmp[1], syntax.suffix, ' -> ', syntax.suffix.test(tmp[1]));
						}


						if (
							syntax.prefix.test(tmp[0]) === true
							&& syntax.suffix.test(tmp[1]) === true
						) {

							if (syntax.version === 'prefix') {
								version = syntax.op + ' ' + tmp[0];
								break;
							} else if (syntax.version === 'suffix') {
								version = syntax.op + ' ' + tmp[1];
								break;
							}

						}

					}

				}

			}

		}

		console.log(data, version);


		if (version === null) {

			process.exit();

			if (data.startsWith('<=') === true) {
				version = '<= ' + data.substr(2).trim();
			} else if (data.startsWith('<') === true) {
				version = '< ' + data.substr(1).trim();
			} else if (data.startsWith('>=') === true) {
				version = '>= ' + data.substr(2).trim();
			} else if (data.startsWith('>') === true) {
				version = '> ' + data.substr(1).trim();
			} else if (/^([Vv]?)([0-9.]+)$/g.test(data) === true) {
				version = data.trim();
			} else if (/^([Vv]?)([0-9A-Za-z.]+)$/g.test(data) === true) {
				version = data.trim();
			} else {
				console.log(data);
			}

		}

	}

	return version;

};

const toVersionsV4 = function(data) {

	data = isArray(data) ? data : [];


	let versions = [];

	data.forEach((entry) => {

		if (
			isObject(entry) === true
			&& isString(entry['version_value']) === true
			&& VERSIONS_IGNORE.includes(entry['version_value']) === false
		) {

			let value = entry['version_value'].trim();

			if (value.startsWith('(') === true && value.endsWith(')') === true) {
				value = value.substr(1, value.length - 2);
			}

			if (value.endsWith('.') === true) {
				value = value.substr(0, value.length - 1);
			}

			if (value.endsWith('(see note)') === true) {
				value = value.substr(0, value.length - 10).trim();
			}


			let fuzzy = value.toLowerCase();

			if (
				fuzzy === 'all'
				|| fuzzy === 'all versions'
			) {

				if (versions.includes('*') === false) {
					versions.push('*');
				}

			} else if (value.includes(' -- ') === true) {

				value.split(' -- ').map((val) => {
					return val.trim();
				}).filter((val) => {
					return val !== '';
				}).forEach((val) => {

					let version = toVersion(val);
					if (version !== null && versions.includes(version) === false) {
						versions.push(version);
					}

				});

			} else if (value.startsWith('before ') === true && value.includes(',') === true) {

				value.substr(7).trim().split(',').map((val) => {
					return val.trim();
				}).filter((val) => {
					return val !== '';
				}).forEach((val) => {

					let version = toVersion(val);
					if (version !== null && versions.includes('< ' + version) === false) {
						versions.push('< ' + version);
					}

				});

			} else if (value.includes(',') === true) {

				value.split(',').map((val) => {
					return val.trim();
				}).filter((val) => {
					return val !== '';
				}).forEach((val) => {

					let version = toVersion(val);
					if (version !== null && versions.includes(version) === false) {
						versions.push(version);
					}

				});

			} else if (value.includes('/') === true) {

				value.split('/').map((val) => {
					return val.trim();
				}).filter((val) => {
					return val !== '';
				}).forEach((val) => {

					let version = toVersion(val);
					if (version !== null && versions.includes(version) === false) {
						versions.push(version);
					}

				});

			} else if (/^([Vv]?)([0-9.]+)$/g.test(value) === true) {

				let version = toVersion(value);
				if (version !== null && versions.includes(version) === false) {
					versions.push(version);
				}

			} else if (/^([Vv]?)([0-9A-Za-z.]+)$/g.test(value) === true) {

				let version = toVersion(value);
				if (version !== null && versions.includes(version) === false) {
					versions.push(version);
				}

			} else if (value !== '') {

				let version = toVersion(value);
				if (version !== null && versions.includes(version) === false) {
					versions.push(version);
				}

			}

		}

	});

	return versions;

};

const toVersionsV5 = function(data) {

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

		if (
			isObject(data['cveMetadata']) === true
			&& isString(data['cveMetadata']['state']) === true
		) {

			if (data['cveMetadata']['state'] === 'PUBLISHED') {
				vulnerability['state'] = 'published';
			} else if (data['cveMetadata']['state'] === 'REJECTED') {
				vulnerability['state'] = 'rejected';
			}

		}

		if (
			isObject(data['containers']) === true
			&& isObject(data['containers']['cna']) === true
			&& isArray(data['containers']['cna']['descriptions']) === true
		) {

			let descriptions = data['containers']['cna']['descriptions'].filter((desc) => desc['lang'] === 'en');
			if (descriptions.length > 0) {
				vulnerability['description'] = descriptions.map((desc) => toASCII(desc['value']).trim()).join('\n');
				vulnerability['description'] = vulnerability['description'].trim();
			}

		}

		if (
			isObject(data['containers']) === true
			&& isObject(data['containers']['cna']) === true
			&& isArray(data['containers']['cna']['affected']) === true
		) {

			let affected_description = '';

			data['containers']['cna']['affected'].forEach((affected) => {

				if (
					isObject(affected) === true
					&& isString(affected['vendor']) === true
					&& affected['vendor'] !== 'n/a'
					&& isString(affected['product']) === true
					&& affected['product'] !== 'n/a'
					&& isArray(affected['versions']) === true
				) {

					let versions = toVersionsV5(affected['versions']);

					if (versions.length > 0) {
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

		if (
			isObject(data['containers']) === true
			&& isObject(data['containers']['cna']) === true
			&& isArray(data['containers']['cna']['metrics']) === true
		) {

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

		if (
			isObject(data['containers']) === true
			&& isObject(data['containers']['cna']) === true
			&& isArray(data['containers']['cna']['references']) === true
		) {

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
		&& isString(data['data_type']) === true
		&& data['data_type'] === 'CVE'
		&& isString(data['data_version']) === true
		&& data['data_version'] === '4.0'
	) {

		if (isString(data['CVE_data_meta']['STATE']) === true) {

			if (isString(data['CVE_data_meta']['STATE']) === 'PUBLIC') {
				vulnerability['state'] = 'published';
			} else if (isString(data['CVE_data_meta']['STATE']) === 'RESERVED') {
				vulnerability['state'] = 'disputed';
			}

		}

		if (
			isObject(data['description']) === true
			&& isArray(data['description']['description_data']) === true
		) {

			let descriptions = data['description']['description_data'].filter((desc) => desc['lang'] === 'en');
			if (descriptions.length > 0) {
				vulnerability['description'] = descriptions.map((desc) => toASCII(desc['value']).trim()).join('\n');
				vulnerability['description'] = vulnerability['description'].trim();
			}

		}

		if (
			isObject(data['affects']) === true
			&& isObject(data['affects']['vendor']) === true
			&& isArray(data['affects']['vendor']['vendor_data']) === true
		) {

			let affected_description = '';

			data['affects']['vendor']['vendor_data'].forEach((affected) => {

				if (
					isObject(affected) === true
					&& isString(affected['vendor_name']) === true
					&& affected['vendor_name'] !== 'n/a'
					&& isObject(affected['product']) === true
					&& isArray(affected['product']['product_data']) === true
				) {

					let products = toProductsV4(affected['product']['product_data']);
					if (products.length > 0) {

						products.forEach((product) => {

							if (product.versions.length > 0) {
								affected_description += 'Affected: ' + affected['vendor_name'] + ' ' + product['name'] + ' ' + product['versions'].join(', ') + '\n';
							}

						});

					}

				}

			});

			if (affected_description.length > 0 && vulnerability['description'].includes(affected_description) === false) {
				vulnerability['description'] += '\n\n' + affected_description;
				vulnerability['description']  = vulnerability['description'].trim();
				vulnerability['state']        = 'invalid';
			}

		}

		// TODO: data['problemtype']

		if (isArray(data['impact']) === true) {

			data['impact'].filter((object) => isString(object['other'])).forEach((object) => {

				let severity = object['other'].toLowerCase();
				if (SEVERITY.includes(severity) === true) {
					vulnerability['severity'] = severity;
				}

			});

		}

		if (
			isObject(data['references']) === true
			&& isArray(data['references']['reference_data']) === true
		) {

			data['references']['reference_data'].forEach((ref) => {

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

		RESERVED.forEach((string) => {

			if (vulnerability['description'].toLowerCase().includes(string.toLowerCase()) === true) {

				if (vulnerability['state'] !== 'reserved') {
					vulnerability['state'] = 'reserved';
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
			'https://github.com/CVEProject/cvelist',
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


		this.filesystem.index('/').forEach((year) => {

			if (/^\/([0-9]{4})$/.test(year) === true) {

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

							if (vulnerability['state'] !== 'reserved') {
								this.vulnerabilities.update(vulnerability);
							}

						}

					});

				});

			}

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

