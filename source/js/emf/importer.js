emf.importer = (function() {
let loader = {
  // Machines
  emf: emfState,
  json: emfState,
  // Memory
  hex: intelHEX,
  ihj: intelHEXJSON,
  hxs: hexString,
  bin: raw
};

  function unifyInputData(data) {
    if (data instanceof Uint8Array) {
      return toStringArray(data);
    }
    if (typeof data == 'string') {
      return data.split('\n');
    }
    return data;
  }

  function unifyFormat(txt) {
    let format = txt.split(':');
    return {
      format: format[0] || 'unknown',
      version: parseInt(format[1]) || 0
    };
  }

  function toStringArray(data) {
    let theString = typeof data === 'string' ? data : new TextDecoder("utf-8").decode(data);
    let theArray = theString.split('\n');
    return theArray;
  }

  //
  // Importers - machines
  //
  function emfState(machine, data) {
    let theString = typeof data === 'string' ? data : new TextDecoder("utf-8").decode(data);
    let json = JSON.parse(theString);

    for (let devname in machine.device) {
      if (machine.device.hasOwnProperty(devname)) {
        if (!json[devname]) {
          console.log(`No '${devname}' to import.`);
        } else if (!machine.device[devname].setState) {
          console.error(`No way of loading the state for '${devname}' because the 'setState' method doesnt exist.`);
        } else if ('emf.state.json' !== unifyFormat(json[devname].format).format) {
          console.error(`The '${devname}' state block is not in a valid format.`);
        } else {
          machine.device[devname].setState(json[devname].state);
        }
      }
    }

    return true;
  }

  //
  // Importers- memory
  //
  function intelHEXJSON(targetDevice, data) {
    let memory = targetDevice.read8 ? targetDevice : targetDevice.bus.memory;

    data.rows.forEach((row) => {
      for(let i=0;i<row.size;++i) {
        let byte = parseInt(row.data.substr(i*2,2), 16);
        memory.write8(row.address + i, byte, true);
      }
    });
  }

  function intelHEX(targetDevice, data) {
    let memory = targetDevice.read8 ? targetDevice : targetDevice.bus.memory;
    // As described by https://en.wikipedia.org/wiki/Intel_HEX
    data = unifyInputData(data);
    //
    data.forEach((row) => {
      if (row[0] !== ':') {
        return;
      }
      let byteCount  = parseInt(row.substr(1,2), 16);
      let address    = parseInt(row.substr(3,4), 16);
      let recordType = parseInt(row.substr(7,2), 16);

      switch(recordType) {
        case 0: //data
        let checksum = 0;
        // REM: the checksum includes the record type and starting address
        for(let i=0;i<4;++i) {
          let byte = parseInt(row.substr(1+i*2,2), 16);
          checksum += byte;
        }
        // Write the rest of the data (excluding the checksum) into memory
        for(let i=0;i<byteCount;++i) {
          let byte = parseInt(row.substr(9+i*2,2), 16);
          checksum += byte;
          memory.write8(address + i, byte, true);
        }
        // Compute the checksum
        checksum &= 0xff;
        checksum = (-checksum) & 0xff;
        let checkWith = parseInt(row.substr(9+byteCount*2,2), 16);
        if (checkWith != checksum) {
          console.log(`EMF.importer.intelHEX : Error in checksum in row ${row}`)
        }
        break;
        case 1: // EOF, this row should always be :00000001FF
        break;
        default:
        console.log(`EMF.importer.intelHEX : Error with supported record type ${recordType}`)
        break;
      }
    });
  }

  function hexString(targetDevice, hexcodes, startAddress) {
    let memory = targetDevice.read8 ? targetDevice : targetDevice.bus.memory;
    hexcodes = hexcodes.replace(/0x/gi, '');
    hexcodes = hexcodes.replace(/\s/g, '');
    for(let i=0;i<hexcodes.length;i+=2) {
      let byte = parseInt(hexcodes.substr(i,2), 16);
      memory.write8(startAddress + i/2, byte, true);
    }
  }

  function raw(targetDevice, data, startAddress) {
    let memory = targetDevice.read8 ? targetDevice : targetDevice.bus.memory;
    for(let i=0;i<data.length;++i) {
      memory.write8(startAddress + i, data[i], true);
    }
  }

  function fromArrayToString(data) {
    let str = "";
    data.forEach((c) => {
      str += String.fromCharCode(c);
    })
    return str;
  }

  // data : an array with byte values, holding the contents of the file
  function byFilename(filename, targetDevice, startAddress, data) {
    let extension = filename.lastIndexOf('.');
    if (extension === -1) {
      return raw(targetDevice, data, startAddress);
    }
    extension = filename.substr(extension + 1);
    extension = extension.toLowerCase();
    if (loader[extension]) {
      if (loader[extension] !== raw) { //everything not 'raw' uses a text string
        data = fromArrayToString(data);
      }
      return loader[extension](targetDevice, data, startAddress);
    }
    return raw(targetDevice, data, startAddress);
  }

  function byURL(url) {
    return new Promise(function(resolve, reject) {
      fetch(url)
      .then(function(res){
        return res.blob()
      })
      .then(function(blob){
        return blob.arrayBuffer();
      })
      .then(function(data){
        return new Uint8Array(data);
      })
      .then(function(data){
        resolve(data);
      })
      .catch(function(e){
        reject(e);
      })
    });
  }

  return {
    byFilename,
    byURL,
    //
    intelHEX,
    intelHEXJSON,
    hexString,
    raw,
    emfState
  }
});
