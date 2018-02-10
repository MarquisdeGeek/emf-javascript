emf.framework = {};

emf.framework.registers = function(div, machine, previous) {
	var state = machine.getState();
	var reglist = state.getRegisterList();
	var previous_state = previous ? previous.getState() : undefined;
	var code = '';
	reglist.forEach(function(e) {
		var span_class = "emu_register";
		if (previous_state && previous_state[e.reg].get() != state[e.reg].get()) {
			span_class += " changed";
		}
		code += "<span class='" + span_class + "'>";
		code += e.reg + " : " + state[e.reg].getUnsigned() + "(0x" + emf.utils.hex(state[e.reg].getUnsigned(), sgxRoundUp(state[e.reg].getBitWidth()/4)) + ")" + "<br>";
		code += "</span>";
	});
	$(div).html(code);
}

emf.framework.disassemble = function(div, machine, fromAddr, toAddr, pc) {
	var code = '';

	for(var i=fromAddr;i<toAddr;) {
		var dis = machine.disassemble(i);
		var line = "";

		if (pc == i) {
			line += "<span class='emu_disassembly_line current'>";
		} else {
			line += "<span class='emu_disassembly_line'>";
		}
		line += emf.utils.hex16(i) + " : ";
		//
		for(var hex = 0; hex < dis.instruction_length; ++hex) {
			if (machine.isValidAddress(i+hex)) {
				line += emf.utils.hex(machine.getWordAsUnsigned(i + hex), 5) + " ";
			} else {
				line += "xxxxx ";
			}
		}

		line += emf.utils.toMarkup(emf.utils.pad(dis.output, 8) + "; " + dis.comment);
		line += "</span>";

		code += line;

		i += dis.instruction_length;
	}

	$(div).html(code);
}


emf.framework.memory = function(div, machine, fromAddr, toAddr, previous) {
	var code = '';
	var width = 8;

	for(var i=fromAddr;i<toAddr;i+=width) {
		var line =emf.utils.hex16(i) + " : ";
		var line_class = "emu_memory_line";
		var value;

		for(var hex = 0; hex < width; ++hex) {
			if (machine.isValidAddress(i+hex)) {
				value = machine.getWordAsUnsigned(i + hex);
				// Handle changes
				if (previous && previous.getWordAsUnsigned(i + hex) != value) {
					line_class += " changed";
				}
				value = emf.utils.hex(value, 5);
			} else {
				value = "xxxxx";
			}

			line += value + " ";
		}

		code +=  "<span class='" + line_class + "'>" + line + "</span>";
	}

	$(div).html(code);
}

emf.framework.paperTape = function(div, device) {
	var code = '';
	var idx = 0;
	var ptr = device.getPointer();
	var tape_width = device.getWidth();

	do {
		var rt = device.peek(idx);
		var tape_class = "emu_tape_entry";

		if (rt.error) {
			break;
		}

		if (idx == ptr) {
			tape_class += " current";
		}

		code +=  "<span class='" + tape_class + "'>" + emf.utils.hex(rt.data, tape_width) + "</span> ";
		++idx;

	} while(!rt.is_eof)

	$(div).html(code);
}
