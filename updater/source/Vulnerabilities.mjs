
import { isArray, isBoolean, isObject, isString } from '../extern/base.mjs';
import { ENVIRONMENT                            } from '../source/ENVIRONMENT.mjs';
import { Filesystem                             } from '../source/Filesystem.mjs';



export const isVulnerabilities = function(obj) {
	return Object.prototype.toString.call(obj) === '[object Vulnerabilities]';
};



const isIdentifier = function(identifier) {

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

	}

	return false;

};

const isVulnerability = function(vulnerability) {

	if (
		isObject(vulnerability) === true
		&& isIdentifier(vulnerability['id']) === true
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

const create = function(identifier) {

	return {
		'id':          identifier,
		'description': '',
		'hardware':    [],
		'software':    [],
		'references':  [],
		'severity':    null,
		'state':       'invalid',
		'_is_edited':  false
	};

};



const Vulnerabilities = function(settings) {

	settings = isObject(settings) ? settings : {};


	this.filesystem = new Filesystem({
		root: isString(settings.database) ? settings.database : ENVIRONMENT.root + '/vulnerabilities'
	});

	this.__state = {
		updated:         [],
		vulnerabilities: {}
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
				this.__state[vulnerability['id']] = vulnerability;
			}

		});

		this.emit('connect');

	},

	disconnect: function() {

		// TODO: Write everything to filesystem
		// Validate each entry
		// - collect disputed for /editor/data/disputed.json
		// - collect invalid for /editor/data/invalid.json
		// - collect rejected for /editor/data/rejected.json

	},

	get: function(identifier) {

		identifier = isIdentifier(identifier) ? identifier : null;


		if (identifier !== null) {

			let vulnerability = this.__state.vulnerabilities[identifier] || null;
			if (vulnerability === null) {
				vulnerability = create(identifier);
			}

			return vulnerability;

		}


		return create(null);

	},

	update: function(vulnerability) {

		vulnerability = isVulnerability(vulnerability) ? vulnerability : null;


		if (vulnerability !== null) {

			let identifier = vulnerability['id'];

			this.__state.vulnerabilities[identifier] = vulnerability;

			if (this.__state.updated.includes(identifier) === false) {
				this.__state.updated.push(identifier);
			}

			return true;

		}


		return false;

	}

};


export { Vulnerabilities };

