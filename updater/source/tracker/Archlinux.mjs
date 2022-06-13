
import { console, Emitter, isArray, isObject, isString        } from '../../extern/base.mjs';
import { ENVIRONMENT                                          } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                           } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities, containsSoftware } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                           } from '../../source/Webscraper.mjs';



const SEVERITY = [
	'critical',
	'high',
	'medium',
	'low'
];



const download_avg = function(avg_id, callback) {

	this.webscraper.request('https://security.archlinux.org/avg/' + avg_id + '.json', (avg_details) => {

		if (
			isObject(avg_details) === true
			&& isString(avg_details['name']) === true
			&& avg_details['name'].startsWith('AVG-') === true
			&& avg_details['name'] === avg_id
		) {

			this.filesystem.write('/' + avg_id + '.json', avg_details);
			this.__state['avg'][avg_id] = avg_details;

			callback(avg_details);

		} else {

			callback(null);

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
			this.__state['cve'][cve_id] = cve_details;

			callback(cve_details);

		} else {

			callback(null);

		}

	});

};

const merge = function(vulnerability, data) {

	if (
		isObject(data) === true
		&& isString(data['description']) === true
		&& isArray(data['groups']) === true
		&& isArray(data['references']) === true
		&& isString(data['severity']) === true
	) {

		if (isString(data['description']) === true) {

			let description = data['description'].trim();
			if (vulnerability['description'].includes(description) === false) {
				vulnerability['description'] += '\n\n' + description;
				vulnerability['description']  = vulnerability['description'].trim();
			}

		}

		if (isArray(data['groups']) === true) {

			data['groups'].forEach((avg_id) => {

				let avg = this.__state['avg'][avg_id] || null;

				if (
					isObject(avg) === true
					&& isString(avg['affected']) === true
					&& isString(avg['status']) === true
					&& isArray(avg['packages']) === true
					&& isArray(avg['references']) === true
				) {

					if (avg['status'] === 'Fixed') {

						if (isString(avg['fixed']) === true) {

							avg['packages'].forEach((name) => {

								let software = {
									name:     name,
									platform: 'archlinux',
									version:  '< ' + avg['fixed'].trim()
								};

								if (containsSoftware(vulnerability['software'], software) === false) {
									vulnerability['software'].push(software);
								}

							});

						}

					} else if (avg['status'] === 'Vulnerable') {

						if (isString(avg['affected']) === true) {

							avg['packages'].forEach((name) => {

								let software = {
									name:     name,
									platform: 'archlinux',
									version:  '*'
								};

								if (containsSoftware(vulnerability['software'], software) === false) {
									vulnerability['software'].push(software);
								}

							});

						}

					} else if (avg['status'] === 'Not affected') {

						if (isString(avg['fixed']) === true) {

							avg['packages'].forEach((name) => {

								let software = {
									name:     name,
									platform: 'archlinux',
									version:  '< ' + avg['fixed'].trim()
								};

								if (containsSoftware(vulnerability['software'], software) === false) {
									vulnerability['software'].push(software);
								}

							});

						}

					} else if (avg['status'] === 'Unknown') {

						if (isString(avg['fixed']) === true) {

							avg['packages'].forEach((name) => {

								let software = {
									name:     name,
									platform: 'archlinux',
									version:  '< ' + avg['fixed'].trim()
								};

								if (containsSoftware(vulnerability['software'], software) === false) {
									vulnerability['software'].push(software);
								}

							});

						} else if (isString(avg['affected']) === true) {

							avg['packages'].forEach((name) => {

								let software = {
									name:     name,
									platform: 'archlinux',
									version:  avg['affected'].trim()
								};

								if (containsSoftware(vulnerability['software'], software) === false) {
									vulnerability['software'].push(software);
								}

							});

						}

					}

					if (isArray(avg['references']) === true) {

						avg['references'].map((url) => url.trim()).forEach((url) => {

							if (vulnerability['references'].includes(url) === false) {
								vulnerability['references'].push(url);
							}

						});

					}

				}

			});

		}

		if (isArray(data['references']) === true) {

			data['references'].map((url) => url.trim()).forEach((url) => {

				if (vulnerability['references'].includes(url) === false) {
					vulnerability['references'].push(url);
				}

			});

		}

		if (isString(data['severity']) === true) {

			let severity = data['severity'].toLowerCase();
			if (SEVERITY.includes(severity) === true) {
				vulnerability['severity'] = severity;
			}

		}

	}

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
		'avg': {},
		'cve': {}
	};


	Emitter.call(this);

};


