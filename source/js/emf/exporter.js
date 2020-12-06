emf.exporter = (function() {

  function emfMachine(machine, options) {
    let state = {};

    options = options || {};

    for (let devname in machine.device) {
      let getStateMethod = machine.device[devname].getState;

      if (getStateMethod && machine.device.hasOwnProperty(devname)) {
        state[devname] = {
          format: 'emf.state.json:1',
          state: getStateMethod()
        };
      }
    }

    return state;
  }

  function emfNameValue(stateObj, options) {
    options = options || {};

    let state = {};
    state.format = "emf.namevalue.json:1";
    state.state = {};
    
    // Convert it into native types
    Object.keys(stateObj).forEach(function(name) {
      state.state[name] = stateObj[name].getUnsigned ? stateObj[name].getUnsigned() : stateObj[name];
    });

    return state;
  }

  function emfMemory(memory, options) {
    return intelHEXJSON(memory, options);
  }

  function intelHEXJSON(memory, options) {
    options = options || {};
    options.maxLineLengthInCharacters = 64;

    let state = {};
    state.format = "intel.hex.json:1";
    state.rows = [];

    function addBlock(memoryStart, memoryEnd) {
      let rowStartAddress = memoryStart;
      let thisRow = "";

      function newRow(nextAddress) {
        state.rows.push({
          address: rowStartAddress,
          size:    thisRow.length / 2,
          data:    thisRow
        });
        thisRow = "";
        rowStartAddress = nextAddress;
      }

      for(let addr=memoryStart;addr<memoryEnd;++addr) {
        let byte = memory.read8(addr, true);
        thisRow += byte ? emf.utils.hex(byte, 2) : '00';
        if (thisRow.length >= options.maxLineLengthInCharacters) {
          newRow(addr+1);
        }
      }
      // Any left over rows?
      if (thisRow) {
        newRow();
      }
    }

    memory.getAddressRanges().forEach((block) => {
      if (!block.shadow) {
        addBlock(block.start, block.start + block.size);
      }
    })

    return state;
  }

  /*
  https://en.wikipedia.org/wiki/Intel_HEX
  */
  function intelHEX(memory, options) {
    let state = {};
    state.format = "intel.hex.json:1";
    state.rows = [];


    function addBlock(memoryStart, memoryEnd) {
      let rowStartAddress = memoryStart;
      let thisRow = "";

      function newRow(nextAddress) {
        let byteCount = thisRow.length / 2;
        let prefix = emf.utils.hex(byteCount, 2); // byteCount
        prefix += emf.utils.hex(rowStartAddress, 4); // address
        prefix += emf.utils.hex(0, 2); // recordType

        // Compute the checksum
        let checksum = 0;
        for(let i=0;i<byteCount;++i) {
          let byte = parseInt(thisRow.substr(i*2,2), 16);
          checksum += byte;
        }
        checksum &= 0xff;
        checksum = (-checksum) & 0xff;
        checksum = emf.utils.hex(checksum, 2);

        // To be written:
        thisRow = ':' + prefix + thisRow + checksum;

        state.rows.push(thisRow);
        thisRow = "";
        rowStartAddress = nextAddress;
      }

      for(let addr=memoryStart;addr<memoryEnd;++addr) {
        let byte = memory.read8(addr, true);
        thisRow += byte ? emf.utils.hex(byte, 2) : '00';
        if (thisRow.length >= 32) {
          newRow(addr+1);
        }
      }
      // Any left over rows?
      if (thisRow) {
        newRow();
      }
    }

    memory.getAddressRanges().forEach((block) => {
      if (!block.shadow) {
        addBlock(block.start, block.start + block.size);
      }
    })

    state.rows.push(':00000001FF');

    return state;
  }

  return {
    emfMachine,
    emfMemory,
    emfNameValue,
    // Third party formats
    intelHEX,
    intelHEXJSON,
  }
});
