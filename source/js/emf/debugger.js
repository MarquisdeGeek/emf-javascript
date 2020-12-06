// The 'debugemf' name was chosen to avoid the usual suspects

emf.debugemf = function(machine, controller, framework) {
let commandHistory = [];
let userCommandList = [];
let handlers = {

  bp: function(cmd) { // e.g. bp list, bp add <addr>
    let device = cmd[2];
    let address;
    let label;

    if (machine.bus[device]) { // if the parameter is on the bus, then use it
      device = machine.bus[device].emulate;
      label = cmd[3];
      address = emf.utils.convertStringToDecimal(label);
    } else { // otherwise, assume it's the default CPU
      device = machine.bus.cpu.emulate;
      label = cmd[2];
      address = emf.utils.convertStringToDecimal(label);
    }

    switch(cmd[1]) {
      case 'list':
      let bplist = controller.getBreakpointList();
      return [ bplist.length ? bplist : 'No breakpoints set.' ];

      case 'clear':
      if (typeof address === typeof undefined) {
        controller.clearBreakpointList();
      } else {
        controller.clearBreakpointAt(address);
      }
      return [ 'Breakpoints cleared' ];

      case 'add':
      controller.addBreakpointAt(address);
      return [ `Set to ${label} ${label==address?'' : '== '.address}` ];

      default:
      return [ `Unknown bp command '${cmd[1]}'` ];
    }
  },

  set: function(cmd) {
    let register = cmd[1];
    let value = emf.utils.convertStringToDecimal(cmd[2]);

    if (register === 'flag') {
      let flag = cmd[2];
      value = emf.utils.convertStringToDecimal(cmd[3]);
      machine.bus.cpu.emulate.setFlagValue(flag, value);
    } else {
      machine.bus.cpu.emulate.setRegisterValue(register, value);
    }

    return framework.getCPUStateAsArray();
  },

  mem: function(cmd) {
    let addr = emf.utils.convertStringToDecimal(cmd[2]);
    let data = emf.utils.convertStringToDecimal(cmd[3]);

    if (typeof addr == typeof undefined) {
      return [ `Invalid address: ${cmd[2]}` ];
    }

    switch(cmd[1]) {
      case 'dump':
      let dumpStr = `0x${emf.utils.hex16(addr)} : `;
      for(let i=0;i<(data||8);++i) { // dump [addr] <num_of_bytes>
        data = machine.bus.memory.read8(addr + i);
        dumpStr += emf.utils.hex8(data) + ' ';
      }
      return [ dumpStr ]

      case 'read8':
      data = machine.bus.memory.read8(addr);
      return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex8(data)}  (%${emf.utils.bin8(data)} ${data})` ]

      case 'read16':
      data = machine.bus.memory.read16(addr);
      return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex16(data)}  (%${emf.utils.bin16(data)} ${data})` ]

      case 'write8':
      machine.bus.memory.write8(addr, data);
      return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex8(data)}  (%${emf.utils.bin8(data)} ${data})` ]

      case 'write16':
      machine.bus.memory.read16(write16, data);
      return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex16(data)}  (%${emf.utils.bin16(data)} ${data})` ]

      case 'watch':
      let memdevice = machine.bus.memory;
      if (cmd[3] === 'clear') {
        memdevice.clearWatcher(addr);
        return [ `Cleared ${addr}` ];
      } else {
        memdevice.addWatcher(addr, function(addr, data, isWrite) {
          if (isWrite) {
            controller.stopRunning();
          }
        });
        return [ `Watching ${addr}` ];
      }
      break;

      default:
      return [ `Unknown mem command '${cmd[1]}'` ];
    }
  },

  run: function() { // same as 'start', because I naturally want to type 'run'!
    controller.startRunning();
    return [ 'Running' ];
  },

  start: function() {
    controller.startRunning();
    return [ 'Running' ];
  },

  stop: function() {
    controller.stopRunning();
    return [ 'Stopped' ];
  },

  step: function() {
    controller.step();
    return framework.getCPUStateAsArray();
  },

  list: function(cmd) {
    let cpu =  machine.bus.cpu;
    let addr = cmd.length < 2 ? cpu.emulate.getRegisterValuePC() : emf.utils.convertStringToDecimal(cmd[1]);
    let rows = emf.utils.convertStringToDecimal(cmd[2]) || 5;
    let dis = [];

      for(; rows > 0; --rows) {
        let line = framework.disassembleLinePlain(cpu, addr, addr);
        dis.push(line.span);
        addr += line.dis.byte_length;
      }

    return dis;
  },

  exec: function(cmd) {
    cmd.splice(0,1); // remove the command
    let instr = cmd.join(' ');
    let asm = machine.bus.cpu.assemble.assemble(instr);

    if (!asm) {
      return [ 'Could not assembler the instruction ' + instr ];  
    }
    machine.bus.cpu.emulate.processBytes(asm.data);
    return [ 'Converted to ' + asm.data.map((d)=>`0x${emf.utils.hex8(d)}`).join(' ') + ' and executed' ];
  },

  refresh: function(cmd) {
    if (machine.bus.display.render) {
      machine.bus.display.render();
      return [ 'Done' ];
    }
    return [ 'Refresh is not supported on this platform' ];
  },

  trace: function(cmd) {
    let sub = cmd.length > 1 ? cmd[1].toLowerCase() : '';
    let rt = `Unknown command: '${sub}'. Options: start, stop, between`;

    if (sub === 'start') {
      controller.traceStart();
      rt = 'Started';
    } else if (sub === 'stop') {
      controller.traceEnd();
      rt = 'Stopped';
    } else if (sub === 'between') {
      let betweenFrom = emf.utils.convertStringToDecimal(cmd[2]);
      let betweenUntil = emf.utils.convertStringToDecimal(cmd[3]);

      controller.traceBetween(betweenFrom, betweenUntil);
      rt = `Tracing between ${betweenFrom} and ${betweenUntil}`;
    }

    return [ rt ];
  },


  peek: function(cmd) {
    let addr = emf.utils.convertStringToDecimal(cmd[1]);

    data = machine.bus.memory.read8(addr);
    return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex8(data)}  (%${emf.utils.bin8(data)} ${data})` ];
  },

  poke: function(cmd) {
    let addr = emf.utils.convertStringToDecimal(cmd[1]);
    let data = emf.utils.convertStringToDecimal(cmd[2]);

    machine.bus.memory.write8(addr, data);
    return [ `0x${emf.utils.hex16(addr)} : 0x${emf.utils.hex8(data)}  (%${emf.utils.bin8(data)} ${data})` ];
  },

  inject: function(cmd) {
    let action = (cmd[1]);

    switch(action) {
      case emf.input.ACTION_KEYDOWN:
      case emf.input.ACTION_KEYUP:
        emf.input.inject(action, cmd[2]);
        break;
    }
    return [ 'OK' ];
  }

}; // end of handlers

  (function ctor() {
  })();

  function executeCommand(cmd) {
    if (cmd === "help" || cmd === '?') {
      return [
        "bp list ; list all breakpoints",
        "bp add <address> ; add new breakpoint",
        "bp clear <address> ; clear breakpoint or all",
        "mem write8 <address> <data>",
        "mem write16 <address> <data>",
        "mem read8 <address>",
        "mem read16 <address>",
        "mem watch <address> [clear]",
        "set <registername> <value>",
        "set flag <flagname> <value>",
        "start ; also, run",
        "stop",
        "step",
        "exec <asm mneumonic>",
        "refresh ; force display refresh",
        "trace <start|stop|between> ; write every CPU step to console.log",
        "list [start_address] [rows] ; show disassembly, start_address defaults to PC",
        "inject <keydown|keyup> <keyname|ascii>",
        //
        "peek <address> ; synonym for read8",
        "poke <address> <data> ; synonym for write8",
        ];
    }
    //
    commandHistory.unshift(cmd);
    commandHistory.splice(100); // limit history to 100 items, by removing everything after element 100

    let splitCmd = cmd.split(/\s+/);
    if (splitCmd.length < 1) {
      return [];// no command

    } else if (handlers[splitCmd[0]]) {
      return handlers[splitCmd[0]](splitCmd);

    } else { // Check user-supplied commands
      let rt = undefined;
      userCommandList.forEach((c) => {
        if (c.cmd === splitCmd[0]) {
          rt = c.cbfn(splitCmd);
        }
      });
      //
      if (rt) {
        return rt;  
      }
    }
    //
    return ["Unknown command"];
  }

  function info(type) {
    let info = [ "Info: " + type ];
    if (type[0] == 'b') {
      for(let i=0;i<bp.length;++i) {
        info.push(bp[i]);
      }
    }
    //
    userCommandList.forEach((c) => {
      info.push(c.info);
    });
    //
    return info;
  }

  function getHistory(idx) {// idx is the negative index, i.e. 1 is the previous item
    // However, since our history is pushed to the front of the array, the previous
    // item is 0, the second previous (2) is 1, and so on.
    idx = idx || 1;
    if (idx > commandHistory.length) {
      return '';
    }
    return commandHistory[idx - 1];
  }

  function addCommand(cmd, info, cbfn) {
    userCommandList.push({
      cmd: cmd,
      info: info,
      cbfn: cbfn
    });
  }

  return {
    addCommand,
    executeCommand,
    getHistory,
  };

}
