emf.bus = (function(options) {
let lines = {};
let blocks = {}; // a block of data lines, e.g. keycode, or address lines
let self = this;

  (function ctor() {
    options = options || {};

    options.reset = options.reset || function() {};
  })();

  function reset() {
    options.reset(self);
  }

  function getLine(name) {
    if (!lines[name]) {
      lines[name] = {
        state: false,
        listen: []
      }
    }

    return lines[name];
  }

  function getBlock(name) {
    if (!blocks[name]) {
      blocks[name] = {
        data: 0,
      }
    }

    return blocks[name];
  }

  function attachPin(name, ref) {
    getLine(name).listen.push(ref);
  }

  function readPinState(name) {
    let tr = getLine(name);
    return tr.state;
  }

  function setHigh(name) {
    let tr = getLine(name);
    if (tr.state === false) {
        tr.state = true;
        sendToAll(tr.listen, 'onRising');
    }
  }

  function setLow(name) {
    let tr = getLine(name);
    if (tr.state === true) {
        tr.state = false;
        sendToAll(tr.listen, 'onFalling');
    }
  }

  function pulseLow(name) {
    setLow(name);
    setHigh(name);
  }

  function pulseHigh(name) {
    setHigh(name);
    setLow(name);
  }

  function readBlock(name) {
    let blk = getBlock(name);
    return blk.data;
  }

  function writeBlock(name, data) {
    let blk = getBlock(name);
    blk.data = data;
  }

  function sendToAll(refList, method) {
    refList.forEach((r) => {
      if (r[method]) {
        r[method]();
      }
    })
  }

  return {
    reset,
    //
    attachPin,
    readPinState,
    readBlock,
    writeBlock,
    setHigh,
    setLow,
    pulseLow,
    pulseHigh
  }
});
