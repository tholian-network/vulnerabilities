
import { console, Emitter, isArray, isNumber, isObject, isString } from '../../extern/base.mjs';
import { Filesystem                                              } from '../../source/Filesystem.mjs';
import { ENVIRONMENT                                             } from '../../source/ENVIRONMENT.mjs';
import { isUpdater                                               } from '../../source/Updater.mjs';
import { isVulnerabilities, Vulnerabilities, containsSoftware    } from '../../source/Vulnerabilities.mjs';
import { Webscraper                                              } from '../../source/Webscraper.mjs';



const GREGORIAN = {
	1:  31, 2:  28, 3:  31,
	4:  30, 5:  31, 6:  30,
	7:  31, 8:  31, 9:  30,
	10: 31, 11: 30, 12: 31
};

const PLATFORMS = {
	// TODO: Map platform identifiers to platform strings?
};

const SDKs = [
	11447, // ChakraCore
	11463, // .NET Core 1.0
	11464, // .NET Core 1.1
	11565, // .NET Core 2.1
	11608 // .NET Core 2.2
];



const encodeODATAComponent = function(str) {

	str = str.split('+').join('%2B');
	str = str.split(' ').join('+');
	str = str.split(':').join('%3A');
	str = str.split('$').join('%24');

	return str;

};

const isODATA = function(object) {

	if (
		isObject(object) === true
		&& isString(object['@odata.context']) === true
		&& isNumber(object['@odata.count']) === true
		&& isArray(object['value']) === true
	) {

		return true;

	}


	return false;

};

const toDays = function(year, month) {

	let is_leap_year = false;

	if (year % 4 !== 0) {
		is_leap_year = false;
	} else if (year % 100 !== 0) {
		is_leap_year = true;
	} else if (year % 400 !== 0) {
		is_leap_year = false;
	} else {
		is_leap_year = true;
	}

	if (is_leap_year === true && month === 2) {
		return GREGORIAN[month] + 1;
	} else {
		return GREGORIAN[month];
	}

};

const toPage = function(step) {

	var page = (step).toString();

	if (page.length < 3) {
		return '000'.substr(0, 3 - page.length) + page;
	}

	return page;

};

const toURL = function(year, month, skip) {

	skip = isNumber(skip) ? skip : 0;


	let min    = year + '-' + (month < 10 ? '0' + month : month) + '-01T00:00:00+00:00';
	let max    = year + '-' + (month < 10 ? '0' + month : month) + '-' + toDays(year, month) + 'T23:59:59+00:00';
	let url    = 'https://api.msrc.microsoft.com/sug/v2.0/en-US/affectedProduct';
	let params = [];

	params.push(encodeODATAComponent('$orderBy') + '=' + encodeODATAComponent('releaseDate desc'));
	params.push(encodeODATAComponent('$filter')  + '=' + encodeODATAComponent('(releaseDate gt ' + min + ') and (releaseDate lt ' + max +')'));

	if (skip !== 0) {
		params.push(encodeODATAComponent('$skip') + '=' + encodeODATAComponent((skip).toString()));
	}

	return url + '?' + params.join('&');

};



const Microsoft = function(vulnerabilities, updater) {

	this.vulnerabilities = isVulnerabilities(vulnerabilities) ? vulnerabilities : new Vulnerabilities();
	this.updater         = isUpdater(updater)                 ? updater         : null;

	this.filesystem = new Filesystem({
		root: ENVIRONMENT.root + '/trackers/microsoft'
	});

	this.webscraper = new Webscraper({
		limit:    1,
		insecure: this.updater !== null ? this.updater._settings.insecure : false
	});


	this.__state = {
		'advisories': [],
		'metadata':   {}
	};


	Emitter.call(this);

};


