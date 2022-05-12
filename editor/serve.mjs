
import { Buffer   } from 'buffer';
import fs           from 'fs';
import http         from 'http';
import path         from 'path';
import process      from 'process';
import url          from 'url';
import { console  } from '../extern/base.mjs';



const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../');

const MIME_DEFAULT = { ext: 'bin', binary: true, format: 'application/octet-stream' };
const MIME = [

	// Media-Types are compliant with IANA assignments
	// https://www.iana.org/assignments/media-types

	// non-official
	{ ext: 'webmanifest', binary: false, format: 'application/manifest+json' },

	// application
	{ ext: 'json',  binary: false, format: 'application/json'       },
	{ ext: 'mjs',   binary: false, format: 'application/javascript' },
	{ ext: 'xml',   binary: false, format: 'application/xml'        },

	// font
	{ ext: 'otf',   binary: true, format: 'font/otf'   },
	{ ext: 'sfnt',  binary: true, format: 'font/sfnt'  },
	{ ext: 'ttf',   binary: true, format: 'font/ttf'   },
	{ ext: 'woff',  binary: true, format: 'font/woff'  },
	{ ext: 'woff2', binary: true, format: 'font/woff2' },

	// image
	{ ext: 'ico',   binary: true, format: 'image/x-icon' },

	// text
	{ ext: 'css',   binary: false, format: 'text/css'  },
	{ ext: 'csv',   binary: false, format: 'text/csv'  },
	{ ext: 'htm',   binary: false, format: 'text/html' },
	{ ext: 'html',  binary: false, format: 'text/html' }

];



const SERVER = http.createServer((request, response) => {

	let url = request.url;
	if (url.includes('?')) {
		url = url.split('?')[0];
	}

	let ext    = url.split('.').pop();
	let method = request.method;
	let mime   = MIME.find((m) => m.ext === ext) || MIME_DEFAULT;

	if (method === 'GET' && url === '/') {

		response.writeHead(307, {
			'Location': '/editor/index.html'
		});

		response.end();

	} else if (method === 'GET' && url === '/favicon.ico') {

		response.writeHead(307, {
			'Location': '/editor/design/favicon.ico'
		});

		response.end();

	} else if (
		method === 'POST'
		&& url.startsWith('/vulnerabilities-fixed/')
	) {

		// TODO: Implement update mechanism for fetch() from Editor

	} else if (
		method === 'GET'
		&& (
			url.startsWith('/editor/')
			|| url.startsWith('/vulnerabilities/')
			|| url.startsWith('/vulnerabilities-fixed/')
		)
	) {

		fs.readFile(ROOT + url, (err, buffer) => {

			if (err === null) {

				if (mime.binary === true) {

					response.writeHead(200, {
						'Content-Type':   mime.format,
						'Content-Length': buffer.length,
					});

					response.end(buffer);

				} else {

					response.writeHead(200, {
						'Content-Type':   mime.format,
						'Content-Length': buffer.length,
						'Charset':        'utf-8'
					});

					response.end(buffer, 'utf-8');

				}

			} else {

				response.writeHead(404);
				response.end('404: Not Found');

			}

		});

	} else {

		response.writeHead(403);
		response.end();

	}

});

SERVER.listen(8080);

console.info('Visit CVE Editor at http://localhost:8080/');

