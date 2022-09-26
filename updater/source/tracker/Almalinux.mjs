
import { console, Emitter, isArray, isBuffer, isNumber, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                                       } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                                        } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities, containsSoftware              } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                                        } from '../../source/Webscraper.mjs';



// Alma Linux versions
const VERSION = [8, 9];

const SEVERITY = [
	'Critical',
	'Important',
	'Moderate',
	'Low',
	'None'
];


const merge = function(vulnerability, data) {

	if (
		isObject(data) === true
		&& isString(data['cve']) === true
		&& isArray(data['packages'])
	) {

		data['packages'].forEach((pkg) => {
			
			if (containsSoftware(vulnerability['software'], pkg) === false) {
				vulnerability['software'].push(pkg);
			}
		})

	}

};



const Almalinux = function(vulnerabilities) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/alma'
	});

	this.webscraper = new Webscraper({
		limit: 5
	});


	this.__state = {
		'vulnerabilities': {}
	};


	Emitter.call(this);

};


Almalinux.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Almalinux Security Tracker',
	[Symbol.toStringTag]:        'Almalinux',

	connect: function() {

		this.__state['alma-8'] = {};
		this.__state['alma-9'] = {};

		let buffer = [];
		VERSION.forEach((vNo) => {
			this.__state['v'+vNo]  = {};
			buffer[vNo] = this.filesystem.read('/v'+vNo+'_errata.json');

			if (isBuffer(buffer[vNo]) === true) {
				if (isArray(buffer[vNo]) === true) {
					buffer[vNo].forEach((entry) => {
						this.__state['vulnerabilities'][entry['updateinfo_id']] = entry;
					});
				}
			}
		}); 

		this.emit('connect');

	},

	disconnect: function() {

		this.webscraper.destroy();

		this.emit('disconnect');

	},

	merge: function() {

		console.info('Alma: Merge');

		Object.values(this.__state['alma-8']).forEach((entry) => {

			let pkglist = [];
			if(isObject(entry['pkglist']) === true && isArray(entry['pkglist']['packages']) === true) {
				entry['pkglist']['packages'].forEach((pkg) => {
					pkglist.push({name: pkg.name, version: '< ' + pkg.version, platform: 'alma-8'})
				});
			}
			
			if(isArray(entry['references']) === true) {
				entry['references'].forEach((ref) => {
					if(ref['type'] == 'cve') {
						let almaPkgVuln = {
							cve: ref['id'],
							packages: pkglist
						}
						
						let vulnerability = this.vulnerabilities.get(ref['id']);
						if (vulnerability['_is_edited'] === false) {
							merge.call(this, vulnerability, almaPkgVuln);
							this.vulnerabilities.update(vulnerability);
						}
					}
					
				});
			}

		});

		Object.values(this.__state['alma-9']).forEach((entry) => {

			let pkglist = [];
			if(isObject(entry['pkglist']) === true && isArray(entry['pkglist']['packages']) === true) {
				entry['pkglist']['packages'].forEach((pkg) => {
					pkglist.push({name: pkg.name, version: '< ' + pkg.version, platform: 'alma-9'})
				});
			}
			
			if(isArray(entry['references']) === true) {
				entry['references'].forEach((ref) => {
					if(ref['type'] == 'cve') {
						let almaPkgVuln = {
							cve: ref['id'],
							packages: pkglist
						}
						
						let vulnerability = this.vulnerabilities.get(ref['id']);
						if (vulnerability['_is_edited'] === false) {
							merge.call(this, vulnerability, almaPkgVuln);
							this.vulnerabilities.update(vulnerability);
						}
					}
					
				});
			}

		});

		setTimeout(() => {

			console.info('Alma: Merge complete.');

			this.emit('merge');

		}, 0);

	},

	update: function() {

		console.info('Alma: Update');
		this.webscraper.request('https://errata.almalinux.org/8/errata.json', (data) => {
			if ( isArray(data) ) {
				this.filesystem.write('/v8_errata.json', data);

				data.forEach((entry) => {

					if (isObject(entry) === true && isString(entry['type']) === true && entry['type'] == 'security') {
						this.__state['alma-8'][entry['updateinfo_id']] = entry;
					}

				});
			}

			this.webscraper.request('https://errata.almalinux.org/9/errata.json', (data) => {
				if ( isArray(data) ) {
					this.filesystem.write('/v9_errata.json', data);

					data.forEach((entry) => {

						if (isObject(entry) === true && isString(entry['type']) === true && entry['type'] == 'security') {
							this.__state['alma-9'][entry['updateinfo_id']] = entry;
						}

					});

					
					this.once('merge', () => {
						console.info('Alma: Update complete.');
						this.emit('update');
					});
			
					this.merge();
					
				}
			});

		});

		

		
	}

});


export { Almalinux };