Microsoft.prototype = Object.assign({}, Emitter.prototype, {

	[Symbol.for('description')]: 'Microsoft Security Tracker',
	[Symbol.toStringTag]:        'Microsoft',

	connect: function() {

		console.info('Microsoft: Connect');


		let metadata = this.filesystem.read('/metadata.json');
		if (isODATA(metadata) === true) {
			this.__state['metadata'] = metadata['value'][0];
		}

		this.filesystem.index('/', 'advisory-*.json').forEach((filename) => {

			if (filename.startsWith('/advisory-') === true && filename.endsWith('.json') === true) {

				let data = this.filesystem.read(filename);
				if (isODATA(data) === true) {

					let identifier = filename.substr(10, 7);

					if (isArray(this.__state['advisories'][identifier]) === false) {
						this.__state['advisories'][identifier] = [];
					}

					data['value'].forEach((advisory) => {
						this.__state['advisories'][identifier].push(advisory);
					});

				}

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

		console.info('Microsoft: Merge');


		let enums = {};

		if (
			isObject(this.__state['metadata'])
			&& isObject(this.__state['metadata']['metadata'])
			&& isString(this.__state['metadata']['metadata']['schemaName'])
			&& this.__state['metadata']['metadata']['schemaName'] === 'affectedProduct'
			&& isArray(this.__state['metadata']['metadata']['properties'])
			&& this.__state['metadata']['metadata']['properties'].length > 0
		) {

			this.__state['metadata']['metadata']['properties'].forEach((descriptor) => {

				enums[descriptor['schemaName']] = {};

				descriptor['propertyValues'].forEach((value) => {

					let num = parseInt(value['value'], 10);

					if (Number.isNaN(num) === false) {
						enums[descriptor['schemaName']][num] = value['displayName'];
					}

				});

			});

		}

		console.log(enums['platformId']);

		Object.keys(this.__state['advisories']).forEach((identifier) => {

			let advisories = this.__state['advisories'][identifier];
			if (advisories.length > 0) {

				advisories.forEach((advisory) => {

					// TODO: Filter out platforms that are SDKs (.NET, ASP.NET etc) and map them as a software-package for platform: windows instead
					// TODO: All advisories with a CVE identifier and a missing kbArticle can also be critical exploits, it might be necessary to cross-link this with existing exploit-db releases

					if (advisory['platformId'] === 9311 || advisory['platformId'] === 9312) {

						console.log(advisory['cveNumber'], advisory['platformId'], advisory['kbArticles'].map((v) => v['articleName']).join(','));
						// process.exit(1);

					}


					// TODO: Find out a way to describe packages correctly for Microsoft Products
					// Is Sharepoint Server a package or a distribution!?!?!?

				});

			}

			// TODO: merge_advisory.call(this, vulnerability, data);
			// TODO: Call this.vulnerabilities.update(vulnerability);

		});

	},

	update: function() {

		console.info('Microsoft: Update');


		let current_year       = new Date().getFullYear();
		let current_month      = new Date().getMonth() + 1; // 0 is January
		let current_identifier = current_year + '-' + (current_month < 10 ? '0' + current_month : current_month);

		if (isArray(this.__state['advisories'][current_identifier]) === true) {

			this.filesystem.index('/advisory-' + current_identifier + '-*.json').forEach((filename) => {
				this.filesystem.remove(filename);
			});

			delete this.__state['advisories'][current_identifier];

		}


		this.webscraper.request('https://api.msrc.microsoft.com/sug/v2.0/en-US/metadata', (metadata) => {

			if (isODATA(metadata) === true) {
				this.filesystem.write('/metadata.json', metadata);
				this.__state['metadata'] = metadata['value'][0];
			}

		});


		for (let year = 2010; year <= new Date().getFullYear(); year++) {

			for (let month = 1; month <= 12; month++) {

				let identifier = year + '-' + (month < 10 ? '0' + month : month);

				if (isArray(this.__state['advisories'][identifier]) === false) {

					this.webscraper.request(toURL(year, month), (data) => {

						if (isODATA(data) === true) {

							// 000 is step format, which means max 500 * 999 (499500) vulnerabilities per month scrape-able
							this.filesystem.write('/advisory-' + identifier + '-000.json', data);

							if (isArray(this.__state['advisories'][identifier]) === false) {
								this.__state['advisories'][identifier] = [];
							}

							if (data['value'].length > 0) {

								data['value'].forEach((advisory) => {
									this.__state['advisories'][identifier].push(advisory);
								});

							}

							if (data['@odata.count'] > 500) {

								let steps = Math.ceil(data['@odata.count'] / 500);

								for (let step = 1; step <= steps; step++) {

									this.webscraper.request(toURL(year, month, step * 500), (chunk) => {

										if (isODATA(chunk) === true) {

											this.filesystem.write('/advisory-' + identifier + '-' + toPage(step) + '.json', chunk);

											if (chunk['value'].length > 0) {

												chunk['value'].forEach((advisory) => {
													this.__state['advisories'][identifier].push(advisory);
												});

											}

										}

									});

								}

							}

						}

					});

				}

				if (year === current_year && month === current_month) {
					break;
				}

			}

		}

	}

});


export { Microsoft };

