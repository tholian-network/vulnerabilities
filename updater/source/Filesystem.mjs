
import { Buffer } from 'buffer';
import fs         from 'fs';

import { console, isArray, isBuffer, isObject, isString } from '../extern/base.mjs';
import { ENVIRONMENT                                    } from '../source/ENVIRONMENT.mjs';



export const isFilesystem = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Filesystem]';
};

const isPath = function(str) {

	if (
		str.includes('../') === false
		&& str.includes('./') === false
		&& str.startsWith('/') === true
	) {
		return true;
	}

	return false;

};

const matches = function(name, pattern) {

	if (pattern.startsWith('*') === true) {

		return name.endsWith(pattern.substr(1));

	} else if (pattern.endsWith('*') === true) {

		return name.startsWith(pattern.substr(0, pattern.length - 1));

	} else if (pattern.includes('*') === true) {

		let prefix = pattern.split('*').shift();
		let suffix = pattern.split('*').pop();

		return name.startsWith(prefix) && name.endsWith(suffix);

	} else {

		return name.includes(pattern);

	}

};



const Filesystem = function(settings) {

	settings = isObject(settings) ? settings : {};


	this.root = isPath(settings.root) ? settings.root : ENVIRONMENT.root;


	if (this.exists('/') === false) {

		try {
			fs.mkdirSync(this.root, { recursive: true });
		} catch (err) {
			// Do nothing
		}

		if (this.exists('/') === false) {
			console.error('Filesystem: Cannot create root folder "' + this.root + '"!');
		}

	}

};


Filesystem.prototype = {

	[Symbol.toStringTag]: 'Filesystem',

	exists: function(path) {

		path = isPath(path) ? path : null;


		if (path !== null) {

			let realpath = this.root + path;
			let stat     = null;

			if (realpath.endsWith('/') === true) {
				realpath = realpath.substr(0, realpath.length - 1);
			}

			try {
				stat = fs.lstatSync(realpath);
			} catch (err) {
				stat = null;
			}

			if (stat !== null) {

				if (stat.isDirectory() === true) {
					return true;
				} else if (stat.isFile() === true) {
					return true;
				}

			}

		}


		return false;

	},

	index: function(path, pattern) {

		path    = isPath(path)      ? path    : null;
		pattern = isString(pattern) ? pattern : null;


		let results = [];

		if (path !== null) {

			try {

				let realpath = this.root + path;
				let prefix   = path;

				if (realpath.endsWith('/') === true) {
					realpath = realpath.substr(0, realpath.length - 1);
				}

				if (prefix.endsWith('/') === true) {
					prefix = path.substr(0, path.length - 1);
				}


				fs.readdirSync(realpath).forEach((name) => {

					if (pattern !== null) {

						if (matches(name, pattern) === true) {
							results.push(prefix + '/' + name);
						}

					} else {
						results.push(prefix + '/' + name);
					}

				});

			} catch (err) {
				// Do nothing
			}

		}

		return results;

	},

	read: function(path) {

		path = isPath(path) ? path : null;


		if (path !== null) {

			let buffer = null;

			try {
				buffer = fs.readFileSync(this.root + path);
			} catch (err) {
				// Do nothing
			}

			if (buffer !== null) {

				let type = path.split('/').pop().split('.').pop();
				if (type === 'json') {

					let data = null;

					try {
						data = JSON.parse(buffer.toString('utf8'));
					} catch (err) {
						data = null;
					}

					if (data !== null) {
						return data;
					}

				} else {

					return buffer;

				}

			}

		}


		return null;

	},

	remove: function(path) {

		path = isPath(path) ? path : null;


		if (path !== null) {

			let realpath = this.root + path;
			if (realpath.endsWith('/') === true) {
				realpath = realpath.substr(0, realpath.length - 1);
			}

			let stat = null;

			try {
				stat = fs.lstatSync(this.root + path);
			} catch (err) {
				stat = null;
			}

			if (stat !== null) {

				let result = false;

				if (stat.isDirectory() === true) {

					try {
						fs.rmSync(realpath, { recursive: true });
						result = true;
					} catch (err) {
						result = false;
					}

				} else if (stat.isFile() === true) {

					try {
						fs.unlinkSync(realpath);
						result = true;
					} catch (err) {
						result = false;
					}

				}

				return result;

			}

		}


		return false;

	},

	write: function(path, data) {

		path = isPath(path) ? path : null;


		if (path !== null) {

			if (isArray(data) === true || isObject(data) === true) {

				let buffer = null;

				try {
					buffer = Buffer.from(JSON.stringify(data, null, '\t'), 'utf8');
				} catch (err) {
					buffer = null;
				}

				if (buffer !== null) {

					let result = false;

					try {
						fs.writeFileSync(this.root + path, buffer);
						result = true;
					} catch (err) {
						result = false;
					}

					return result;

				}

			} else if (isBuffer(data) === true) {

				let result = false;

				try {
					fs.writeFileSync(this.root + path, data);
					result = true;
				} catch (err) {
					result = false;
				}

				return result;

			} else if (isString(data) === true) {

				let buffer = Buffer.from(data, 'utf8');
				let result = false;

				try {
					fs.writeFileSync(this.root + path, buffer);
					result = true;
				} catch (err) {
					result = false;
				}

				return result;

			}

		}


		return false;

	}

};


export { Filesystem };

