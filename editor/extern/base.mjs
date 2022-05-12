
export const Array = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Array;

if (typeof Array.isArray !== 'function') {

	Array.isArray = function(arr) {
		return Object.prototype.toString.call(arr) === '[object Array]';
	};

}

if (typeof Array.prototype.remove !== 'function') {

	Array.prototype.remove = function(value) {

		let index = this.indexOf(value);

		while (index !== -1) {

			this.splice(index, 1);

			index = this.indexOf(value);

		}

		return this;

	};

}

if (typeof Array.prototype.removeEvery !== 'function') {

	Array.prototype.removeEvery = function(predicate/*, thisArg */) {

		if (this === null || this === undefined) {
			throw new TypeError('Array.prototype.removeEvery called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}


		let list    = Object(this);
		let length  = list.length >>> 0;
		let thisArg = arguments.length >= 2 ? arguments[1] : void 0;
		let value;

		for (let i = 0; i < length; i++) {

			if (i in list) {

				value = list[i];

				if (!!predicate.call(thisArg, value, i, list) === true) {
					this.splice(i, 1);
					length--;
					i--;
				}

			}

		}

		return this;

	};

}

export const isArray = Array.isArray;


export const Boolean = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Boolean;

if (typeof Boolean.isBoolean !== 'function') {

	Boolean.isBoolean = function(bol) {
		return Object.prototype.toString.call(bol) === '[object Boolean]';
	};

}

export const isBoolean = Boolean.isBoolean;


export const Date = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Date;

if (typeof Date.isDate !== 'function') {

	Date.isDate = function(dat) {
		return Object.prototype.toString.call(dat) === '[object Date]';
	};

}

export const isDate = Date.isDate;


export const Function = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Function;

if (typeof Function.isFunction !== 'function') {

	Function.isFunction = function(fun) {
		return Object.prototype.toString.call(fun) === '[object Function]';
	};

}

export const isFunction = Function.isFunction;


export const Map = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Map;

if (typeof Map.isMap !== 'function') {

	Map.isMap = function(map) {
		return Object.prototype.toString.call(map) === '[object Map]';
	};

}

export const isMap = Map.isMap;


export const Number = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Number;

if (typeof Number.isNumber !== 'function') {

	Number.isNumber = function(num) {
		return Object.prototype.toString.call(num) === '[object Number]';
	};

}

export const isNumber = Number.isNumber;


export const Object = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Object;

if (typeof Object.isObject !== 'function') {

	Object.isObject = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

}

if (typeof Object.clone !== 'function') {

	Object.clone = function(target) {

		target = target instanceof Object ? target : {};


		for (let a = 1, al = arguments.length; a < al; a++) {

			let source = arguments[a];
			if (source) {

				for (let prop in source) {

					if (Object.prototype.hasOwnProperty.call(source, prop) === true) {

						let other_value = source[prop];
						if (other_value instanceof Array) {

							target[prop] = [];
							Object.clone(target[prop], source[prop]);

						} else if (other_value instanceof Object) {

							target[prop] = {};
							Object.clone(target[prop], source[prop]);

						} else {

							target[prop] = source[prop];

						}

					}

				}

			}

		}


		return target;

	};

}

export const isObject = Object.isObject;


export const RegExp = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).RegExp;

if (typeof RegExp.isRegExp !== 'function') {

	RegExp.isRegExp = function(reg) {
		return Object.prototype.toString.call(reg) === '[object RegExp]';
	};

}

export const isRegExp = RegExp.isRegExp;


export const Set = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).Set;

if (typeof Set.isSet !== 'function') {

	Set.isSet = function(set) {
		return Object.prototype.toString.call(set) === '[object Set]';
	};

}

export const isSet = Set.isSet;


export const String = (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this)).String;

if (typeof String.isString !== 'function') {

	String.isString = function(str) {
		return Object.prototype.toString.call(str) === '[object String]';
	};

}

export const isString = String.isString;


export const Emitter = (function(global) {

	const format = (num) => {

		num = typeof num === 'number' ? num : 0;


		let str = '' + num;

		if (str.length < 2) {
			str = '0' + str;
		}

		return str;

	};

	const render_date = (date) => {
		return date.year + '-' + format(date.month) + '-' + format(date.day);
	};

	const render_time = (time) => {
		return format(time.hour) + ':' + format(time.minute) + ':' + format(time.second | 0) + '.' + (time.second - (time.second | 0)).toFixed(3).substr(2);
	};

	const toDatetime = (date) => {

		date = date instanceof Date ? date : new Date();

		return {
			year:   date.getFullYear(),
			month:  date.getMonth() + 1,
			day:    date.getDate(),
			hour:   date.getHours(),
			minute: date.getMinutes(),
			second: date.getSeconds() + (date.getMilliseconds() / 1000)
		};

	};

	const isArray = (obj) => {
		return Object.prototype.toString.call(obj) === '[object Array]';
	};

	const isFunction = (obj) => {
		return Object.prototype.toString.call(obj) === '[object Function]';
	};

	const isString = (obj) => {
		return Object.prototype.toString.call(obj) === '[object String]';
	};


	const Emitter = function() {

		this.__events  = {};
		this.__journal = [];

	};


	Emitter.isEmitter = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Emitter]';
	};


	Emitter.prototype = {

		[Symbol.toStringTag]: 'Emitter',

		toJSON: function() {

			let data = {
				events:  Object.keys(this.__events),
				journal: []
			};

			if (this.__journal.length > 0) {

				this.__journal.forEach((entry) => {

					data.journal.push({
						event: entry.event,
						date:  render_date(entry.date),
						time:  render_time(entry.time)
					});

				});

			}

			return {
				'type': 'Emitter',
				'data': data
			};

		},

		emit: function(event, args) {

			event = isString(event) ? event : null;
			args  = isArray(args)   ? args  : [];


			if (event !== null) {

				let events = this.__events[event] || null;
				if (events !== null) {

					let datetime = toDatetime();

					this.__journal.push({
						event: event,
						date: {
							year:   datetime.year,
							month:  datetime.month,
							day:    datetime.day,
							hour:   null,
							minute: null,
							second: null
						},
						time: {
							year:   null,
							month:  null,
							day:    null,
							hour:   datetime.hour,
							minute: datetime.minute,
							second: datetime.second
						}
					});


					let data = null;

					for (let e = 0, el = events.length; e < el; e++) {

						let entry = events[e];
						if (entry.once === true) {

							try {

								let result = entry.callback.apply(null, args);
								if (result !== null && result !== undefined) {
									data = result;
								}

							} catch (err) {
								console.error(err);
							}

							events.splice(e, 1);
							el--;
							e--;

						} else {

							try {

								let result = entry.callback.apply(null, args);
								if (result !== null && result !== undefined) {
									data = result;
								}

							} catch (err) {
								console.error(err);
							}

						}

					}

					return data;

				}

			}


			return null;

		},

		has: function(event, callback) {

			event    = isString(event)      ? event    : null;
			callback = isFunction(callback) ? callback : null;


			if (event !== null) {

				let events = this.__events[event] || null;
				if (events !== null) {

					if (callback !== null) {

						let check = events.filter((e) => e.callback === callback);
						if (check.length > 0) {
							return true;
						}

					} else {

						if (events.length > 0) {
							return true;
						}

					}

				}

			}


			return false;

		},

		on: function(event, callback) {

			event    = isString(event)      ? event    : null;
			callback = isFunction(callback) ? callback : null;


			if (event !== null && callback !== null) {

				let events = this.__events[event] || null;
				if (events === null) {
					events = this.__events[event] = [];
				}

				events.push({
					callback: callback,
					once:     false
				});

				return true;

			}


			return false;

		},

		off: function(event, callback) {

			event    = isString(event)      ? event    : null;
			callback = isFunction(callback) ? callback : null;


			if (event !== null) {

				let events = this.__events[event] || null;
				if (events !== null) {

					if (callback !== null) {
						this.__events[event] = events.filter((e) => e.callback !== callback);
					} else {
						this.__events[event] = [];
					}

				}

				return true;

			}


			return false;

		},

		once: function(event, callback) {

			event    = isString(event)      ? event    : null;
			callback = isFunction(callback) ? callback : null;


			if (event !== null && callback !== null) {

				let events = this.__events[event] || null;
				if (events === null) {
					events = this.__events[event] = [];
				}

				events.push({
					callback: callback,
					once:     true
				});

				return true;

			}


			return false;

		}

	};

	if (typeof global.Emitter === 'undefined') {
		global.Emitter = Emitter;
	}

	return Emitter;

})(typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this));

