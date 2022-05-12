
import { console, Emitter, isArray, isObject, isString } from '../../extern/base.mjs';
import { ENVIRONMENT                                   } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                    } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities            } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                    } from '../../source/Webscraper.mjs';



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

const download_avg = function(avg_id, callback) {

	this.webscraper.request('https://security.archlinux.org/avg/' + avg_id + '.json', (avg_details) => {

		if (
			isObject(avg_details) === true
			&& isString(avg_details['name']) === true
			&& avg_details['name'].startsWith('AVG-') === true
			&& avg_details['name'] === avg_id
		) {

			this.filesystem.write('/' + avg_id + '.json', avg_details);
			this.__state[avg_id] = avg_details;

			callback(true);

		} else {

			callback(false);

		}

	});

};

const download_cve = function(cve_id, callback) {

	this.webscraper.request('https://security.archlinux.org/cve/' + cve_id + '.json', (cve_details) => {

		if (
			isObject(cve_details) === true
			&& isString(cve_details['name']) === true
			&& cve_details['name'].startsWith('CVE-') === true
			&& cve_details['name'] === cve_id
		) {

			this.filesystem.write('/' + cve_id + '.json', cve_details);
			this.__state[cve_id] = cve_details;

			callback(true);

		} else {

			callback(false);

		}

	});

};

const merge = function(vulnerability, data) {

	// TODO: Merge vulnerability with downstream Issue data

};

const update_vulnerabilities = function() {

	let results = {
		published: [],
		disputed:  [],
		rejected:  [],
		invalid:   []
	};

	this.filesystem.index('/', 'CVE-*.json').sort().map((path) => {

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
		if (vulnerability['_is_edited'] === false) {

			merge(vulnerability, entry['data']);

			if (vulnerability['state'] === 'published') {
				results['published'].push(vulnerability);
			} else if (vulnerability['state'] === 'disputed') {
				results['disputed'].push(vulnerability);
			} else if (vulnerability['state'] === 'rejected') {
				results['rejected'].push(vulnerability);
			} else if (vulnerability['state'] === 'invalid') {
				results['invalid'].push(vulnerability);
			}

			this.vulnerabilities.update(vulnerability);

		}

	});

	setTimeout(() => {
		this.emit('update', [ results ]);
	}, 0);

};



const Archlinux = function(vulnerabilities) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/archlinux'
	});

	this.webscraper = new Webscraper({
		limit: 5
	});


	this.__state = {
		avg: {},
		cve: {}
	};


	Emitter.call(this);

};


Archlinux.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Archlinux Security Tracker',
	[Symbol.toStringTag]:        'Archlinux',

	connect: function() {

		this.__state.avg = {};
		this.__state.cve = {};

		this.filesystem.index('/', 'AVG-*.json').forEach((path) => {

			let avg = this.filesystem.read(path);
			if (
				isObject(avg) === true
				&& isString(avg['name']) === true
			) {
				this.__state[avg['name']] = avg;
			}

		});

		this.filesystem.index('/', 'CVE-*.json').forEach((path) => {

			let cve = this.filesystem.read(path);
			if (
				isObject(cve) === true
				&& isString(cve['name']) === true
			) {
				this.__state[cve['name']] = cve;
			}

		});

		this.emit('connect');

	},

	disconnect: function() {

		this.webscraper.destroy();

		this.emit('disconnect');

	},

	update: function() {

		this.webscraper.request('https://security.archlinux.org/all.json', (data) => {

			if (isArray(data) === true) {

				this.filesystem.write('/all.json', data);


				let downloads = 0;

				data.forEach((avg) => {

					let avg_details = this.__state[avg['name']] || null;
					if (isObject(avg_details) === true) {

						if (isArray(avg_details['issues']) === true) {

							avg_details['issues'].forEach((cve_id) => {

								let cve_details = this.__state[cve_id] || null;
								if (cve_details === null) {

									downloads++;

									download_cve.call(this, cve_id, () => {
										downloads--;
									});

								}

							});

						}

					} else {

						downloads++;

						download_avg.call(this, avg['name'], (avg_details) => {

							if (
								isObject(avg_details) === true
								&& isArray(avg_details['issues']) === true
							) {

								avg_details['issues'].forEach((cve_id) => {

									let cve_details = this.__state[cve_id] || null;
									if (cve_details === null) {

										downloads++;

										download_cve.call(this, cve_id, () => {
											downloads--;
										});

									}

								});

							}

							downloads--;

						});

					}

				});


				let interval = setInterval(() => {

					if (downloads === 0) {

						clearInterval(interval);
						interval = null;

						update_vulnerabilities.call(this);

					}

				}, 1000);

			}

		});

	}

});


export { Archlinux };

