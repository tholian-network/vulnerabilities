
import path    from 'path';
import process from 'process';
import url     from 'url';



const action = (() => {

	let value = Array.from(process.argv).slice(2).filter((v) => v.startsWith('--') === false).shift() || '';

	if (/^([update]{6})$/g.test(value) === true) {
		return 'update';
	} else if (/^([merge]{5})$/g.test(value) === true) {
		return 'merge';
	}

	return 'help';

})();

const flags = (() => {

	let flags = {
		database: null,
		debug:    false
	};

	Array.from(process.argv).filter((v) => v.startsWith('--') === true).forEach((flag) => {

		let tmp = flag.substr(2).split('=');
		if (tmp.length === 2) {

			let key = tmp[0];
			let val = tmp[1];

			let num = parseInt(val, 10);
			if (Number.isNaN(num) === false && (num).toString() === val) {
				val = num;
			}

			if (val === 'true')  val = true;
			if (val === 'false') val = false;
			if (val === 'null')  val = null;

			flags[key] = val;

		}

	});

	return flags;

})();

const root = (() => {

	return path.resolve(url.fileURLToPath(import.meta.url), '../../../');

})();



const ENVIRONMENT = {

	action: action,
	flags:  flags,
	root:   root

};


export { ENVIRONMENT };