export const isEmitter = Emitter.isEmitter;


const _coerce = function(num) {
	num = ~~Math.ceil(+num);
	return num < 0 ? 0 : num;
};

const _clean_base64 = function(str) {

	str = str.trim().replace(/[^+/0-9A-z]/g, '');

	while (str.length % 4 !== 0) {
		str = str + '=';
	}

	return str;

};

const _utf8_to_bytes = function(str) {

	let bytes = [];

	for (let s = 0; s < str.length; s++) {

		let byt = str.charCodeAt(s);
		if (byt <= 0x7F) {
			bytes.push(byt);
		} else {

			let start = s;
			if (byt >= 0xD800 && byt <= 0xDFF) s++;

			let tmp = encodeURIComponent(str.slice(start, s + 1)).substr(1).split('%');
			for (let t = 0; t < tmp.length; t++) {
				bytes.push(parseInt(tmp[t], 16));
			}

		}

	}

	return bytes;

};

const _decode_utf8_char = function(str) {

	try {
		return decodeURIComponent(str);
	} catch (err) {
		return String.fromCharCode(0xFFFD);
	}

};

const _utf8_to_string = function(buffer, start, end) {

	end = Math.min(buffer.length, end);


	let str = '';
	let tmp = '';

	for (let b = start; b < end; b++) {

		if (buffer[b] <= 0x7F) {
			str += _decode_utf8_char(tmp) + String.fromCharCode(buffer[b]);
			tmp = '';
		} else {
			tmp += '%' + buffer[b].toString(16);
		}

	}

	return str + _decode_utf8_char(tmp);

};

const _decode_base64 = function(elt) {

	let code = elt.charCodeAt(0);

	if (code === 43)      return 62;
	if (code === 47)      return 63;
	if (code  <  48)      return -1;
	if (code  <  48 + 10) return code - 48 + 26 + 26;
	if (code  <  65 + 26) return code - 65;
	if (code  <  97 + 26) return code - 97 + 26;

	return -1;

};

const _encode_base64 = function(num) {
	return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(num);
};

const _ascii_to_bytes = function(str) {

	let bytes = [];

	for (let s = 0; s < str.length; s++) {
		bytes.push(str.charCodeAt(s) & 0xFF);
	}

	return bytes;

};

const _ascii_to_string = function(buffer, start, end) {

	end = Math.min(buffer.length, end);


	let str = '';

	for (let b = start; b < end; b++) {
		str += String.fromCharCode(buffer[b] & 0x7F);
	}

	return str;

};

const _base64_to_bytes = function(str) {

	if (str.length % 4 === 0) {

		let length       = str.length;
		let placeholders = '=' === str.charAt(length - 2) ? 2 : '=' === str.charAt(length - 1) ? 1 : 0;

		let bytes = new Array(length * 3 / 4 - placeholders);
		let l     = placeholders > 0 ? str.length - 4 : str.length;

		let tmp;
		let b = 0;
		let i = 0;

		while (i < l) {

			tmp = (_decode_base64(str.charAt(i)) << 18) | (_decode_base64(str.charAt(i + 1)) << 12) | (_decode_base64(str.charAt(i + 2)) << 6) | (_decode_base64(str.charAt(i + 3)));

			bytes[b++] = (tmp & 0xFF0000) >> 16;
			bytes[b++] = (tmp & 0xFF00)   >>  8;
			bytes[b++] =  tmp & 0xFF;

			i += 4;

		}


		if (placeholders === 2) {

			tmp = (_decode_base64(str.charAt(i)) << 2)  | (_decode_base64(str.charAt(i + 1)) >> 4);

			bytes[b++] = tmp        & 0xFF;

		} else if (placeholders === 1) {

			tmp = (_decode_base64(str.charAt(i)) << 10) | (_decode_base64(str.charAt(i + 1)) << 4) | (_decode_base64(str.charAt(i + 2)) >> 2);

			bytes[b++] = (tmp >> 8) & 0xFF;
			bytes[b++] =  tmp       & 0xFF;

		}


		return bytes;

	}


	return [];

};

const _base64_to_string = function(buffer, start, end) {

	let bytes      = buffer.slice(start, end);
	let extrabytes = bytes.length % 3;
	let l          = bytes.length - extrabytes;
	let str        = '';


	let tmp;

	for (let i = 0; i < l; i += 3) {

		tmp = (bytes[i] << 16) + (bytes[i + 1] << 8) + (bytes[i + 2]);

		str += (_encode_base64(tmp >> 18 & 0x3F) + _encode_base64(tmp >> 12 & 0x3F) + _encode_base64(tmp >> 6 & 0x3F) + _encode_base64(tmp & 0x3F));

	}


	if (extrabytes === 2) {

		tmp = (bytes[bytes.length - 2] << 8) + (bytes[bytes.length - 1]);

		str += _encode_base64(tmp >> 10);
		str += _encode_base64((tmp >> 4) & 0x3F);
		str += _encode_base64((tmp << 2) & 0x3F);
		str += '=';

	} else if (extrabytes === 1) {

		tmp = bytes[bytes.length - 1];

		str += _encode_base64(tmp >> 2);
		str += _encode_base64((tmp << 4) & 0x3F);
		str += '==';

	}


	return str;

};

const _binary_to_bytes = function(str) {

	let bytes = [];

	for (let s = 0; s < str.length; s++) {
		bytes.push(str.charCodeAt(s) & 0xFF);
	}

	return bytes;

};

const _binary_to_string = function(buffer, start, end) {

	end = Math.min(buffer.length, end);


	let str = '';

	for (let b = start; b < end; b++) {
		str += String.fromCharCode(buffer[b]);
	}

	return str;

};

const _hex_to_string = function(buffer, start, end) {

	end = Math.min(buffer.length, end);


	let str = '';

	for (let b = start; b < end; b++) {
		str += String.fromCharCode(buffer[b]);
	}

	let hex = '';

	for (let s = 0; s < str.length; s++) {

		let val = str.charCodeAt(s).toString(16);
		if (val.length < 2) {
			val = '0' + val;
		}

		hex += val;

	}

	return hex;

};

const _copy_buffer = function(source, target, offset, length) {

	let i = 0;

	for (i = 0; i < length; i++) {

		if (i + offset >= target.length) break;
		if (i >= source.length)          break;

		target[i + offset] = source[i];

	}

	return i;

};

const _copy_hexadecimal = function(source, target, offset, length) {

	let strlen = source.length;
	if (strlen % 2 !== 0) {
		throw new Error('Invalid hex string');
	}

	if (length > strlen / 2) {
		length = strlen / 2;
	}


	let i = 0;

	for (i = 0; i < length; i++) {

		let num = parseInt(source.substr(i * 2, 2), 16);
		if (isNaN(num) === true) {
			return i;
		}

		target[i + offset] = num;

	}


	return i;

};



