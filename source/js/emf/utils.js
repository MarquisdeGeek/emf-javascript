emf.utils = {};

emf.utils.pad = function(s, padding) {
	var r = s + (" ".repeat(padding)); 
	r = r.substr(0, padding);
	return r;
}

emf.utils.toMarkup = function(s) {
	return s.replace(/ /g, "&nbsp;");
}

emf.utils.hex = function(v, padding) {
	var r = v.toString(16);
	var zeros = "0".repeat(padding);

	r = zeros + r;
	r = r.substr(r.length - padding);

	return r;
}

emf.utils.hex8 = function(v) {
	return emf.utils.hex(v, 2);
}

emf.utils.hex16 = function(v) {
	return emf.utils.hex(v, 4);
}