Archlinux.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Archlinux Security Tracker',
	[Symbol.toStringTag]:        'Archlinux',

	connect: function() {

		this.__state['avg'] = {};
		this.__state['cve'] = {};

		this.filesystem.index('/', 'AVG-*.json').forEach((path) => {

			let avg = this.filesystem.read(path);
			if (
				isObject(avg) === true
				&& isString(avg['name']) === true
			) {
				this.__state['avg'][avg['name']] = avg;
			}

		});

		this.filesystem.index('/', 'CVE-*.json').forEach((path) => {

			let cve = this.filesystem.read(path);
			if (
				isObject(cve) === true
				&& isString(cve['name']) === true
			) {
				this.__state['cve'][cve['name']] = cve;
			}

		});


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

		console.info('Archlinux: Merge');


		Object.values(this.__state['cve']).forEach((entry) => {

			let vulnerability = this.vulnerabilities.get(entry['name']);
			if (vulnerability['_is_edited'] === false) {

				merge.call(this, vulnerability, entry);

				this.vulnerabilities.update(vulnerability);

			}

		});


		setTimeout(() => {

			console.info('Archlinux: Merge complete.');

			this.emit('merge');

		}, 0);

	},

	update: function() {

		console.info('Archlinux: Update');


		this.webscraper.request('https://security.archlinux.org/all.json', (data) => {

			if (isArray(data) === true) {

				this.filesystem.write('/all.json', data);


				let avg_downloads = [];
				let cve_downloads = [];


				Object.values(this.__state['cve']).forEach((cve) => {

					if (isArray(cve['groups']) === true) {

						cve['groups'].forEach((avg_id) => {

							let avg_details = this.__state['avg'][avg_id] || null;
							if (avg_details === null) {

								if (avg_downloads.includes(avg_id) === false) {
									avg_downloads.push(avg_id);
								}

							}

						});

					}

				});


				data.forEach((avg) => {

					let avg_details = this.__state['avg'][avg['name']] || null;
					if (isObject(avg_details) === true) {

						if (isArray(avg_details['issues']) === true) {

							avg_details['issues'].forEach((cve_id) => {

								let cve_details = this.__state['cve'][cve_id] || null;
								if (cve_details === null) {

									if (cve_downloads.includes(cve_id) === false) {
										cve_downloads.push(cve_id);
									}

								}

							});

						}

					} else {

						if (avg_downloads.includes(avg['name']) === false) {
							avg_downloads.push(avg['name']);
						}

					}

				});


				avg_downloads.forEach((avg_id) => {

					download_avg.call(this, avg_id, (avg_details) => {

						if (
							isObject(avg_details) === true
							&& isArray(avg_details['issues']) === true
						) {

							avg_details['issues'].forEach((cve_id) => {

								let cve_details = this.__state['cve'][cve_id] || null;
								if (cve_details === null) {

									if (cve_downloads.includes(cve_id) === false) {

										download_cve.call(this, cve_id, () => {

											let index = cve_downloads.indexOf(cve_id);
											if (index !== -1) {
												cve_downloads.splice(index, 1);
											}

										});

										cve_downloads.push(cve_id);

									}

								}

							});

						}

						let index = avg_downloads.indexOf(avg_id);
						if (index !== -1) {
							avg_downloads.splice(index, 1);
						}

					});

				});

				cve_downloads.forEach((cve_id) => {

					download_cve.call(this, cve_id, (cve_details) => {

						if (isArray(cve_details['groups']) === true) {

							cve_details['groups'].forEach((avg_id) => {

								let avg_details = this.__state['avg'][avg_id] || null;
								if (avg_details === null) {

									if (avg_downloads.includes(avg_id) === false) {

										download_avg.call(this, avg_id, () => {

											let index = avg_downloads.indexOf(avg_id);
											if (index !== -1) {
												avg_downloads.splice(index, 1);
											}

										});

										avg_downloads.push(avg_id);

									}

								}

							});

						}

						let index = cve_downloads.indexOf(cve_id);
						if (index !== -1) {
							cve_downloads.splice(index, 1);
						}

					});

				});


				if (avg_downloads.length > 0 || cve_downloads.length > 0) {
					console.log('Archlinux: Approximately ' + (avg_downloads.length + cve_downloads.length) + ' remaining downloads!');
				} else {
					console.log('Archlinux: No remaining downloads!');
				}

				let interval = setInterval(() => {

					if (avg_downloads.length === 0 && cve_downloads.length === 0) {

						clearInterval(interval);
						interval = null;

						this.once('merge', () => {

							console.info('Archlinux: Update complete.');

							this.emit('update');

						});

						this.merge();

					}

				}, 1000);

			}

		});

	}

});


export { Archlinux };

