emf.device = emf.device || {};

emf.device.PaperTape = function(contents_) {
var contents;
var pointer;

	(function ctor(contents_) {
		loadTape(contents_);
	})(contents_);

	function loadTape(contents_) {
		contents = contents_;
		pointer = 0;
	}

	function rewind() {
		seekTo(0);
	}

	function seekTo(idx) {
		if (idx < 0) {
			pointer = 0;
		} else if (idx >= contents.length) {
			pointer = contents.length-1;
		} else {
			pointer = idx;
		}
	}

	function seekForward(idx) {
		seekTo(pointer + idx);
	}

	function seekBackward(idx) {
		seekTo(pointer - idx);
	}

	function getPointer() {
		return pointer;
	}

	function peek(idx) {
		if (contents === undefined) {
			return {error: "No tape loaded"};
		}
		var v = contents[idx === undefined ? pointer : idx];
		if (v === undefined) {
			return {error: "Tape index is invalid"};
		}
		var is_eof = idx >= contents.length;
		return { data : v, is_eof: is_eof, duration: 1};
	}

	function fetch() {
		var rt = peek();
		if (rt.error === undefined) {
			++pointer;
		}
		return rt;
	}

	function getWidth() { return 2; }

	return {
		loadTape,
		rewind,
		seekTo,
		seekForward,
		seekBackward,
		getPointer,
		peek,
		fetch,
		getWidth
	};

}
