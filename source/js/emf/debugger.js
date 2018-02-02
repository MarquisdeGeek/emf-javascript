
emf.debugemf = function() {
var bp = [];

	(function ctor() {
	})();

	function addBreakpoint(pc) {
		bp.push(pc);
		return "Breakpoint set at " + pc;
	}

	function executeCommand(cmd) {
		var splitTwo = /^\s*(\w+)\s+([\d\w]+)$/;
		var two = splitTwo.exec(cmd);
		if (!two) {
			return "";
		}
		//
		if (two == "help") {
			return "b [address] ; set breakpoint";
		} else if (two[1] === 'b') {
			return addBreakpoint(parseInt(two[2], 10));
		}
		return "";
	}

	function isBreakpoint(pc) {
		for(var i=0;i<bp.length;++i) {
			if (bp[i] == pc) {
				return true;
			}
		}
		return false;
	}

	return {
		addBreakpoint,
		executeCommand,
		//
		isBreakpoint
	};

}