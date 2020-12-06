const memory = (function(bus, options) {
const size = 64;
const ram = Array.apply(null, Array(size)).map(function (a,i) { return i});

  function isValidAddress(addr) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;

    return (addr >= 0 && addr < size) ? true : false;
  }

  function getLabel(addr) {
  	return '';
  }

  function getAddressRanges() {
    let ranges = [];
    ranges.push({
      name: 'ram',
      start: 0,
      size: size,
      read: true,
      write: true,
      shadow: false,
      enabled: true
    });
    return ranges;
  }

  function read8(addr, forceRead) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;

    if (addr >= 0 && addr < size) {
      return ram[addr];
    } //fi 
  }

  function write8(addr, data, forceWrite) {
    addr = addr.getUnsigned ? addr.getUnsigned() : addr;
    addr &= 0xffff;
    data = data.getUnsigned ? data.getUnsigned() : data;
    data &= 0xff;

    if (addr >= 0 && addr < size) {
      ram[addr] = data;
    } //fi 
  }

  function getState() {
    let state = [];
    getAddressRanges().forEach((blk) => {
      if (!blk.shadow) {
        let memdata = [];
        for (let i = 0; i < blk.size; ++i) {
          memdata.push(read8(blk.start + i, true));
        }

        state.push({
          start: blk.start,
          data: memdata
        });
      }
    });

    return state;
  }

  function setState(json) {
    json.forEach((blk) => {
      let address = blk.start;
      for (let i = 0; i < blk.data.length; ++i, ++address) {
        write8(address, blk.data[i], true);
      }
    });
  }

  /*
   **
   ** Public interface
   **
   */
  return {
    isValidAddress,
    getAddressRanges,
    getLabel,
    read8,
    write8,
    getState,
    setState,
  };
});
