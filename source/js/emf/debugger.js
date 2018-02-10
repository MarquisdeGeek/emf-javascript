// Name chosen to avoid the usual suspects
//emf.debugemf = emf.debugemf || {};


emf.debugemf = function() {
var bp = [];

	(function ctor() {
	})();

	function addBreakpoint(pc) {
		bp.push(pc);
		return "Breakpoint set at " + pc;
	}

	function executeCommand(cmd) {
		if (cmd == "help") {
			return "b [address] ; set breakpoint<BR>" + 
			"info breakpoints ; get list of breakpoints";
		} 

		var splitTwo = /^\s*(\w+)\s+([\d\w]+)$/;
		var two = splitTwo.exec(cmd);
		if (!two) {
			return "";
		}
		//
		if (two[1] == "info") {
			return info(two[2]);
		} else if (two[1] === 'b') {
			return addBreakpoint(parseInt(two[2], 10));
		}
		return "";
	}

	function info(type) {
		var info = "Info: " + type + "<br>";
		if (type[0] == 'b') {
			for(var i=0;i<bp.length;++i) {
				info += bp[i] + "<br>";
			}
			return info;
		}
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