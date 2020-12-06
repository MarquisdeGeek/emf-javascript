emf.framework = (function(machine) {

  function getCPUStateAsArray() {
    let state = [];
    let cpu = machine.bus.cpu.emulate.getState();

    state.push('Registers:');
    let reglist = cpu.registers;
    Object.keys(reglist).forEach(function(reg_name) {
      let reg_value = reglist[reg_name];
      state.push(`${reg_name} : 0x${emf.utils.hex(reg_value.getUnsigned(), sgxRoundUp(reg_value.getBitWidth()/4))}`);
    });

    state.push('');

    state.push('Flags:');
    let flaglist = cpu.flags;
    let flagresult = '';
    Object.keys(flaglist).forEach(function(flag_name) {
      let flag_value = flaglist[flag_name];
      flagresult += `  ${flag_name} : ${flag_value ? "1" : "0"}`;
    });
    state.push(flagresult);

    return state;
  }

  function registers(div, cpu, previous_state) {
    const state = cpu.emulate.getState();
    const rowsOf = 3;
    let reglist = state.registers;
    let code = '';
    let columnIn = 0;

    Object.keys(reglist).forEach(function(reg_name) {
      if (columnIn == 0) {
        code += `<div class="row">`;
      }
      let reg_value = reglist[reg_name];
      let span_class = "emf_register";

      if (previous_state && previous_state.registers[reg_name].get() != reg_value.get()) {
        span_class += " changed";
      }
      code += `<div class="col-sm-${12/rowsOf}">`;
      code += `<span class='${span_class}'>`;
      code += `${reg_name}:0x${emf.utils.hex(reg_value.getUnsigned(), sgxRoundUp(reg_value.getBitWidth()/4))}`;
      code += `</span></div>`;
      //
      if (++columnIn == rowsOf) {
        code += `</div>`;
        columnIn = 0;
      }
    });
    //
    if (columnIn == 0) {
      code += `</div>`;
    }
    //
    let flaglist = state.flags;
    Object.keys(flaglist).forEach(function(flag_name) {
      let flag_value = flaglist[flag_name];
      let span_class = "emf_register";
      if (previous_state && previous_state.flags[flag_name] != flag_value) {
        span_class += " changed";
      }
      code += `<span class='${span_class}'>`;
      code += `${flag_name}:${flag_value ? "1" : "0"}&nbsp;&nbsp;`;
      code += `</span>`;
    });
    //
    $(div).html(code);
  }


  function disassembleLinePlain(cpu, addr, pc) {
    let dis = cpu.disassemble.disassemble(addr);
    let line = "";
    let word_width = 2;

    line += emf.utils.hex16(addr) + " : ";
    //
    let instr = '';
    for (let hex = 0; hex < dis.byte_length; ++hex) {
      if (machine.bus.memory.isValidAddress(addr + hex)) {
        instr += emf.utils.hex(machine.bus.memory.read8(addr + hex), word_width) + " ";
      } else {
        instr += "xx ";
      }
    }

    if (machine.options.disassemble.widthColumnHex) {
      line += emf.utils.pad(instr, machine.options.disassemble.widthColumnHex);
    }

    line += emf.utils.pad(dis.instruction, machine.options.disassemble.widthColumnInstruction);
    if (dis.comment) {
      line += "; " + emf.utils.toMarkup(dis.comment);
    }

    let label = machine.bus.memory.getLabel(addr);
    if (label) {
      line += "; " + label;
    }

    return {
      span: line,
      dis: dis
    }
  }


  function disassembleLine(cpu, addr, pc) {
    let dis = cpu.disassemble.disassemble(addr);
    let line = "";
    let word_width = 2;

    if (pc == addr) {
      line += "<span class='emf_disassembly_line current'>";
    } else {
      line += "<span class='emf_disassembly_line'>";
    }
    line += emf.utils.hex16(addr) + " : ";
    //
    let instr = '';
    for (let hex = 0; hex < dis.byte_length; ++hex) {
      if (machine.bus.memory.isValidAddress(addr + hex)) {
        instr += emf.utils.hex(machine.bus.memory.read8(addr + hex), word_width) + " ";
      } else {
        instr += "xx ";
      }
    }

    if (machine.options.disassemble.widthColumnHex) {
      line += emf.utils.toMarkup(emf.utils.pad(instr, machine.options.disassemble.widthColumnHex));
    }

    line += emf.utils.toMarkup(emf.utils.pad(dis.instruction, machine.options.disassemble.widthColumnInstruction));
    if (dis.comment) {
      line += "; " + emf.utils.toMarkup(dis.comment);
    }

    let label = machine.bus.memory.getLabel(addr);
    if (label) {
      line += "; " + label;
    }

    line += "</span><br>";

    return {
      span: line,
      dis: dis
    }
  }

  function disassembleRows(div, cpu, fromAddr, maxRows, pc) {
    let code = '';
    let row = 0;

    for (let addr = fromAddr; row < maxRows; ++row) {
      let line = disassembleLine(cpu, addr, pc);

      code += line.span;

      addr += line.dis.byte_length;
    }

    $(div).html(code);
  }

  function disassembleRange(div, cpu, fromAddr, untilAddr, pc) {
    let code = '';
    let row = 0;

    for (let addr = fromAddr; addr < untilAddr;) {
      let line = disassembleLine(cpu, addr, -1, pc);

      code += line.span;

      addr += line.dis.byte_length;
    }

    $(div).html(code);
  }

  function memoryRange(memoryBlock, fromAddr, untilAddr, previous = null) {
    let code = '';
    let width = 8;
    let word_width = 2;
    let show_ascii = false;

    if (machine.options.framework && machine.options.framework.memoryView) {
      width = machine.options.framework.memoryView.width || width;
      show_ascii = machine.options.framework.memoryView.showASCII;
    }

    for (let i = fromAddr; i < untilAddr; i += width) {
      let line = emf.utils.hex16(i) + " : ";
      let line_class = "emf_memory_line";

      for (let hex = 0; hex < width; ++hex) {
        let value;
        if (memoryBlock.isValidAddress(i + hex)) {
          value = memoryBlock.read8(i + hex);
        }
        //
        if (typeof value !== typeof undefined) {
          // Handle changes
          if (previous && memoryBlock.read8(i + hex) != value) {
            line_class += " changed";
          }
          value = emf.utils.hex(value, word_width);
        } else {
          value = "xx";
        }

        line += value + " ";
      }

      if (show_ascii) {
        line += " : ";
        for (let hex = 0; hex < width; ++hex) {
          if (memoryBlock.isValidAddress(i + hex)) {
            let a = memoryBlock.read8(i + hex);
            let ch = sgxToCharacter(a);
            line += sgxIsPrint(ch) && a > 31 && a < 128 ? '&#' + a + ';' : '?';
          } else {
            line += "?";
          }
        }
      }

      code += line + "<br>";
    }
    return code;
  }

  function memory(div, memory, fromAddr, untilAddr, previous) {

    if (typeof fromAddr == typeof undefined) {
      let code = '';
      memory.getAddressRanges().forEach((blk) => {
        code += memoryRange(memory, blk.start, blk.start + blk.size, previous);
      })
      $(div).html(code);
      return;
    }

    let code = memoryRange(memory, fromAddr, untilAddr, previous);

    $(div).html(code);
  }

  function paperTape(div, device) {
    let code = '';
    let idx = 0;
    let ptr = device.getPointer();
    let tape_width = device.getWidth();

    do {
      let rt = device.peek(idx);
      let tape_class = "emf_tape_entry";

      if (rt.error) {
        break;
      }

      if (idx == ptr) {
        tape_class += " current";
      }

      code += "<span class='" + tape_class + "'>" + emf.utils.hex(rt.data, tape_width) + "</span> ";
      ++idx;

    } while (!rt.is_eof)

    $(div).html(code);
  }

  function createMemoryDisplay(options) {
    options = options || {};
    let div = $(options.divTab);
    let addressRanges = machine.bus.memory.getAddressRanges();
    let isActive = " active";
    let stub = `emf_memory_`;

    addressRanges.forEach((range) => {
      let li = `<li class="nav-item">`;
      li += `<a class="nav-link ${isActive}" id="${stub}${range.name}-tab" data-toggle="tab" href="#${stub}${range.name}" role="tab" aria-controls="${stub}${range.name}" aria-selected="true">${range.name.toUpperCase()}</a>`;
      li += `</li>`;

      div.append(li);

      isActive = '';
    });

    let divContents = $(options.divContentsTab);
    isActive = " active";
    addressRanges.forEach((range) => {
      let content = `<div class="tab-pane fade show ${isActive}" id="${stub}${range.name}" role="tabpanel" aria-labelledby="${stub}${range.name}-tab">`;
      content += `<div class="card scrollable" id="${stub}${range.name}_content"></div>`;
      content += `</div>`;
      divContents.append(content);
      isActive = '';
    });
  }

  function populateMemoryDisplay(forceUpdate) {
    let addressRanges = machine.bus.memory.getAddressRanges();
    addressRanges.forEach((range) => {
      let divContent = `#emf_memory_${range.name}_content`;
      if (range.shadow) {
        $(divContent).html('Shadow');
        return;
      } else if (!range.enabled) {
        $(divContent).html('Disabled');
        return;
      } else if (forceUpdate) {
        //  NOP
      } else if (!range.write) {
        return;
      }
      gStateVars.framework.memory(divContent, machine.bus.memory, range.start, range.start + range.size);
    })
  }

  return {
    getCPUStateAsArray,
    createMemoryDisplay,
    registers,
    disassembleRows,
    disassembleLinePlain,
    disassembleLine,
    disassembleRange,
    populateMemoryDisplay,
    memory,
    paperTape
  }
});