
import fs      from 'fs';
import path    from 'path';
import process from 'process';
import url     from 'url';



const ROOT     = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../');
const KEYWORDS = Array.from(process.argv.slice(2)).map((val) => val.toLowerCase());



const show_help = () => {

	console.info('');
	console.info('Tholian Vulnerabilities Database Search');
	console.info('');

	console.log('');
	console.log('Usage: search [Keyword...]');
	console.log('');
	console.log('Usage Notes:');
	console.log('');
	console.log('    This is a fuzzy search, so it will display more matching CVE IDs with more keywords.');
	console.log('');
	console.log('Examples:');
	console.log('');
	console.log('    search "Microsoft"');
	console.log('    search "buffer overflow"');
	console.log('');

};

if (KEYWORDS.length > 0) {

	fs.readdir(ROOT + '/vulnerabilities', (err, filenames) => {

		if (err === null) {

			let filtered = [];

			if (filenames.length > 0) {

				filenames.filter((file) => {
					return file.startsWith('CVE-') && file.endsWith('.json');
				}).map((file) => {

					let cve = null;

					try {
						cve = JSON.parse(fs.readFileSync(ROOT + '/vulnerabilities/' + file).toString('utf8'));
					} catch (err) {
						cve = null;
					}

					return cve;

				}).filter((cve) => {
					return cve !== null;
				}).forEach((cve) => {

					let text = cve.description.toLowerCase();

					KEYWORDS.forEach((keyword) => {

						if (text.includes(keyword) === true) {

							console.warn('"' + cve.id + '" matches keyword "' + keyword + '"!');

							if (filtered.includes(cve) === false) {
								filtered.push(cve);
							}

						}

					});

				});

			}

			if (filtered.length > 0) {

				process.exit(0);

			} else {

				console.warn("No CVEs match the given keywords.");
				process.exit(0);

			}

		}

	});

} else {

	show_help();
	process.exit(1);

}

