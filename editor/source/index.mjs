
import { isArray, isNumber   } from '/editor/extern/base.mjs';
import { parse, render, sort } from '/editor/extern/cve.mjs';



const INDEX  = [];
const SEARCH = window.SEARCH = {
	results: [],
	state:   null,
	page:    0
};



fetch('/editor/data/index.json').then((response) => {
	return response.json();
}).then((data) => {

	if (isArray(data) === true) {
		data.forEach((cve) => INDEX.push(cve));
	}

});



document.addEventListener('DOMContentLoaded', () => {

	const FIELDSET = {
		search:  document.querySelector('header input[name="search"]'),
		state:   document.querySelector('header select[name="state"]'),
		message: document.querySelector('header samp'),
		pages:   document.querySelector('header nav')
	};
	const FOOTER      = document.querySelector('footer');
	const TABLE       = document.querySelector('table tbody');
	const PLACEHOLDER = document.querySelector('table tbody tr');



	const onchange = function() {

		let search = FIELDSET.search.value.trim();
		let state  = FIELDSET.state.options[FIELDSET.state.options.selectedIndex].value;

		if (search === '') {
			search = null;
		}

		update_results(search, state, 1);

	};

	const onpagechange = function() {

		let search = FIELDSET.search.value.trim();
		let state  = FIELDSET.state.options[FIELDSET.state.options.selectedIndex].value;
		let page   = parseInt(this.getAttribute('data-page'), 10);

		if (search === '') {
			search = null;
		}

		if (Number.isNaN(page) === true) {
			page = 1;
		}

		update_results(search, state, page);

	};

	const reset_results = (rendered, filtered, state, page) => {

		Array.from(TABLE.childNodes).forEach((node) => {
			node.parentNode.removeChild(node);
		});

		Array.from(FIELDSET.pages.childNodes).forEach((node) => {
			node.parentNode.removeChild(node);
		});


		SEARCH.results.splice(0, SEARCH.results.length);
		SEARCH.state = state;
		SEARCH.page  = page;


		FIELDSET.message.innerHTML = rendered.length + ' of ' + filtered.length + ' CVEs';


		let pages = Math.round(filtered.length / 100);
		if (pages > 1) {

			// User should search for something specific instead.
			let max = Math.floor(window.innerWidth / (32 + 16));
			if (pages > max) {
				pages = max;
			}


			for (let page = 1; page <= pages; page++) {

				let button = document.createElement('button');

				button.innerHTML = page;
				button.setAttribute('data-page', page);

				button.onclick = function() {
					onpagechange.call(this);
				};

				FIELDSET.pages.appendChild(button);

			}

		}

	};

	const update_results = (search, state, page) => {

		console.log('update_results', search, state, page);

		search = isString(search) ? search.trim().toLowerCase() : '';
		page   = isNumber(page)   ? page                        : 1;


		if (page < 1) {
			page = 1;
		}

		if (PLACEHOLDER.parentNode !== null) {
			PLACEHOLDER.parentNode.removeChild(PLACEHOLDER);
		}

		let results  = [];
		let filtered = INDEX.filter((cve) => {

			if (state === 'unedited') {
				return cve['state'] !== 'edited';
			} else {
				return cve['state'] === state;
			}
		}).filter((cve) => {

			if (search !== '') {
				return cve['text'].toLowerCase().includes(search);
			}

			return true;

		}).sort(sort);

		let rendered = filtered.slice((page - 1) * 100, page * 100);
		if (rendered.length > 0) {

			reset_results(rendered, filtered, state, page);

			rendered.forEach((cve) => {

				fetch('/vulnerabilities/' + cve['id'] + '.json').then((response) => {
					return response.json();
				}).then((data) => {

					// TODO: Search data
					results.push(data);
					render_incremental(results);

				}).catch((err) => {

					let data = {
						id:          cve['id'],
						description: null,
						hardware:    [],
						provider:    null,
						software:    [],
						references:  [],
						_edited_:    false
					};

					results.push(data);
					render_incremental(results);

				});

			});

		}

	};

	const render_incremental = function(results, state) {

		if (SEARCH.results.length < results.length) {

			let todo = results.slice(SEARCH.results.length);
			if (todo.length > 0) {

				todo.map((cve) => {

					return {
						cve: cve,
						row: render(cve)
					};

				}).forEach((entry) => {
					TABLE.appendChild(entry.row);
					SEARCH.results.push(entry);
				});

			}

		}

	};



	FIELDSET.search.addEventListener('change', onchange);
	FIELDSET.state.addEventListener('change', onchange);

	TABLE.addEventListener('click', (event) => {

		let target = event.target;
		if (
			target !== null
			&& target.tagName === 'INPUT'
			&& target.type === 'checkbox'
		) {

			let row = TABLE.querySelector('tr[data-id="' + target.value + '"]');
			if (row !== null) {
				row.setAttribute('data-selected', target.checked);
			}


			let selected = Array.from(TABLE.querySelectorAll('tr[data-selected="true"]'));
			if (selected.length > 0) {
				FOOTER.className = 'visible';
			} else {
				FOOTER.className = '';
			}

		}

	});

	window.addEventListener('resize', () => {

		let max     = Math.floor(window.innerWidth / (32 + 16));
		let buttons = Array.from(FIELDSET.pages.childNodes);

		if (buttons.length > max) {

			buttons.slice(max).forEach((button) => {
				button.parentNode.removeChild(button);
			});

		}

	});

	setTimeout(() => {
		update_results(null, 'unedited', 1);
	}, 250);

}, true);

