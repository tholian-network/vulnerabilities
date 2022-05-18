
import process from 'process';

import { console, Emitter, isObject, isString } from '../extern/base.mjs';
import { ENVIRONMENT                          } from '../source/ENVIRONMENT.mjs';
import { Vulnerabilities                      } from '../source/Vulnerabilities.mjs';
import { Archlinux                            } from '../source/tracker/Archlinux.mjs';
// import { Debian                               } from '../source/tracker/Debian.mjs';
// import { Ubuntu                               } from '../source/tracker/Ubuntu.mjs';
// import { Microsoft                            } from '../source/tracker/Microsoft.mjs';
import { CVEList                              } from '../source/tracker/CVEList.mjs';



export const isUpdater = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Updater]';
};



const Updater = function(settings) {

	settings = isObject(settings) ? settings : {};


	this._settings = Object.freeze(Object.assign({
		action:   null,
		database: ENVIRONMENT.root + '/vulnerabilities',
		debug:    false
	}, settings));


	console.clear();
	console.log('Updater: Command-Line Arguments:');
	console.log(this._settings);


	this.vulnerabilities = new Vulnerabilities({
		database: this._settings.database
	});

	this.trackers = [
		new CVEList(this.vulnerabilities),
		new Archlinux(this.vulnerabilities),
		// new Debian(this.vulnerabilities),
		// new Ubuntu(this.vulnerabilities),
		// new Microsoft(this.vulnerabilities)
	];

	this.__state = {
		connected: false
	};


	Emitter.call(this);


	this.on('connect', () => {

		let action = this._settings.action || null;
		if (action === 'update') {
			this.update();
		} else if (action === 'merge') {
			this.merge();
		}

	});

	// Can't update if CVEList is not available
	this.trackers[0].on('error', () => {
		this.disconnect();
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


Updater.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.toStringTag]: 'Updater',

	connect: function() {

		if (this.__state.connected === false) {

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

			let merging = this.trackers.length - 1;

			this.trackers.slice(1).forEach((tracker) => {

				tracker.once('merge', () => {

					merging--;

					if (merging === 0) {
						this.emit('merge');
					}

				});

				tracker.merge();

			});

		}


		return false;

	},

	update: function() {

		if (this.__state.connected === true) {

			let cvelist = this.trackers[0];

			cvelist.once('update', () => {

				let updating = this.trackers.length - 1;

				this.trackers.slice(1).forEach((tracker) => {

					tracker.once('update', () => {

						updating--;

						if (updating === 0) {
							this.emit('update');
						}

					});

					tracker.update();

				});

			});

			cvelist.update();

			return true;

		}


		return false;

	}

});


export { Updater };

