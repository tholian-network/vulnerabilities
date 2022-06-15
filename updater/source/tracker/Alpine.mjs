
import { console, Emitter, isArray, isObject, isString        } from '../../extern/base.mjs';
import { ENVIRONMENT                                          } from '../../source/ENVIRONMENT.mjs';
import { Filesystem                                           } from '../../source/Filesystem.mjs';
import { isVulnerabilities, Vulnerabilities, containsSoftware } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                           } from '../../source/Webscraper.mjs';



const RELEASES = {
	'edge': [ 'edge-main', 'edge-community' ],
	'3.16': [ '3.16-main', '3.16-community' ],
	'3.15': [ '3.15-main' ],
	'3.14': [ '3.14-main' ],
	'3.13': [ '3.13-main' ]
};



const Alpine = function(vulnerabilities) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/alpine'
	});

	this.webscraper = new Webscraper({
		limit: 2
	});


	this.__state = {
		'fixes': {},
		'vulns': {}
	};


	Emitter.call(this);

};


Alpine.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Alpine Security Issue Tracker',
	[Symbol.toStringTag]:        'Alpine',

	connect: function() {

		// TODO: Read from filesystem cache to this.__state['fixes']
		// TODO: Read from filesystem cache to this.__state['vulns']

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
	},

	update: function() {

		console.info('Alpine: Update');


		Object.keys(RELEASES).forEach((release) => {

			RELEASES[release].forEach((branch) => {

				this.webscraper.request('https://security.alpinelinux.org/branch/' + branch, (data) => {

					console.log(data);

					// TODO: Implement me
					// process.exit();

				});

			});

		});

	}

});


export { Alpine };

