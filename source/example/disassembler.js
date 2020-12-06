let disassembler = (function(bus, options) {
  function disassemble(address) {
    return {
      byte_length: 1,
      instruction: `v += ${bus.memory.read8(address)}`
    };
  }

  return {
    disassemble
  }
});
