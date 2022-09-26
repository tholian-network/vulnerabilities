
import process from 'process';

import { console, Emitter, isObject, isString } from '../extern/base.mjs';
import { ENVIRONMENT                          } from '../source/ENVIRONMENT.mjs';
import { Vulnerabilities                      } from '../source/Vulnerabilities.mjs';
import { Alpine                               } from '../source/tracker/Alpine.mjs';
import { Archlinux                            } from '../source/tracker/Archlinux.mjs';
import { CVE                                  } from '../source/tracker/CVE.mjs';
import { CISA                                 } from '../source/tracker/CISA.mjs';
import { Debian                               } from '../source/tracker/Debian.mjs';
import { Almalinux                               } from '../source/tracker/Almalinux.mjs';
// import { Ubuntu                               } from '../source/tracker/Ubuntu.mjs';
// import { Microsoft                            } from '../source/tracker/Microsoft.mjs';



const CONSTRUCTORS = [
	CVE,
	CISA,
	Alpine,
	Archlinux,
	Debian,
	Almalinux
];

const TRACKERS = CONSTRUCTORS.map((Constructor) => Constructor.prototype[Symbol.toStringTag]);

export const isUpdater = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Updater]';
};



const Updater = function(settings) {

	settings = isObject(settings) ? settings : {};


	this._settings = Object.assign({
		action:   null,
		database: ENVIRONMENT.root + '/vulnerabilities',
		debug:    false,
		trackers: TRACKERS
	}, settings);

	if (this._settings.trackers.length > 0) {

		this._settings.trackers = this._settings.trackers.map((search) => {

			let found = null;

			for (let t = 0, tl = TRACKERS.length; t < tl; t++) {

				if (TRACKERS[t].toLowerCase() === search.toLowerCase()) {
					found = TRACKERS[t];
					break;
				}

			}

			return found;

		}).filter((name) => name !== null);

	}

	Object.freeze(this._settings);


	console.clear();
	console.log('Updater: Command-Line Arguments:');
	console.log(this._settings);


	this.vulnerabilities = new Vulnerabilities({
		database: this._settings.database
	});

	this.trackers = [];

	this.__state = {
		connected: false
	};


	if (this._settings.trackers.length > 0) {

		TRACKERS.forEach((name, c) => {

			if (this._settings.trackers.includes(name) === true) {
				this.trackers.push(new CONSTRUCTORS[c](this.vulnerabilities));
			}

		});

	}


	Emitter.call(this);


	this.on('connect', () => {

		console.info('Updater: Connect complete.');

		let action = this._settings.action || null;
		if (action === 'update') {

			this.once('update', () => {
				this.disconnect();
			});

			this.update();

		} else if (action === 'merge') {

			this.once('merge', () => {
				this.disconnect();
			});

			this.merge();

		}

	});

	this.on('merge', () => {
		console.info('Updater: Merge complete.');
	});

	this.on('update', () => {
		console.info('Updater: Update complete.');
	});

	this.on('disconnect', () => {

		let action = this._settings.action || null;
		if (action === 'update') {
			this.vulnerabilities.disconnect();
		} else if (action === 'merge') {
			this.vulnerabilities.disconnect();
		}

		console.info('Updater: Disconnect complete.');

	});


	process.on('SIGINT', () => {
		this.disconnect();
	});

	process.on('SIGQUIT', () => {
		this.disconnect();
	});

	process.on('SIGABRT', () => {
		this.disconnect();
	});

	process.on('SIGTERM', () => {
		this.disconnect();
	});

	process.on('error', () => {
		this.disconnect();
	});

};


Updater.isUpdater = isUpdater;
Updater.TRACKERS  = TRACKERS;


Updater.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.toStringTag]: 'Updater',

	connect: function() {

		if (this.__state.connected === false) {

			console.info('Updater: Connect');


			this.vulnerabilities.connect();


			let connecting = this.trackers.length;

			this.trackers.forEach((tracker) => {

				tracker.once('connect', () => {

					connecting--;

					if (connecting === 0) {

						this.__state.connected = true;
						this.emit('connect');

					}

				});

				tracker.connect();

			});


			return true;

		}


		return false;

	},

	destroy: function() {

		if (this.__state.connected === true) {
			return this.disconnect();
		}


		return false;

	},

	disconnect: function() {

		if (this.__state.connected === true) {

			this.__state.connected = false;
			this.emit('disconnect');

			return true;

		}


		return false;

	},

	is: function(state) {

		state = isString(state) ? state : null;


		if (state === 'connected') {

			if (this.__state.connected === true) {
				return true;
			}

		}


		return false;

	},

	merge: function() {

		if (this.__state.connected === true) {

			console.info('Updater: Merge');


			let trackers = this.trackers.filter((tracker) => {
				return tracker[Symbol.toStringTag] !== 'CVE';
			});

			if (trackers.length > 0) {

				let merging = trackers.length;

				trackers.forEach((tracker) => {

					tracker.once('merge', () => {

						merging--;

						if (merging === 0) {
							this.emit('merge');
						}

					});

					tracker.merge();

				});

				return true;

			}

		}


		return false;

	},

	update: function() {

		if (this.__state.connected === true) {

			console.info('Updater: Update');


			let cve = this.trackers.find((tracker) => {
				return tracker[Symbol.toStringTag] === 'CVE';
			}) || null;

			if (cve !== null) {

				let trackers = this.trackers.filter((tracker) => tracker !== cve);

				cve.once('update', () => {

					let updating = trackers.length - 1;

					trackers.forEach((tracker) => {

						tracker.once('update', () => {

							updating--;

							if (updating === 0) {
								this.emit('update');
							}

						});

						tracker.update();

					});

				});

				cve.update();

			} else {

				let updating = this.trackers.length;

				this.trackers.forEach((tracker) => {

					tracker.once('update', () => {

						updating--;

						if (updating === 0) {
							this.emit('update');
						}

					});

					tracker.update();

				});

			}

			return true;

		}


		return false;

	}

});


export { Updater };