export const Buffer = (function(global) {

	const Buffer = function(subject, encoding) {

		let type = typeof subject;
		if (type === 'string' && encoding === 'base64') {
			subject = _clean_base64(subject);
		}


		this.length = 0;


		if (type === 'string') {

			this.length = Buffer.byteLength(subject, encoding);

			this.write(subject, 0, encoding);

		} else if (type === 'number') {

			this.length = _coerce(subject);

			for (let n = 0; n < this.length; n++) {
				this[n] = 0;
			}

		} else if (Buffer.isBuffer(subject) === true) {

			this.length = subject.length;

			for (let b = 0; b < this.length; b++) {
				this[b] = subject[b];
			}

		}


		return this;

	};


	Buffer.alloc = function(size, fill, encoding) {

		size     = typeof size === 'number'     ? size     : 0;
		encoding = typeof encoding === 'string' ? encoding : 'utf8';


		let buffer = new Buffer(size);


		if (typeof fill === 'string') {

			let other = Buffer.from(fill, encoding);
			let ol    = other.length;

			for (let b = 0, bl = buffer.length; b < bl; b++) {
				buffer[b] = other[b % ol];
			}

		} else if (typeof fill === 'number') {

			for (let b = 0, bl = buffer.length; b < bl; b++) {
				buffer[b] = fill & 0xff;
			}

		} else if (fill instanceof Buffer) {

			let fl = fill.length;

			for (let b = 0, bl = buffer.length; b < bl; b++) {
				buffer[b] = fill[b % fl];
			}

		} else {

			for (let b = 0, bl = buffer.length; b < bl; b++) {
				buffer[b] = 0;
			}

		}


		return buffer;

	};


	Buffer.byteLength = function(str, encoding) {

		str      = typeof str === 'string'      ? str      : '';
		encoding = typeof encoding === 'string' ? encoding : 'utf8';


		let length = 0;

		if (encoding === 'ascii') {
			length = str.length;
		} else if (encoding === 'base64') {
			length = _base64_to_bytes(str).length;
		} else if (encoding === 'binary') {
			length = str.length;
		} else if (encoding === 'hex') {
			length = str.length >>> 1;
		} else if (encoding === 'latin1') {
			length = str.length;
		} else if (encoding === 'utf8' || encoding === 'utf-8') {
			length = _utf8_to_bytes(str).length;
		}

		return length;

	};


	Buffer.compare = function(a_buffer, b_buffer) {

		a_buffer = Buffer.isBuffer(a_buffer) ? a_buffer : null;
		b_buffer = Buffer.isBuffer(b_buffer) ? b_buffer : null;


		if (a_buffer !== null && b_buffer !== null) {

			if (a_buffer === b_buffer) {
				return 0;
			}


			let a_value = a_buffer.length;
			let b_value = b_buffer.length;

			for (let b = 0, bl = Math.min(a_buffer.length, b_buffer.length); b < bl; b++) {

				if (a_buffer[b] !== b_buffer[b]) {
					a_value = a_buffer[b];
					b_value = b_buffer[b];
					break;
				}

			}

			if (a_value < b_value) return -1;
			if (b_value < a_value) return  1;

		}

		return 0;

	};


	Buffer.concat = function(list, length) {

		list   = list instanceof Array      ? list         : null;
		length = typeof length === 'number' ? (length | 0) : null;


		if (list === null) {

			throw new TypeError('The "list" argument must be an instance of Array.');

		} else {

			if (length === null) {

				length = 0;

				for (let l = 0, ll = list.length; l < ll; l++) {
					length += list[l].length;
				}

			}

			let buffer = Buffer.alloc(length);
			let offset = 0;

			for (let l = 0, ll = list.length; l < ll; l++) {

				let other = list[l];

				other.copy(buffer, offset);

				offset += other.length;

			}

			if (offset < length) {
				buffer.fill(0, offset, length);
			}

			return buffer;

		}

	};


	Buffer.from = function(subject, encoding) {

		encoding = typeof encoding === 'string' ? encoding : 'utf8';


		if (subject instanceof ArrayBuffer) {

			let tmp    = new Uint8Array(subject);
			let length = tmp.length;
			let buffer = new Buffer(length);

			for (let b = 0; b < length; b++) {
				buffer[b] = tmp[b];
			}

			return buffer;

		} else if (subject instanceof Buffer) {

			let length = subject.length;
			let buffer = new Buffer(length);

			for (let b = 0; b < length; b++) {
				buffer[b] = subject[b];
			}

			return buffer;

		} else if (subject instanceof Array || subject instanceof Uint8Array || subject instanceof Int8Array) {

			let length = typeof subject.length === 'number' ? (subject.length | 0) : 0;
			let buffer = new Buffer(length);

			for (let b = 0; b < length; b++) {
				buffer[b] = subject[b] & 0xff;
			}

			return buffer;

		} else if (typeof subject === 'string' && encoding !== null) {

			let length = Buffer.byteLength(subject, encoding);
			let buffer = new Buffer(length);

			buffer.write(subject, 0, encoding);

			return buffer;

		}


		return null;

	};


	Buffer.isBuffer = function(buffer) {

		if (buffer instanceof Buffer) {
			return true;
		} else if (Object.prototype.toString.call(buffer) === '[object Buffer]') {
			return true;
		} else if (Object.prototype.toString.call(buffer) === '[object Uint8Array]') {
			return true;
		}


		return false;

	};


	Buffer.prototype = {

		[Symbol.toStringTag]: 'Buffer',

		toJSON: function() {

			let data = [];

			for (let b = 0; b < this.length; b++) {
				data[b] = this[b];
			}

			return {
				type: 'Buffer',
				data: data
			};

		},

		copy: function(target, target_start, start, end) {

			target_start = typeof target_start === 'number' ? (target_start | 0) : 0;
			start        = typeof start === 'number'        ? (start | 0)        : 0;
			end          = typeof end === 'number'          ? (end   | 0)        : this.length;


			if (start === end)       return 0;
			if (target.length === 0) return 0;
			if (this.length === 0)   return 0;


			end = Math.min(end, this.length);

			let diff        = end - start;
			let target_diff = target.length - target_start;
			if (target_diff < diff) {
				end = target_diff + start;
			}


			for (let b = 0; b < diff; b++) {
				target[b + target_start] = this[b + start];
			}

			return diff;

		},

		fill: function(value, start, end) {

			let val  = typeof value === 'number' ? ([ value | 0 ]) : [ 0 ];
			start    = typeof start === 'number' ? (start | 0)     : 0;
			end      = typeof end === 'number'   ? (end   | 0)     : this.length;


			if (typeof value === 'string') {

				if (value.length > 1) {

					val = [];

					for (let v = 0; v < value.length; v++) {
						val.push(value.charCodeAt(v) & 0xff);
					}

				} else if (value.length === 1) {
					val = [ value.charCodeAt(0) & 0xff ];
				}

			}


			if (start === end)     return this;
			if (this.length === 0) return this;


			if (start < end && start < this.length && end <= this.length) {

				if (val.length > 1) {

					for (let b = start, v = 0; b < end; b++) {

						this[b] = val[v];

						v++;
						v %= val.length;

					}

				} else {

					for (let b = start; b < end; b++) {
						this[b] = val[0];
					}

				}

			}


			return this;

		},

		includes: function(value, start, encoding) {
			return this.indexOf(value, start, encoding) !== -1;
		},

		indexOf: function(value, start, encoding) {

			let val  = Buffer.isBuffer(value)       ? value       : null;
			start    = typeof start === 'number'    ? (start | 0) : 0;
			encoding = typeof encoding === 'string' ? encoding    : 'utf8';


			if (val === null) {
				val = Buffer.from(value, encoding);
			}


			let index = -1;

			for (let b = start; b < this.length; b++) {

				let found = 0;

				for (let v = 0; v < val.length; v++) {

					if (this[b + v] === val[v]) {

						found++;

						if (found === val.length) {
							index = b;
							break;
						}

					} else {
						break;
					}

				}

				if (index !== -1) {
					break;
				} else if (index === -1) {
					found = 0;
				}

			}

			return index;

		},

		lastIndexOf: function(value, start, encoding) {

			let length = this.length;

			let val  = Buffer.isBuffer(value)       ? value       : null;
			start    = typeof start === 'number'    ? (start | 0) : length;
			encoding = typeof encoding === 'string' ? encoding    : 'utf8';

			if (val === null) {
				val = Buffer.from(value, encoding);
			}

			start = Math.min(start, length);
			start = Math.max(start, val.length);


			let index = -1;

			if (length > val.length) {

				for (let b = start; b >= 0; b--) {

					let found = 0;

					for (let v = 0; v < val.length; v++) {

						if (this[b + v] === val[v]) {

							found++;

							if (found === val.length) {
								index = b;
								break;
							}

						} else {
							break;
						}

					}

					if (index !== -1) {
						break;
					} else if (index === -1) {
						found = 0;
					}

				}

			}

			return index;

		},

		map: function(callback) {

			callback = typeof callback === 'function' ? callback : null;


			if (callback === null) {
				throw new TypeError('The "callback" argument must be a function.');
			}


			let clone = Buffer.alloc(this.length);

			for (let b = 0; b < this.length; b++) {
				clone[b] = callback(this[b], b) & 0xff;
			}

			return clone;

		},

		slice: function(start, end) {

			let length = this.length;

			if (typeof start === 'number') {

				if (start < 0) {
					start += length;
					start  = start > 0 ? start : 0;
				}

				if (end === undefined) {
					end = length;
				}

			}

			start = typeof start === 'number' ? (start | 0) : 0;
			end   = typeof end === 'number'   ? (end   | 0) : length;

			start = Math.min(start, length);
			start = Math.max(start, 0);
			end   = Math.min(end,   length);
			end   = Math.max(end,   0);


			let diff  = end - start;
			let clone = Buffer.alloc(diff);

			for (let b = 0; b < diff; b++) {
				clone[b] = this[b + start];
			}

			return clone;

		},

		write: function(str, offset, length, encoding) {

			offset   = typeof offset === 'number'   ? offset   : 0;
			encoding = typeof encoding === 'string' ? encoding : 'utf8';

			if (offset < 0 || offset > this.length) {
				throw new RangeError('The "offset" argument is out of range. It must be >= 0 && <= ' + this.length + '.');
			}


			let remaining = this.length - offset;

			if (length === undefined) {

				length = remaining;

			} else if (typeof length === 'string') {

				encoding = length;
				length   = remaining;

			} else {

				if (length > remaining) {
					length = remaining;
				}

			}


			let diff = 0;

			if (encoding === 'ascii') {
				diff = _copy_buffer(_ascii_to_bytes(str), this, offset, length);
			} else if (encoding === 'base64') {
				diff = _copy_buffer(_base64_to_bytes(str), this, offset, length);
			} else if (encoding === 'binary') {
				diff = _copy_buffer(_binary_to_bytes(str), this, offset, length);
			} else if (encoding === 'hex') {
				diff = _copy_hexadecimal(str, this, offset, length);
			} else if (encoding === 'latin1') {
				diff = _copy_buffer(_binary_to_bytes(str), this, offset, length);
			} else if (encoding === 'utf8' || encoding === 'utf-8') {
				diff = _copy_buffer(_utf8_to_bytes(str),   this, offset, length);
			}

			return diff;

		},

		toString: function(encoding, start, end) {

			encoding = typeof encoding === 'string' ? encoding : 'utf8';
			start    = typeof start === 'number'    ? start    : 0;
			end      = typeof end === 'number'      ? end      : this.length;

			start = Math.min(start, this.length);
			start = Math.max(start, 0);

			if (start === end)        return '';
			if (start >= this.length) return '';
			if (end <= start)         return '';


			let str = '';

			if (encoding === 'ascii') {
				str = _ascii_to_string(this, start, end);
			} else if (encoding === 'base64') {
				str = _base64_to_string(this, start, end);
			} else if (encoding === 'binary') {
				str = _binary_to_string(this, start, end);
			} else if (encoding === 'hex') {
				str = _hex_to_string(this, start, end);
			} else if (encoding === 'latin1') {
				str = _binary_to_string(this, start, end);
			} else if (encoding === 'utf8' || encoding === 'utf-8') {
				str = _utf8_to_string(this,   start, end);
			}

			return str;

		}

	};

	if (typeof global.Buffer === 'undefined') {
		global.Buffer = Buffer;
	}

	return Buffer;

})(typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this));

