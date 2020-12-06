emf.utils = {};

emf.utils.pad = function(s, padding) {
	let r = s;

	if (typeof padding !== typeof undefined) {
		r += " ".repeat(padding); 
		r = r.substr(0, padding);
	}
	return r;
}

emf.utils.padRight = function(s, padding) {
	return emf.utils.pad(s, padding)
}

emf.utils.padLeft = function(s, padding) {
	return emf.utils.pad(s, padding)
	let r = s;

	if (typeof padding !== typeof undefined) {
		r = " ".repeat(padding) + r;
		r = r.substr(-padding);
	}
	return r;
}

emf.utils.toMarkup = function(s) {
	return s.replace(/ /g, "&nbsp;");
}

emf.utils.hex = function(v, padding) {
	return emf.utils.convertIntegerToBase(v, 16, padding);
}

emf.utils.hex8 = function(v) {
	v &= 0xff;
	return emf.utils.convertIntegerToBase(v, 16, 2);
}

emf.utils.hex16 = function(v) {
	v &= 0xffff;
	return emf.utils.convertIntegerToBase(v, 16, 4);
}

emf.utils.bin = function(v, padding) {
	return emf.utils.convertIntegerToBase(v, 2, padding);
}

emf.utils.bin8 = function(v) {
	v &= 0xff;
	return emf.utils.convertIntegerToBase(v, 2, 8);
}

emf.utils.bin16 = function(v) {
	v &= 0xffff;
	return emf.utils.convertIntegerToBase(v, 2, 16);
}

emf.utils.convertToDecimal = function(v) {
	return emf.utils.convertStringToDecimal(v);
}

emf.utils.convertBinarytoDecimal = function(v) {
	return emf.utils.convertStringToDecimal(v, 2);
}

emf.utils.convertHexToDec = function(hex) {
	return emf.utils.convertStringToDecimal(hex, 16);
}

emf.utils.convertDecToHex = function(dec) {
	dec &= 0xffffffffffffffff; // force negatives into positives
	return dec.toString(16);
}

emf.utils.convertHexStringtoArray = function(v) {
	if ((v.length % 2) == 1) {
		throw new Exception();
	}
	var result = [];
	for(var i=0;i<v.length;i+=2) {
		var this_value = parseInt(v[i], 16) * 16;
		this_value += parseInt(v[i + 1], 16);
		result.push(this_value);
	}
	return result;
}


//
//
//

// sourceBase is a hint, if no prefix is found
emf.utils.convertStringToDecimal = function(v, sourceBase = 10) {
	if (typeof v == typeof undefined) {
		return undefined;
	}

	let value = v.replace(/\s/g, '');
	if (value.substr(0,1) === '%') {
		value = value.substr(1);
		sourceBase = 2;

	} else if (value.substr(0,2) === '0x' || value.substr(0,2) === '0X') {
		value = value.substr(2);
		sourceBase = 16;

	} else if (value.substr(0,1) === '0') {
		// This trick ensures that, if base is supplied, it is used. Stops
		// padded numbers, like '0018' or '001010' being read as octal
		// by paseInt
		sourceBase = sourceBase || 8;

	} else if (value.substr(0,1) === '$') {
		value = value.substr(1);
		sourceBase = 16;

	} else if (value.substr(-1) === 'h' || value.substr(-1) === 'H') {
		value = value.substr(0, value.length-1);
		sourceBase = 16;
	}

	let result = parseInt(value, sourceBase);
	if (isNaN(result)) {
		return undefined;
	}
	return result;
}

emf.utils.convertIntegerToBase = function(v, base, padding) {
	let r = v.toString(base);

	if (typeof padding !== typeof undefined) {
		let zeros = "0".repeat(padding);

		r = zeros + r;
		r = r.substr(r.length - padding);
	}

	return r;
}

