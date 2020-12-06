/*
 **
 ** EMF Machine
 **
 */
function emfNullEmulator(options) {
  options = options || {};
  options.cpu = options.cpu || {};
  options.cpu.directMemory = typeof options.cpu.directMemory === typeof undefined ? false : options.cpu.directMemory
  options.cpu.directIORQ = typeof options.cpu.directIORQ === typeof undefined ? true : options.cpu.directIORQ
  options.cpu.directFetch = typeof options.cpu.directFetch === typeof undefined ? false : options.cpu.directFetch
  options.memory = options.memory || {};
  // 

  /*
   **
   ** Create the machine
   **
   */
  let m = {};
  m.name = "NUL";
  m.description = "A machine which does nothing, but demonstrates the interfaces needed by EMF";

  /*
   **
   ** Create the bus
   **
   */
  m.bus = new emf.bus({
    reset: function() {
      m.bus.setHigh('vsync');
    }
  });

  /*
   **
   ** Add everything in the device object
   **
   */
  m.device = {};
  m.device.cpu = {};
  m.device.cpu.name = "z80";
  m.device.cpu.getState = function() {
    let state = m.device.cpu.emulate.getState();
    Object.keys(state.registers).map((r) => state.registers[r] = state.registers[r].getUnsigned());
    return state;
  }
  m.device.cpu.setState = function(json) {
    return m.device.cpu.emulate.setState(json);
  }
  m.device.cpu.emulate = new emulator(m.bus, options.cpu);
  m.device.cpu.disassemble = new disassembler(m.bus, options.cpu);
  m.device.cpu.assemble = new assembler(m.bus, options.cpu);
  m.device.memory = new memory(m.bus, options.memory);

  /*
   **
   ** Attach devices to the bus
   **
   */
  m.bus.cpu = m.device.cpu;
  m.bus.memory = m.device.memory;

  /*
   **
   ** State
   **
   */
  m.state = {};
  m.state.cpu = {};

  /*
   **
   ** Clocks
   **
   */
  m.bus.clock = {};
  m.clock = {};
  m.clock.cpu = new clock_cpu(m, options);
  m.bus.clock.cpu = m.clock.cpu;

  /*
   **
   ** Construction complete - initialisation methods
   **
   */
  m.start = function() {
    let processed = {};
    m.bus.reset();
    if (m.bus.cpu.emulate.start) processed.cpu = m.bus.cpu.emulate.start(m.bus.cpu, arguments);
    if (m.bus.cpu.disassemble.start) processed.cpu = m.bus.cpu.disassemble.start(m.bus.cpu, arguments);
    if (m.bus.cpu.assemble.start) processed.cpu = m.bus.cpu.assemble.start(m.bus.cpu, arguments);
    if (m.bus.memory.start) processed.memory = m.bus.memory.start(m.bus.memory, arguments);
    if (m.bus.clock.start) processed.clock = m.bus.clock.start(m.bus.clock, arguments);
    return processed;
  };
  m.reset = function() {
    let processed = {};
    m.bus.reset();
    if (m.bus.cpu.emulate.reset) processed.cpu = m.bus.cpu.emulate.reset(m.bus.cpu, arguments);
    if (m.bus.cpu.disassemble.reset) processed.cpu = m.bus.cpu.disassemble.reset(m.bus.cpu, arguments);
    if (m.bus.cpu.assemble.reset) processed.cpu = m.bus.cpu.assemble.reset(m.bus.cpu, arguments);
    if (m.bus.memory.reset) processed.memory = m.bus.memory.reset(m.bus.memory, arguments);
    if (m.bus.clock.reset) processed.clock = m.bus.clock.reset(m.bus.clock, arguments);
    return processed;
  };
  m.getState = function() {
    let processed = {};
    if (m.bus.cpu.emulate.getState) processed.cpu = m.bus.cpu.emulate.getState(m.bus.cpu, arguments);
    if (m.bus.cpu.disassemble.getState) processed.cpu = m.bus.cpu.disassemble.getState(m.bus.cpu, arguments);
    if (m.bus.cpu.assemble.getState) processed.cpu = m.bus.cpu.assemble.getState(m.bus.cpu, arguments);
    if (m.bus.memory.getState) processed.memory = m.bus.memory.getState(m.bus.memory, arguments);
    return processed;
  };
  m.setState = function() {
    let processed = {};
    if (m.bus.cpu.emulate.setState) processed.cpu = m.bus.cpu.emulate.setState(m.bus.cpu, arguments);
    if (m.bus.cpu.disassemble.setState) processed.cpu = m.bus.cpu.disassemble.setState(m.bus.cpu, arguments);
    if (m.bus.cpu.assemble.setState) processed.cpu = m.bus.cpu.assemble.setState(m.bus.cpu, arguments);
    if (m.bus.memory.setState) processed.memory = m.bus.memory.setState(m.bus.memory, arguments);
    return processed;
  };
  m.update = function(how) {
    let processed = {};
    processed.cpu = m.device.cpu.emulate.update(how);
    return processed;
  };


  /*
   **
   ** Device-specific options - essentially globals
   **
   */
  m.options = {};
  m.options.disassemble = {};
  m.options.disassemble.widthColumnHex = 12;
  m.options.disassemble.widthColumnInstruction = 14;

  return m;
}