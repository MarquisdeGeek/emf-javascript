let emulator = (function(bus, options) {
let value = new emf.Number(8);
let pc = new emf.Number(16);
let flagZ;

  function start() {
  }

  function reset() {
    value.assign(0);
    pc.assign(0);
    flagZ = false;
  }

  function update(how) {
  	let opcode = bus.memory.read8(pc.getUnsigned());
  	value.add(opcode);

  	flagZ = (value.getUnsigned() === 0) ? true : false;

  	pc.add(1);
  }

  function getState() {
  	const copyOfV = new emf.Number(8, 2, value);
  	const copyOfPC = new emf.Number(16, 2, pc);

    return {
      flags: {
        z: flagZ
      },

      registers: {
        pc: copyOfPC,
        v:  copyOfV,
      },

      state: {
      },
    };
  }

  function setState(newState) {
    // registers:
    if (typeof newState.registers.v !== typeof undefined) {
      setRegisterValueV(newState.registers.v);
    }

    // Flags:
    if (typeof newState.flags.z !== typeof undefined) {
      setFlagValue('z', newState.flags.z);
    }
  }

  function setFlagValue(name, v) {
    name = name.toLowerCase();
    if (name === 'z') flagZ = v;
  }

  function getRegisterValue(name) {
    name = name.toLowerCase();
    if (name == 'v') return getRegisterValueV();
    if (name == 'pc') return getRegisterValuePC();
  }

  function setRegisterValue(name, v) {
    name = name.toLowerCase();
    if (name === 'v') return setRegisterValueV(v);
    if (name === 'pc') return setRegisterValuePC(pc);
  }

  function getRegisterValueV() {
    return value.getUnsigned();
  }

  function setRegisterValueV(v) {
    value.assign(v);
  }

  function getRegisterValuePC() {
    return pc.getUnsigned();
  }

  function setRegisterValuePC(v) {
    pc.assign(v);
  }


  /*
   **
   ** Expose this API
   **
   */
  return {
    start,
    reset,
    update,
    getState,
    setState,
    getRegisterValuePC,
    setRegisterValuePC,
    setRegisterValue,
    setFlagValue,
  }
});
