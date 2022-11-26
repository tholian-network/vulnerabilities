
import { Buffer } from 'buffer';
import https      from 'https';
import process    from 'process';
import zlib       from 'zlib';

import { console, isFunction, isObject, isString } from '../extern/base.mjs';



export const isWebscraper = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Webscraper]';
};



const request_interval = function() {

	let active   = this.__state.active;
	let inactive = this.__state.inactive;
	let requests = this.__state.requests;
	let limit    = this._settings.limit > 0 ? this._settings.limit : 10;

	if (
		active.length < limit
		&& inactive.length > 0
	) {

		inactive.splice(0, limit - active.length).forEach((todo) => {

			active.push(todo);


			console.log('Webscraper: Requesting "' + todo['url'] + '" ...');

			let options = {
				headers: {
					'Accept':          'application/json, text/plain;q=0.9, */*;q=0.8',
					'Accept-Encoding': 'identity',
					'Accept-Language': 'en-US,en;q=0.9',
					'User-Agent':      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36'
				}
			};

			if (this._settings.insecure === true) {
				process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
				options.rejectUnauthorized                  = false;
			}

			let request = https.request(todo['url'], options, (response) => {

				let chunks = [];

				response.on('data', (chunk) => {
					chunks.push(chunk);
				});

				response.on('error', () => {

					// TODO: --debug mode for intranet usage (with intercepted TLS/SSL)

					let index1 = active.indexOf(todo);
					if (index1 !== -1) {
						active.splice(index1, 1);
					}

					let index2 = requests.indexOf(request);
					if (index2 !== -1) {
						requests.splice(index2, 1);
					}

					todo['callback'](null, null);

				});

				response.on('end', () => {

					let type = null;

					let file = todo['url'].split('/').pop();
					if (file.includes('.') === true) {

						if (file.endsWith('.json') === true) {
							type = 'json';
						} else if (file.endsWith('.xml') === true) {
							type = 'xml';
						} else if (file.endsWith('.xhtml') === true) {
							type = 'xml';
						}

					}

					let content_type = response.headers['content-type'] || null;
					if (content_type !== null) {

						if (content_type === 'application/json') {
							type = 'json';
						} else if (content_type.startsWith('application/json;') === true) {
							type = 'json';
						} else if (content_type === 'application/ld+json') {
							type = 'json';
						} else if (content_type.startsWith('application/ld+json;') === true) {
							type = 'json';
						} else if (content_type === 'application/xhtml+xml') {
							type = 'xml';
						} else if (content_type.startsWith('application/xhtml+xml;') === true) {
							type = 'xml';
						} else if (content_type === 'application/xml') {
							type = 'xml';
						} else if (content_type.startsWith('application/xml;') === true) {
							type = 'xml';
						} else if (content_type === 'text/xml') {
							type = 'xml';
						} else if (content_type.startsWith('text/xml;') === true) {
							type = 'xml';
						}

					}

					if (type === 'json') {

						let buffer = Buffer.concat(chunks);
						let data   = null;

						let content_encoding = response.headers['content-encoding'] || null;
						if (content_encoding === 'gzip') {

							try {
								buffer = zlib.gunzipSync(buffer);
							} catch (err) {
								// Do Nothing
							}

						}

						try {
							data = JSON.parse(buffer.toString('utf8'));
						} catch (err) {
							data = null;
						}

						let index = active.indexOf(todo);
						if (index !== -1) {
							active.splice(index, 1);
						}

						todo['callback'](data, buffer);

					} else if (type === 'xml') {

						let buffer = Buffer.concat(chunks);
						let data   = null;

						// TODO: Parse xml into data

						let index1 = active.indexOf(todo);
						if (index1 !== -1) {
							active.splice(index1, 1);
						}

						let index2 = requests.indexOf(request);
						if (index2 !== -1) {
							requests.splice(index2, 1);
						}

						todo['callback'](data, buffer);

					} else {

						let buffer = Buffer.concat(chunks);

						let index1 = active.indexOf(todo);
						if (index1 !== -1) {
							active.splice(index1, 1);
						}

						let index2 = requests.indexOf(request);
						if (index2 !== -1) {
							requests.splice(index2, 1);
						}

						todo['callback'](null, buffer);

					}

				});

			});

			request.on('error', () => {

				let index1 = active.indexOf(todo);
				if (index1 !== -1) {
					active.splice(index1, 1);
				}

				let index2 = requests.indexOf(request);
				if (index2 !== -1) {
					requests.splice(index2, 1);
				}

				todo['callback'](null, null);

			});

			requests.push(request);
			request.end();

		});

	} else if (inactive.length === 0) {

		clearInterval(this.__state.interval);
		this.__state.interval = null;

	}

};



const Webscraper = function(settings) {

	settings = isObject(settings) ? settings : {};


	this._settings = Object.freeze(Object.assign({}, {
		insecure: false,
		limit:    10 // requests per second
	}, settings));

	if (this._settings.insecure === true) {
		console.warn('Webscraper: Insecure Flag is set, ignoring invalid TLS certificates!');
	}

	this.__state = {
		active:   [],
		inactive: [],
		requests: [],
		interval: null
	};

};


Webscraper.isWebscraper = isWebscraper;


Webscraper.prototype = {

	[Symbol.toStringTag]: 'Webscraper',

	destroy: function() {

		this.__state.active.splice(0, this.__state.active.length);
		this.__state.inactive.splice(0, this.__state.active.length);

		for (let r = 0, rl = this.__state.requests.length; r < rl; r++) {

			this.__state.requests[r].destroy();
			this.__state.requests.splice(r, 1);
			rl--;
			r--;

		}

		if (this.__state.interval !== null) {
			clearInterval(this.__state.interval);
			this.__state.interval = null;
		}

	},

	request: function(url, callback) {

		url      = isString(url)        ? url      : null;
		callback = isFunction(callback) ? callback : null;


		if (url !== null && callback !== null) {

			this.__state.inactive.push({
				url:      url,
				callback: callback
			});

			if (this.__state.interval === null) {
				this.__state.interval = setInterval(() => {
					request_interval.call(this);
				}, 1000);
			}

		} else if (callback !== null) {

			callback(null);

		}

	}

};


export { Webscraper };

