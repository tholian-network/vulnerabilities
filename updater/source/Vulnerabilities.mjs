
import { console, isArray, isBoolean, isObject, isString } from '../extern/base.mjs';
import { ENVIRONMENT                                     } from '../source/ENVIRONMENT.mjs';
import { Filesystem                                      } from '../source/Filesystem.mjs';



export const isVulnerabilities = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Vulnerabilities]';
};


export const containsSoftware = function(software, entry) {

	if (
		isArray(software) === true
		&& isObject(entry) === true
	) {

		let found = null;

		for (let s = 0, sl = software.length; s < sl; s++) {

			let other = software[s];
			if (
				isObject(other) === true
				&& other['name'] === software['name']
				&& other['platform'] === software['platform']
				&& other['version'] === software['version']
			) {
				found = other;
				break;
			}

		}

		if (found !== null) {
			return true;
		}

	}

	return false;

};

const isIdentifier = function(identifier) {

	if (isString(identifier) === true) {

		if (identifier.startsWith('CVE-') === true) {

			let check = identifier.split('-');
			if (
				check.length === 3
				&& check[0] === 'CVE'
				&& /^([0-9]{4})$/g.test(check[1]) === true
				&& /^([0-9]+)$/g.test(check[2]) === true
			) {
				return true;
			}

		} else if (identifier.startsWith('DSA-') === true) {

			let check = identifier.split('-');
			if (
				(
					check.length === 2
					&& check[0] === 'DSA'
					&& /^([0-9]{3,5})$/g.test(check[1]) === true
				) || (
					check.length === 3
					&& check[0] === 'DSA'
					&& /^([0-9]{3,5})$/g.test(check[1]) === true
					&& /^([0-9]{1})$/g.test(check[2]) === true
				)
			) {
				return true;
			}

		}

	}

	return false;

};

const isVulnerability = function(vulnerability) {

	if (
		isObject(vulnerability) === true
		&& isIdentifier(vulnerability['id']) === true
		&& isString(vulnerability['description']) === true
		&& isArray(vulnerability['hardware']) === true
		&& isArray(vulnerability['software']) === true
		&& isArray(vulnerability['references']) === true
		&& (isString(vulnerability['severity']) === true || vulnerability['severity'] === null)
		&& isString(vulnerability['state']) === true
		&& isBoolean(vulnerability['_is_edited']) === true
	) {
		return true;
	}


	return false;

};

const updateVulnerability = function(vulnerability) {

	let state = vulnerability['state'];

	if (vulnerability['severity'] !== null) {

		if (vulnerability['description'].length > 0) {

			if (vulnerability['software'].length > 0 || vulnerability['hardware'].length > 0) {
				state = 'published';
			} else {
				state = 'invalid';
			}

		} else {
			state = 'invalid';
		}

	}

	if (
		vulnerability['state'] !== 'disputed'
		&& vulnerability['state'] !== 'rejected'
	) {
		vulnerability['state'] = state;
	}

	return vulnerability['state'];

};



const Vulnerabilities = function(settings) {

	settings = isObject(settings) ? settings : {};


	this.filesystem = new Filesystem({
		root: isString(settings.database) ? settings.database : ENVIRONMENT.root + '/vulnerabilities'
	});

	this.__state = {
		'editor':          {
			'disputed':  [],
			'invalid':   [],
			'published': [],
			'rejected':  []
		},
		'modified':        [],
		'vulnerabilities': {}
	};



	// TODO: Error correction dictionary
	// - Create dictionary from all software vendors and products
	// - Do an error correction that's based on statistical likeliness
	// - When writing the vulnerabilities database, use levenshtein distance to find out similarities.

};


Vulnerabilities.isVulnerabilities = isVulnerabilities;


