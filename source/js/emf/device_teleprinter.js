emf.device = emf.device || {};

emf.device.Teleprinter = function(id) {
var dom_id;

	(function ctor(id) {
		dom_id = id;
	})(id);

	function onCharacterPrint(c) {
		$(dom_id).append(c);
	}

	function onCharacterRead() {
		return 0;
	}

	function onLinePrint(text) {
		$(dom_id).append(text);
		$(dom_id).append("<br>");
	}

	return {
		onCharacterRead,
		onCharacterPrint,
		onLinePrint
	};
}
