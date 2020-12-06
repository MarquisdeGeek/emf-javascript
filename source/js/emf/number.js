// Note: Suitable for <=32 bit numbers only.
// We store 'value' as the number in an unsigned manner. If the MSB bit is set, then it's considered negative.
emf.Number = function(numBits, compl, initialValue) {
  let value, complement, bits;
  let mask_msb, mask_result, mask_value, value_neg;

  (function ctor(numBits, compl, initialValue) {
    if (numBits && numBits.hasOwnProperty('get')) {
      // Copy constructing an emf.Number
      compl = numBits.getComplement();
      initialValue = numBits.getUnsigned();
      numBits = numBits.getBitWidth();
    }
    bits = numBits || 8;
    complement = compl || 2;
    mask_msb = 1 << (bits - 1);
    mask_result = (1 << (bits)) - 1;
    mask_value = (1 << (bits - 1)) - 1;
    value_neg = -mask_msb;

    assign(initialValue);

  })(numBits, compl, initialValue);

  // Private utilities
  function asValue(v) {
    if (typeof v === 'number') {
      // NOP
    } else if (typeof v === 'undefined') {
      // NOP
    } else if (v.hasOwnProperty('get')) {
      return v.get();
    }
    return v;
  }

  // Operations
  function assign(v) {
    value = asValue(v);
    // Note: the source number may not be the same size
    // as the destination, so we re-work the number here.
    if (value < 0) {
      value += mask_result + 1;
    }
    value &= mask_result;
    return this;
  }

  // Arithmetic
  function add(v) {
    var v_prime = asValue(v);
    var orig = v_prime;

    value += asValue(v_prime);
    setOverflow(value >= mask_result);

    value &= mask_result;
    return this;
  }

  function adc(v, c) {
    var over = false;

    add(v)
    over |= isOverflow();

    add(asValue(c) ? 1 : 0);
    over |= isOverflow();

    flagV = over;

    return this;
  }

  function sub(v) {
    assign(value - asValue(v));
    return this;
  }

  function neg() {
    assign((~value) + 1);
    return this;
  }

  // Logic
  function bitAnd(v) {
    value &= asValue(v);
    return this;
  }

  function bitOr(v) {
    value |= asValue(v);
    return this;
  }

  function shiftLogicalLeft(v) {
    for (var i = 0; i < v; ++i) {
      if (value & (mask_msb >> 1)) {
        value |= mask_msb;
      }
      value <<= 1;
    }
    assign(value);
  }

  function shiftLogicalRight(v) {
    for (var i = 0; i < v; ++i) {
      setOverflow(v & 1); // TODO: or should this be underflow
      value >>= 1;
    }
    assign(value);
  }

  // IO
  function get() {
    return value & mask_msb ? value_neg + (value & mask_value) : (value & mask_value);
  }

  function getUnsigned() {
    return value;
  }

  function getComplement() {
    return complement;
  }

  function getBitWidth() {
    return bits;
  }


  function getMasked(msb, lsb) {
    var m = value >> lsb;
    m &= emf.Number.maskLSB(msb - lsb);
    return m;
  }



  function equals(r) {
    var r_prime = asValue(r);
    return r_prime === get();
  }

  function notEquals(r) {
    var r_prime = asValue(r);
    return r_prime !== get();
  }

  // Flags
  function setSign(v) {
    if (v === undefined) {
      flagS = value & mask_msb;
    } else {
      flagS = v;
    }
    return this;
  }

  function setZero(v) {
    if (v === undefined) {
      flagZ = value == 0;
    } else {
      flagZ = v;
    }
    return this;
  }

  function setParity(v) {
    if (v === undefined) {
      flagP = getBitsSet(value) & 1 ? false : true;
    } else {
      flagP = v;
    }
    return this;
  }

  function setOverflow(v) {
    flagV = v;
    return this;
  }

  function isNegative() {
    return value & mask_msb ? true : false;
  }

  function isOverflow() {
    return flagV;
  }

  // Internal
  function getBitsSet(i) {
    // This works only for max 32 bits
    i = i - ((i >>> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
    return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }

  return {
    assign,
    add,
    adc,
    sub,
    neg,
    notEquals,
    equals,
    get,
    getUnsigned,
    getBitWidth,
    bitAnd,
    bitOr,
    shiftLogicalLeft,
    shiftLogicalRight,
    getComplement,
    getMasked,
    //
    isNegative,
    isOverflow
  };

}

// The left most N bits
emf.Number.maskLSB = function(bits) {
  return (1 << bits) - 1;
}

// The right most N bits, of a TOTAL bit word
emf.Number.maskMSB = function(bits, total) {
  var mask = (1 << bits) - 1;
  return mask << (total - bits);
}

emf.Number.getUnsigned = function(v) {
  if (typeof v === emf.Number) {
    return v.getUnsigned();
  }
  return v;
}

emf.Number.prototype.toString = function() {
  return value;
}