Vulnerabilities.prototype = {

	[Symbol.toStringTag]: 'Vulnerabilities',

	connect: function() {

		this.filesystem.index('/', 'CVE-*.json').forEach((path) => {

			let vulnerability = this.filesystem.read(path);
			if (isVulnerability(vulnerability) === true) {
				this.__state['vulnerabilities'][vulnerability['id']] = vulnerability;
			}

		});

	},

	disconnect: function() {

		if (this.__state['modified'].length > 0) {

			this.__state['modified'].forEach((identifier) => {

				let vulnerability = this.__state['vulnerabilities'][identifier];
				if (isString(vulnerability['id']) === true) {
					this.filesystem.write('/' + vulnerability['id'] + '.json', vulnerability);
				}

			});

			console.info('Vulnerabilities: Updated ' + this.__state['modified'].length + ' Vulnerabilities.');


			this.__state['editor']['disputed']  = [];
			this.__state['editor']['invalid']   = [];
			this.__state['editor']['published'] = [];
			this.__state['editor']['rejected']  = [];

			for (let identifier in this.__state['vulnerabilities']) {

				let vulnerability = this.__state['vulnerabilities'][identifier];

				updateVulnerability(vulnerability);

				let state = vulnerability['state'];
				if (state === 'disputed') {
					this.filesystem.write('/' + identifier + '.json', vulnerability);
					this.__state['editor']['disputed'].push(identifier);
				} else if (state === 'invalid') {
					this.filesystem.write('/' + identifier + '.json', vulnerability);
					this.__state['editor']['invalid'].push(identifier);
				} else if (state === 'published') {
					// Do not write already published and unmodified vulnerabilities
					this.__state['editor']['published'].push(identifier);
				} else if (state === 'rejected') {
					this.filesystem.write('/' + identifier + '.json', vulnerability);
					this.__state['editor']['rejected'].push(identifier);
				}

			}


			let filesystem = new Filesystem({
				root: ENVIRONMENT.root + '/editor/data'
			});

			console.log('Vulnerabilities: Statistics');

			console.error('> ' + this.__state['editor']['invalid'].length   + ' invalid');
			console.warn('> '  + this.__state['editor']['rejected'].length  + ' rejected');
			console.log('> '   + this.__state['editor']['disputed'].length  + ' disputed');
			console.info('> '  + this.__state['editor']['published'].length + ' published');

			filesystem.write('/disputed.json',  this.__state['editor']['disputed'].sort());
			filesystem.write('/invalid.json',   this.__state['editor']['invalid'].sort());
			filesystem.write('/published.json', this.__state['editor']['published'].sort());
			filesystem.write('/rejected.json',  this.__state['editor']['rejected'].sort());

		} else {

			console.info('Vulnerabilities: Updated 0 Vulnerabilities.');

		}


		// TODO: Write everything to filesystem
		// Validate each entry
		// - collect disputed for /editor/data/disputed.json
		// - collect invalid for /editor/data/invalid.json
		// - collect rejected for /editor/data/rejected.json

	},

	get: function(identifier) {

		identifier = isString(identifier) ? identifier : null;


		if (identifier !== null) {

			let vulnerability = this.__state['vulnerabilities'][identifier] || null;
			if (vulnerability === null) {

				vulnerability = {
					'id':          identifier,
					'description': '',
					'hardware':    [],
					'software':    [],
					'references':  [],
					'severity':    null,
					'state':       'invalid',
					'_is_edited':  false
				};

			}

			return vulnerability;

		}


		return {
			'id':          null,
			'description': '',
			'hardware':    [],
			'software':    [],
			'references':  [],
			'severity':    null,
			'state':       'invalid',
			'_is_edited':  false
		};

	},

	update: function(vulnerability) {

		vulnerability = isVulnerability(vulnerability) ? vulnerability : null;


		if (vulnerability !== null) {

			let identifier = vulnerability['id'];

			this.__state['vulnerabilities'][identifier] = vulnerability;

			if (this.__state['modified'].includes(identifier) === false) {
				this.__state['modified'].push(identifier);
			}

			return true;

		}


		return false;

	}

};


export { Vulnerabilities };