export const isBuffer = Buffer.isBuffer;


export const console = (function(global) {

	const CONSOLE = global.console;

	if (typeof global.parent !== 'undefined') {

		if (global !== global.parent) {
			global = global.parent;
		}

	}

	if (typeof global[Symbol.for('base-console')] !== 'undefined') {
		return global[Symbol.for('base-console')];
	}

	const PALETTE = {
		'Boolean':  '#03a8cd',
		'Global':   '#d68786',
		'Keyword':  '#d25f7b',
		'Literal':  '#d68786',
		'Number':   '#ff094b',
		'RegExp':   '#ff094b',
		'Scope':    '#03a8cd',
		'String':   '#55d759',
		'Type':     '#d68786'
	};

	const PALETTE_DIFF = {
		insert: '#005f00',
		normal: '#2e3436',
		remove: '#870000'
	};

	const SYNTAX = {

		'console':    'Global',
		'global':     'Global',
		'this':       'Scope',
		'window':     'Global',
		'process':    'Global',

		'setTimeout':    'Global',
		'clearTimeout':  'Global',
		'setInterval':   'Global',
		'clearInterval': 'Global',

		'function':   'Literal',
		'const':      'Keyword',
		'let':        'Scope',
		'new':        'Scope',
		'for':        'Keyword',
		'while':      'Keyword',
		'if':         'Keyword',
		'else if':    'Keyword',
		'else':       'Keyword',
		'switch':     'Keyword',
		'case':       'Keyword',
		'typeof':     'Scope',
		'instanceof': 'Scope',

		'[':          'Literal',
		']':          'Literal',
		'(':          'Literal',
		')':          'Literal',
		'{':          'Literal',
		'}':          'Literal',

		'null':       'Keyword',
		'undefined':  'Keyword',
		'false':      'Boolean',
		'true':       'Boolean',
		'Infinity':   'Keyword',
		'NaN':        'Number',

		'Array':      'Keyword',
		'Boolean':    'Keyword',
		'Buffer':     'Keyword',
		'Date':       'Keyword',
		'Emitter':    'Keyword',
		'Function':   'Keyword',
		'Number':     'Keyword',
		'Object':     'Keyword',
		'RegExp':     'Keyword',
		'String':     'Keyword',

		'isArray':    'Keyword',
		'isBoolean':  'Keyword',
		'isBuffer':   'Keyword',
		'isDate':     'Keyword',
		'isEmitter':  'Keyword',
		'isFunction': 'Keyword',
		'isNumber':   'Keyword',
		'isObject':   'Keyword',
		'isRegExp':   'Keyword',
		'isString':   'Keyword'

	};

	const write_console = (() => {

		let element = global.document.querySelector('base-console');
		if (element === null) {

			let elements = {
				console: global.document.createElement('base-console'),
				style:   global.document.createElement('style')
			};


			let style = [
				'base-console {',
				'\tall: unset;',
				'\tdisplay: block;',
				'\tposition: fixed;',
				'\ttop: 0px;',
				'\tright: 0px;',
				'\tbottom: 0px;',
				'\tleft: 0px;',
				'\tbox-sizing: border-box;',
				'\tbackground: #2e3436;',
				'\ttransition: 200ms transform ease-out;',
				'\ttransform: translate(-100%, 0%);',
				'\tz-index: 2048;',
				'\toverflow-y: auto;',
				'}',
				'base-console.active {',
				'\ttransition: 200ms transform ease-out;',
				'\ttransform: translate(0%, 0%);',
				'}',
				'base-console base-console-line {',
				'\tdisplay: block;',
				'\tposition: relative;',
				'\twhite-space: pre;',
				'\tcolor: #ffffff;',
				'\tfont-family: monospace;',
				'\toverflow-x: auto;',
				'}',
				'base-console base-console-line i {',
				'\tfont-style: normal;',
				'}',
				'base-console base-console-line.blink {',
				'\tbackground: #000000;',
				'\tanimation: base_console_blink 1s linear infinite;',
				'}',
				'base-console base-console-line.error {',
				'\tbackground: #cc0000;',
				'}',
				'base-console base-console-line.info {',
				'\tbackground: #4e9a06;',
				'}',
				'base-console base-console-line.log {',
				'\tbackground: transparent;',
				'}',
				'base-console base-console-line.warn {',
				'\tbackground: #ffcc00;',
				'}',
				'@keyframes base_console_blink {',
				'\t0%   { background: #000000; }',
				'\t50%  { background: #00d7ff; }',
				'\t100% { background: #000000; }',
				'}'
			];

			Object.keys(PALETTE).forEach((keyword) => {
				style.push('base-console base-console-line i.' + keyword.toLowerCase() + '{');
				style.push('\tcolor: ' + PALETTE[keyword] + ';');
				style.push('}');
			});

			Object.keys(PALETTE_DIFF).forEach((keyword) => {
				style.push('base-console base-console-line.diff i.' + keyword.toLowerCase() + '{');
				style.push('\tbackground: ' + PALETTE_DIFF[keyword] + ';');
				style.push('}');
			});


			elements.style.appendChild(global.document.createTextNode(style.join('\n')));

			if (global.document.head !== null && global.document.body !== null) {

				global.document.head.appendChild(elements.style);
				global.document.body.appendChild(elements.console);

			} else {

				global.document.addEventListener('DOMContentLoaded', () => {
					global.document.head.appendChild(elements.style);
					global.document.body.appendChild(elements.console);
				}, true);

			}

			element = elements.console;

		}


		return (message, type) => {

			let line = global.document.createElement('base-console-line');

			line.innerHTML = message;
			line.setAttribute('class',    type);
			line.setAttribute('data-val', line.innerText);

			element.appendChild(line);

		};

	})();

	const align = function(array, other) {

		let result = new Array(other.length).fill(null);
		let temp   = other.slice();
		let split  = 0;

		for (let t = 0; t < temp.length; t++) {

			let line_a = temp[temp.length - 1 - t];
			let line_b = array[array.length - 1 - t];

			if (line_a === line_b) {
				result[result.length - 1 - t] = line_a;
			} else {
				split = array.length - 1 - t;
				break;
			}

		}

		for (let s = 0; s <= split; s++) {
			result[s] = array[s];
		}

		return result;

	};

	const highlight = function(str, type) {

		let color = PALETTE[type] || null;
		if (color !== null) {
			return '<i class="' + type.toLowerCase() + '">' + str + '</i>';
		} else {
			return str;
		}

	};

	const highlight_diff = function(str, type) {

		let color = PALETTE_DIFF[type] || null;
		if (color !== null) {
			return '<i class="' + type.toLowerCase() + '">' + str + '</i>';
		} else {
			return str;
		}

	};

	const highlight_split = function(chunk, split) {

		let index = chunk.indexOf(split);
		if (index !== -1) {

			let temp1 = chunk.substr(0, index).split(' ').map((ch) => highlight_chunk(ch)).join(' ');
			let temp2 = chunk.substr(index + 1).split(' ').map((ch) => highlight_chunk(ch)).join(' ');

			if (SYNTAX[split] !== undefined) {
				chunk = temp1 + highlight(split, SYNTAX[split]) + temp2;
			} else {
				chunk = temp1 + split + temp2;
			}

		}

		return chunk;

	};

	const highlight_chunk = function(chunk) {

		let prefix = '';
		let suffix = '';

		if (chunk.startsWith('\t') === true) {

			let index = Array.from(chunk).findIndex((val) => val !== '\t');
			if (index !== -1) {
				prefix = chunk.substr(0, index);
				chunk  = chunk.substr(index);
			}

		}

		if (chunk.endsWith(';') === true || chunk.endsWith(',') === true) {
			suffix = chunk.substr(chunk.length - 1, 1);
			chunk  = chunk.substr(0, chunk.length - 1);
		}

		if (SYNTAX[chunk] !== undefined) {

			chunk = highlight(chunk, SYNTAX[chunk]);

		} else if (chunk.includes(':') === true) {

			chunk = highlight_split(chunk, ':');

		} else if (chunk.includes('(') === true) {

			chunk = highlight_split(chunk, '(');

		} else if (chunk.includes(')') === true) {

			chunk = highlight_split(chunk, ')');

		} else if (chunk.includes('{') === true) {

			chunk = highlight_split(chunk, '{');

		} else if (chunk.includes('}') === true) {

			chunk = highlight_split(chunk, '}');

		} else if (chunk.includes(' ') === true) {

			chunk = highlight_split(chunk, ' ');

		} else if ((/^([0-9.]*)$/g).test(chunk) === true) {

			if (chunk.includes('.') === true) {

				let num = parseFloat(chunk);
				if (Number.isNaN(num) === false && (num).toString() === chunk) {
					chunk = highlight(chunk, 'Number');
				}

			} else {

				let num = parseInt(chunk, 10);
				if (Number.isNaN(num) === false && (num).toString() === chunk) {
					chunk = highlight(chunk, 'Number');
				}

			}

		} else if (chunk.includes('.') === true) {

			chunk = chunk.split('.').map((ch) => highlight_chunk(ch)).join('.');

		}

		return prefix + chunk + suffix;

	};

	const highlight_line = function(line) {

		if (line.includes('"') === true) {

			let index1 = line.indexOf('"');
			let index2 = line.indexOf('"', index1 + 1);
			if (index1 !== -1 && index2 !== -1) {

				let str = '';

				str += line.substr(0, index1).split(' ').map((chunk) => highlight_chunk(chunk)).join(' ');
				str += highlight(line.substr(index1, index2 - index1 + 1), 'String');
				str += line.substr(index2 + 1).split(' ').map((chunk) => highlight_chunk(chunk)).join(' ');

				line = str;

			}

		} else if (line.includes('\'') === true) {

			let index1 = line.indexOf('\'');
			let index2 = line.indexOf('\'', index1 + 1);
			if (index1 !== -1 && index2 !== -1) {

				let str = '';

				str += line.substr(0, index1).split(' ').map((chunk) => highlight_chunk(chunk)).join(' ');
				str += highlight(line.substr(index1, index2 - index1 + 1), 'String');
				str += line.substr(index2 + 1).split(' ').map((chunk) => highlight_chunk(chunk)).join(' ');

				line = str;

			}

		} else {

			line = highlight_chunk(line);

		}


		return line;

	};

	const isArray = function(arr) {
		return Object.prototype.toString.call(arr) === '[object Array]';
	};

	const isBuffer = function(buffer) {

		if (buffer instanceof Buffer) {
			return true;
		} else if (Object.prototype.toString.call(buffer) === '[object Buffer]') {
			return true;
		}


		return false;

	};

	const isDate = function(dat) {
		return Object.prototype.toString.call(dat) === '[object Date]';
	};

	const isError = function(obj) {
		return Object.prototype.toString.call(obj).includes('Error') === true;
	};

	const isFunction = function(fun) {
		return Object.prototype.toString.call(fun) === '[object Function]';
	};

	const isMatrix = function(obj) {

		if (isArray(obj) === true && obj.length > 4) {

			let check = obj.filter((v) => isNumber(v) === true);
			if (check.length === obj.length) {

				let dim = Math.floor(Math.sqrt(obj.length));
				if (dim * dim === obj.length) {
					return true;
				}

			}

		}

		return false;

	};

	const isNumber = function(num) {
		return Object.prototype.toString.call(num) === '[object Number]';
	};

	const isObject = function(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	const isPrimitive = function(data) {

		if (
			data === null
			|| data === undefined
			|| typeof data === 'boolean'
			|| typeof data === 'number'
		) {
			return true;
		}


		return false;

	};

	const isRegExp = function(obj) {
		return Object.prototype.toString.call(obj) === '[object RegExp]';
	};

	const isString = function(str) {
		return Object.prototype.toString.call(str) === '[object String]';
	};

	const isUint8Array = function(array) {

		if (Object.prototype.toString.call(array) === '[object Uint8Array]') {
			return true;
		}


		return false;

	};

	const INDENT       = '    ';
	const WHITESPACE   = new Array(512).fill(' ').join('');
	const format_date2 = (n) => {

		if (n < 10) {
			return '0' + n;
		}

		return '' + n;

	};

	const format_date3 = (n) => {

		if (n < 10) {
			return '00' + n;
		} else if (n < 100) {
			return '0' + n;
		}

		return '' + n;

	};

	const format_hex = (n) => {

		let str = (n).toString(16);
		if (str.length % 2 === 1) {
			str = '0' + str;
		}

		return str;

	};

	const cleanify = function(raw) {

		let str = '';

		for (let r = 0, rl = raw.length; r < rl; r++) {

			let code = raw.charCodeAt(r);
			if (code === 9) {
				str += '\\t';
			} else if (code === 10) {
				str += '\\n';
			} else if (code === 13) {
				str += '\\r';
			} else if (code === 27) {

				if (raw[r + 1] === '[') {

					let index = raw.indexOf('m', r + 2);
					if (index !== -1) {
						r = index;
					}

				}

			} else if (code >= 32 && code <= 127) {
				str += raw.charAt(r);
			}

		}

		str = str.split('\r').join('\\r');
		str = str.split('\n').join('\\n');

		return str;

	};

	const stringify = function(data, indent) {

		indent = isString(indent) ? indent : '';


		let str = '';

		if (
			typeof data === 'boolean'
			|| data === null
			|| data === undefined
			|| (
				typeof data === 'number'
				&& (
					data === Infinity
					|| data === -Infinity
					|| Number.isNaN(data) === true
				)
			)
		) {

			if (data === null) {
				str = indent + highlight('null', 'Keyword');
			} else if (data === undefined) {
				str = indent + highlight('undefined', 'Keyword');
			} else if (data === false) {
				str = indent + highlight('false', 'Boolean');
			} else if (data === true) {
				str = indent + highlight('true', 'Boolean');
			} else if (data === Infinity) {
				str = indent + highlight('Infinity', 'Keyword');
			} else if (data === -Infinity) {
				str = indent + highlight('-Infinity', 'Keyword');
			} else if (Number.isNaN(data) === true) {
				str = indent + highlight('NaN', 'Number');
			}

		} else if (isError(data) === true) {

			let type = Object.prototype.toString.call(data);
			if (type.startsWith('[object') === true && type.endsWith(']') === true) {
				type = type.substr(7, type.length - 8).trim();
			}

			let msg = (data.message || '').trim();
			if (msg.length > 0) {
				str = indent + highlight(type, 'Keyword') + ': ' + highlight('"' + msg + '"', 'String') + '\n';
			} else {
				str = indent + highlight(type, 'Keyword') + ':\n';
			}


			let stack = (data.stack || '').trim().split('\n');
			if (stack.length > 0) {

				let origin = null;

				for (let s = 0, sl = stack.length; s < sl; s++) {

					let line = stack[s].trim();
					if (line.includes('(https://') === true && line.includes(')') === true) {

						let tmp = line.split('(https://')[1].split(')').shift().trim();
						if (tmp.includes('.mjs') === true || tmp.includes('.html') === true) {
							origin = 'https://' + tmp;
							break;
						}

					} else if (line.includes('(http://') === true && line.includes(')') === true) {

						let tmp = line.split('(http://')[1].split(')').shift().trim();
						if (tmp.includes('.mjs') === true || tmp.includes('.html') === true) {
							origin = 'http://' + tmp;
							break;
						}

					} else if (line.includes('https://') === true) {

						let tmp = line.split('https://')[1].trim();
						if (tmp.includes('.mjs') === true || tmp.includes('.html') === true) {
							origin = 'https://' + tmp;
							break;
						}

					} else if (line.includes('http://') === true) {

						let tmp = line.split('http://')[1].trim();
						if (tmp.includes('.mjs') === true || tmp.includes('.html') === true) {
							origin = 'http://' + tmp;
							break;
						}

					}

				}

				if (origin !== null) {
					str += origin;
				}

			}

		} else if (isNumber(data) === true) {

			str = indent + highlight(data.toString(), 'Number');

		} else if (isRegExp(data) === true) {

			str = indent + highlight(data.toString(), 'RegExp');

		} else if (isString(data) === true) {

			str = indent + highlight('"' + cleanify(data).split('"').join('\\"') + '"', 'String');

		} else if (isFunction(data) === true) {

			str = '';

			let lines = data.toString().split('\n');
			if (lines.length > 1) {

				let offset = '';

				let tmp = lines.find((line) => {
					return line.startsWith('\t') === true && line.trim() !== '';
				}) || null;
				if (tmp !== null) {
					offset = tmp.substr(0, tmp.length - tmp.trim().length);
				}

				if (
					lines[0].startsWith('\t') === false
					&& lines[lines.length - 1].startsWith('\t') === false
				) {
					lines[0]                = offset + lines[0];
					lines[lines.length - 1] = offset + lines[lines.length - 1];
				}

				lines = lines.map((line) => {
					return highlight_line(line);
				});


				let first_line = lines[0];
				if (first_line.includes('function(') === true || first_line.includes('{') === true) {

					if (indent.length > 0) {
						str += indent.substr(0, indent.length - 1) + '\t' + first_line.trim();
					} else {
						str += first_line.trim();
					}

				}

				str += '\n';

				for (let l = 1, ll = lines.length; l < ll - 1; l++) {

					if (lines[l].startsWith(offset) === true) {
						str += indent + '\t' + lines[l].substr(offset.length).trimRight();
					} else {
						str += indent + '\t' + lines[l].trim();
					}

					str += '\n';

				}

				let last_line = lines[lines.length - 1];
				if (last_line.includes('}') === true) {

					if (indent.length > 0) {
						str += indent.substr(0, indent.length - 1) + '\t' + last_line.trim();
					} else {
						str += last_line.trim();
					}

				}

				str += '\n';

			} else {

				str += indent + highlight_line(lines[0]);

			}

			str += '\n';

		} else if (isArray(data) === true) {

			if (data.length === 0) {

				str = indent + highlight('[]', 'Literal');

			} else if (isMatrix(data) === true) {

				str  = indent;
				str += highlight('[', 'Literal') + '\n';

				let line = Math.floor(Math.sqrt(data.length));
				let max  = data.reduce((a, b) => Math.max((' ' + a).length, ('' + b).length), '');

				for (let d = 0, dl = data.length; d < dl; d++) {

					let margin = (max - ('' + data[d]).length);

					if (d % line === 0) {

						if (d > 0) {
							str += '\n';
						}

						str += stringify(data[d], '\t' + indent + WHITESPACE.substr(0, margin));

					} else {

						str += WHITESPACE.substr(0, margin);
						str += stringify(data[d]);

					}

					if (d < dl - 1) {
						str += ', ';
					} else {
						str += '  ';
					}

				}

				str += '\n' + indent + highlight(']', 'Literal');

			} else {

				str  = indent;
				str += highlight('[', 'Literal') + '\n';

				for (let d = 0, dl = data.length; d < dl; d++) {

					str += stringify(data[d], '\t' + indent);

					if (d < dl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight(']', 'Literal');

			}

		} else if (isBuffer(data) === true) {

			str = indent;

			let tmp = cleanify(data.toString('utf8'));
			if (tmp.length >= data.length) {

				str += highlight('Buffer', 'Type') + '.from(';
				str += highlight('"' + tmp + '"', 'String');
				str += ', ';
				str += highlight('"utf8"', 'String') + ')';

			} else if (data.length > 0) {

				str += highlight('Buffer', 'Type') + '.from(';
				str += highlight('[', 'Literal');

				for (let d = 0, dl = data.length; d < dl; d++) {

					str += highlight('0x' + format_hex(data[d]), 'Number');

					if (d < dl - 1) {
						str += ',';
					}

				}

				str += highlight(']', 'Literal');
				str += ')';

			} else {

				str += highlight('Buffer', 'Type') + '.from(';
				str += highlight('[', 'Literal');
				str += highlight(']', 'Literal');
				str += ')';

			}

		} else if (isUint8Array(data) === true) {

			str = indent;

			if (data.length > 0) {

				str += highlight('Uint8Array', 'Type') + '.from(';
				str += highlight('[', 'Literal');

				for (let d = 0, dl = data.byteLength; d < dl; d++) {

					str += highlight(data[d], 'Number');

					if (d < dl - 1) {
						str += ',';
					}

				}

				str += highlight(']', 'Literal');
				str += ')';

			} else {

				str += highlight('Uint8Array', 'Type') + '.from(';
				str += highlight('[', 'Literal');
				str += highlight(']', 'Literal');
				str += ')';

			}

		} else if (isDate(data) === true) {

			str  = indent;
			str += highlight(data.getUTCFullYear(), 'Number');
			str += highlight('-', 'Keyword');
			str += highlight(format_date2(data.getUTCMonth() + 1), 'Number');
			str += highlight('-', 'Keyword');
			str += highlight(format_date2(data.getUTCDate()), 'Number');
			str += highlight('T', 'Keyword');
			str += highlight(format_date2(data.getUTCHours()), 'Number');
			str += highlight(':', 'Keyword');
			str += highlight(format_date2(data.getUTCMinutes()), 'Number');
			str += highlight(':', 'Keyword');
			str += highlight(format_date2(data.getUTCSeconds()), 'Number');

			if (data.getUTCMilliseconds() !== 0) {
				str += highlight('.', 'Keyword');
				str += highlight(format_date3(data.getUTCMilliseconds()), 'Number');
			}

			str += highlight('Z', 'Keyword');

		} else if (data[Symbol.toStringTag] !== undefined && typeof data.toJSON === 'function') {

			let json = data.toJSON();
			if (
				isObject(json) === true
				&& isString(json.type) === true
				&& isObject(json.data) === true
			) {

				str  = indent;
				str += highlight(json.type, 'Type') + '.from(' + highlight('{', 'Literal') + '\n';

				let keys = Object.keys(json);
				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(json[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal') + ')';

			} else {

				let keys = Object.keys(data);
				if (keys.length === 0) {

					str = indent + highlight('{}', 'Literal');

				} else {

					str  = indent;
					str += highlight('{', 'Literal') + '\n';

					for (let k = 0, kl = keys.length; k < kl; k++) {

						let key = keys[k];

						str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
						str += stringify(data[key], '\t' + indent).trim();

						if (k < kl - 1) {
							str += ',';
						}

						str += '\n';

					}

					str += indent + highlight('}', 'Literal');

				}

			}

		} else if (isObject(data) === true || data[Symbol.toStringTag] !== undefined) {

			let keys = Object.keys(data);
			if (keys.length === 0) {

				str = indent + highlight('{}', 'Literal');

			} else {

				str  = indent;

				if (data[Symbol.toStringTag] !== undefined) {
					str += '(' + highlight(data[Symbol.toStringTag] + 'Type') + ') ';
				}

				str += highlight('{', 'Literal') + '\n';

				for (let k = 0, kl = keys.length; k < kl; k++) {

					let key = keys[k];

					str += '\t' + indent + highlight('"' + key + '"', 'String') + ': ';
					str += stringify(data[key], '\t' + indent).trim();

					if (k < kl - 1) {
						str += ',';
					}

					str += '\n';

				}

				str += indent + highlight('}', 'Literal');

			}

		}


		return str;

	};

	const stringify_arguments = function(args) {

		if (args.length === 2 && isString(args[1]) === true) {

			return args[0] + ' ' + args[1];

		} else {

			let chunks    = args.slice(1).map((value) => stringify(value));
			let multiline = chunks.find((value) => {
				return value.includes('\n') === true;
			}) !== undefined;
			if (multiline === true) {

				let lines = [
					args[0]
				];

				chunks.forEach((raw) => {

					raw.split('\n').forEach((line) => {

						if (line.includes('\t') === true) {
							line = line.split('\t').join(INDENT);
						}

						if (line.includes('\r') === true) {
							line = line.split('\r').join('\\r');
						}

						lines.push(line);

					});

				});

				return lines.join('\n');

			} else {

				return args[0] + ' ' + chunks.join(', ');

			}

		}

	};

	const blink = function() {

		let al   = arguments.length;
		let args = [ '(!)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'blink');
		CONSOLE.log.apply(CONSOLE, arguments);

	};

	const clear = function(partial) {

		partial = typeof partial === 'boolean' ? partial : false;


		if (partial === true) {

			let element = global.document.querySelector('base-console');
			if (element !== null) {

				let line = Array.from(element.querySelectorAll('base-console-line')).pop() || null;
				if (line !== null) {
					line.parentNode.removeChild(line);
				}

			}

			CONSOLE.clear();

		} else {

			let element = global.document.querySelector('base-console');
			if (element !== null) {

				Array.from(element.querySelectorAll('base-console-line')).forEach((line) => {
					line.parentNode.removeChild(line);
				});

			}

			CONSOLE.clear();

		}

	};

	const debug = function() {

		let al   = arguments.length;
		let args = [ '(E)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'error');
		CONSOLE.debug.apply(CONSOLE, arguments);

	};

	const offset_color = function(index) {

		let min = this.lastIndexOf('<i', index);
		let max = this.indexOf('>', index) + 1;

		if (min !== -1 && max !== -1) {

			let check = this.substr(min, max - min);
			if (
				check.startsWith('<i class="#') === true
				&& check.endsWith('">') === true
				&& check.substr(1).includes('<') === false
				&& check.substr(0, check.length - 1).includes('>') === false
			) {
				return [ min, max ];
			}

		}

		return null;

	};

	const compare = function(str1, str2) {

		let offset = [ -1, -1, -1 ];

		for (let s = 0, sl = Math.max(str1.length, str2.length); s < sl; s++) {

			if (str1[s] === str2[s]) {
				offset[0] = s;
			} else {
				offset[0] = s;
				break;
			}

		}

		if (offset[0] > 0) {

			let search = -1;

			for (let s = offset[0] + 1, sl = Math.max(str1.length, str2.length); s < sl; s++) {

				if (str1[s] !== str2[s]) {
					search = s;
				} else {
					search = s;
					break;
				}

			}

			if (search !== -1) {
				offset[1] = search;
				offset[2] = search;
			}

		}

		if (str1 === str2) {

			if (offset[0] === -1) {
				offset[0] = 0;
			}

			if (offset[1] === -1) {
				offset[1] = 0;
			}

			if (offset[2] === -1) {
				offset[2] = 0;
			}

		} else {

			if (offset[0] === -1) {
				offset[0] = 0;
			}

			if (offset[1] === -1) {
				offset[1] = str1.length;
			}

			if (offset[2] === -1) {
				offset[2] = str2.length;
			}

			if (str1.length !== str2.length) {
				offset[1] = str1.length;
				offset[2] = str2.length;
			}

		}

		let range01 = offset_color.call(str1, offset[0]);
		let range02 = offset_color.call(str2, offset[0]);

		if (range01 !== null && range02 !== null) {
			offset[0] = Math.min(range01[0], range02[0]);
		} else if (range01 !== null) {
			offset[0] = range01[0];
		} else if (range02 !== null) {
			offset[0] = range02[0];
		}

		let range1 = offset_color.call(str1, offset[1]);
		if (range1 !== null) {
			offset[1] = range1[1];
		}

		let range2 = offset_color.call(str2, offset[2]);
		if (range2 !== null) {
			offset[2] = range2[1];
		}

		return offset;

	};

	const diff = function() {

		if (arguments.length === 2) {

			let value_a = stringify(arguments[0]);
			let value_b = stringify(arguments[1]);

			if (isPrimitive(arguments[0]) === true && isPrimitive(arguments[1]) === true) {

				if (arguments[0] === arguments[1]) {

					let msg = '';

					msg += highlight_diff(value_a, 'normal');
					msg += highlight_diff(' ',     'normal');
					msg += highlight_diff(value_b, 'normal');
					msg += highlight_diff(' ',     'normal');
					msg += '\n';

					write_console(msg, 'diff');

				} else {

					let msg = '';

					msg += highlight_diff(value_a, 'remove');
					msg += highlight_diff(' ',     'normal');
					msg += highlight_diff(value_b, 'insert');
					msg += highlight_diff(' ',     'normal');
					msg += '\n';

					write_console(msg, 'diff');

				}

			} else {

				let lines_a = value_a.split('\t').join(INDENT).split('\n');
				let lines_b = value_b.split('\t').join(INDENT).split('\n');
				let result  = [];

				if (lines_a.length > lines_b.length) {
					lines_b = align(lines_b, lines_a);
				} else if (lines_b.length > lines_a.length) {
					lines_a = align(lines_a, lines_b);
				}

				for (let l = 0, ll = Math.max(lines_a.length, lines_b.length); l < ll; l++) {

					let line_a = lines_a[l];
					let line_b = lines_b[l];

					if (line_a === null) {
						result.push([ '+', '', line_b ]);
					} else if (line_b === null) {
						result.push([ '-', line_a, '' ]);
					} else if (line_a === line_b) {
						result.push([ '', line_a, line_b ]);
					} else {
						result.push([ '-+', line_a, line_b ]);
					}

				}

				let max = 0;

				result.forEach((values) => {
					max = Math.max(max, cleanify(values[1]).length, cleanify(values[2]).length);
				});

				result.forEach((values) => {

					let op     = values[0];
					let line_a = values[1];
					let line_b = values[2];
					let div_a  = WHITESPACE.substr(0, max - cleanify(line_a).length);
					let div_b  = WHITESPACE.substr(0, max - cleanify(line_b).length);

					if (op === '') {

						let msg = '';

						msg += highlight_diff(line_a, 'normal');
						msg += highlight_diff(div_a,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += highlight_diff(line_b, 'normal');
						msg += highlight_diff(div_b,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += '\n';

						write_console(msg, 'diff');

					} else if (op === '+') {

						let msg = '';

						msg += highlight_diff(line_a, 'normal');
						msg += highlight_diff(div_a,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += highlight_diff(line_b, 'insert');
						msg += highlight_diff(div_b,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += '\n';

						write_console(msg, 'diff');

					} else if (op === '-') {

						let msg = '';

						msg += highlight_diff(line_a, 'remove');
						msg += highlight_diff(div_a,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += highlight_diff(line_b, 'normal');
						msg += highlight_diff(div_b,  'normal');
						msg += highlight_diff(' ',    'normal');
						msg += '\n';

						write_console(msg, 'diff');

					} else if (op === '-+') {

						let msg    = '';
						let offset = compare(line_a, line_b);

						if (offset[0] !== -1 && offset[1] !== -1 && offset[2] !== -1) {

							msg += highlight_diff(line_a.substr(0, offset[0]),                     'normal');
							msg += highlight_diff(line_a.substr(offset[0], offset[1] - offset[0]), 'remove');
							msg += highlight_diff(line_a.substr(offset[1]),                        'normal');
							msg += highlight_diff(div_a,                                           'normal');
							msg += highlight_diff(' ',                                             'normal');
							msg += highlight_diff(line_b.substr(0, offset[0]),                     'normal');
							msg += highlight_diff(line_b.substr(offset[0], offset[2] - offset[0]), 'insert');
							msg += highlight_diff(line_b.substr(offset[2]),                        'normal');
							msg += highlight_diff(div_b,                                           'normal');
							msg += highlight_diff(' ',                                             'normal');
							msg += '\n';

							write_console(msg, 'diff');

						} else {

							msg += highlight_diff(line_a, 'remove');
							msg += highlight_diff(div_a,  'normal');
							msg += highlight_diff(' ',    'normal');
							msg += highlight_diff(line_b, 'insert');
							msg += highlight_diff(div_b,  'normal');
							msg += highlight_diff(' ',    'normal');
							msg += '\n';

							write_console(msg, 'diff');

						}

					}

				});

			}

		}

	};

	const error = function() {

		let al   = arguments.length;
		let args = [ '(E)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'error');
		CONSOLE.error.apply(CONSOLE, arguments);

	};

	const info = function() {

		let al   = arguments.length;
		let args = [ '(I)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'info');
		CONSOLE.info.apply(CONSOLE, arguments);

	};

	const log = function() {

		let al   = arguments.length;
		let args = [ '(L)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'log');
		CONSOLE.log.apply(CONSOLE, arguments);

	};

	const warn = function() {

		let al   = arguments.length;
		let args = [ '(W)' ];
		for (let a = 0; a < al; a++) {
			args.push(arguments[a]);
		}

		write_console(stringify_arguments(args), 'warn');
		CONSOLE.warn.apply(CONSOLE, arguments);

	};



	const console = global[Symbol.for('base-console')] = {
		blink: blink,
		clear: clear,
		debug: debug,
		diff:  diff,
		error: error,
		info:  info,
		log:   log,
		warn:  warn
	};


	return console;

})(typeof window !== 'undefined' ? window : this);


export default {

	console:    console,

	Array:      Array,
	Boolean:    Boolean,
	Buffer:     Buffer,
	Date:       Date,
	Emitter:    Emitter,
	Function:   Function,
	Map:        Map,
	Number:     Number,
	Object:     Object,
	RegExp:     RegExp,
	Set:        Set,
	String:     String,

	isArray:    Array.isArray,
	isBoolean:  Boolean.isBoolean,
	isBuffer:   Buffer.isBuffer,
	isDate:     Date.isDate,
	isEmitter:  Emitter.isEmitter,
	isFunction: Function.isFunction,
	isMap:      Map.isMap,
	isNumber:   Number.isNumber,
	isObject:   Object.isObject,
	isRegExp:   RegExp.isRegExp,
	isSet:      Set.isSet,
	isString:   String.isString

};

