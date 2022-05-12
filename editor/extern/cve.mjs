
import { isObject, isString } from './base.mjs';



const parse = function(row) {

	// TODO: Parse row back to CVE structure

};

const parseProperty = function(cve, property, str) {
	// TODO: Parse text fields back to properties
};

const render = function(cve) {

	let tr   = document.createElement('tr');
	let td_1 = document.createElement('td');
	let td_2 = document.createElement('td');
	let td_3 = document.createElement('td');
	let td_4 = document.createElement('td');
	let td_5 = document.createElement('td');
	let td_6 = document.createElement('td');

	tr.setAttribute('data-id',       cve['id']);
	tr.setAttribute('data-selected', false);

	td_1.innerHTML = '<input type="checkbox" value="' + cve['id'] + '">';
	td_2.innerHTML = renderProperty(cve, 'id');
	td_3.innerHTML = '<textarea wrap="soft">' + renderProperty(cve, 'description') + '</textarea>';
	td_4.innerHTML = '<textarea wrap="off">'  + renderProperty(cve, 'hardware')    + '</textarea>';
	td_5.innerHTML = '<textarea wrap="off">'  + renderProperty(cve, 'software')    + '</textarea>';
	td_6.innerHTML = '<textarea wrap="off">'  + renderProperty(cve, 'references')  + '</textarea>';

	tr.appendChild(td_1);
	tr.appendChild(td_2);
	tr.appendChild(td_3);
	tr.appendChild(td_4);
	tr.appendChild(td_5);
	tr.appendChild(td_6);

	setTimeout(() => {

		Array.from(tr.querySelectorAll('textarea')).forEach((textarea) => {

			textarea.onchange = () => {
				tr.querySelector('input[type="checkbox"]').checked = true;
				tr.setAttribute('data-selected', true);
			};

		});

	}, 0);

	return tr;

};

const renderProperty = function(cve, property) {

	let str = '';

	if (property === 'id') {

		str = cve['id'] || 'CVE-YYYY-NNNN';

	} else if (property === 'description') {

		str = cve['description'] || '';

	} else if (property === 'hardware') {

		str = cve['hardware'].map((hardware) => {

			let chunk = '';

			chunk += (hardware['vendor'] || 'Unknown Vendor');
			chunk += ' | ';
			chunk += (hardware['product'] || 'Unknown Product');
			chunk += ' | ';
			chunk += (hardware['version'] || '0.0-1337.0');

			return chunk;

		}).join('\n');

	} else if (property === 'software') {

		str = cve['software'].map((software) => {

			let chunk = '';

			chunk += (software['vendor'] || 'Unknown Vendor');
			chunk += ' | ';
			chunk += (software['product'] || 'Unknown Product');
			chunk += ' | ';
			chunk += (software['version'] || '0.0-1337.0');

			return chunk;

		}).join('\n');

	} else if (property === 'references') {

		str = cve['references'].join('\n');

	}

	return str;

};

const sort = function(a, b) {

	if (
		isObject(a) === true
		&& isObject(b) === true
		&& isString(a['id']) === true
		&& isString(b['id']) === true
	) {

		let prefix_a = a['id'].substr(0, 'CVE-YYYY'.length)
		let prefix_b = b['id'].substr(0, 'CVE-YYYY'.length)

		if (prefix_a < prefix_b) return -1;
		if (prefix_a > prefix_b) return  1;

		if (prefix_a === prefix_b) {

			let suffix_a = a['id'].substr('CVE-YYYY-'.length);
			let suffix_b = b['id'].substr('CVE-YYYY-'.length);

			if (suffix_a.length < suffix_b.length) return -1;
			if (suffix_a.length > suffix_b.length) return  1;

			if (suffix_a.length === suffix_b.length) {

				if (suffix_a < suffix_b) return -1;
				if (suffix_a > suffix_b) return  1;

			}

		}

	}

	return 0;

};

export {
	parse,
	render,
	sort
};

