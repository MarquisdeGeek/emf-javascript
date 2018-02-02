
// Note: Suitable for <=32 bit numbers only.
// We store 'value' as the number in an unsigned manner. If the MSB bit is set, then it's considered negative.
emf.Number = function(n, compl, value) {
var value, complement, bits;
var mask_msb, mask_result, mask_value, value_neg;


	(function ctor(n, compl, value) {
		if (n && n.hasOwnProperty('get')) {
			// Copy constructing an emf.Number
			compl = n.getComplement();
			value = n.getUnsigned();
			n = n.getBitWidth();
		}
		bits = n;
		complement = compl;
		mask_msb = 1<<(bits-1);
		mask_result = (1<<(bits)) - 1;
		mask_value = (1<<(bits-1)) - 1;
		value_neg = -mask_msb;

		assign(value);

	})(n, compl, value);

	// Private utilities
	function asValue(v) {
		if (v.hasOwnProperty('get')) {
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
			//value +
			//value = value - value_neg;
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
		for(var i=0;i<v;++i) {
			if (value & (mask_msb>>1)) {
				value |=  mask_msb;
			}
			value <<= 1;
		}
		assign(value);
	}

	function shiftLogicalRight(v) {
		for(var i=0;i<v;++i) {
			setOverflow(v & 1); // TODO: or should this be underflow
			value >>= 1;
		}
		assign(value);
	}

	// IO
	function get() {
		return value & mask_msb ? value_neg+(value & mask_value) : (value & mask_value);
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
		m &= emf.Number.maskLSB(msb-lsb);
		return m;
	}



	function equals(r) {
		return r == get();
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


	// Internal
	function getBitsSet(i) {
		// This works only for max 32 bits
		i = i - ((i >>> 1) & 0x55555555);
		i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
		return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;		
	}

/*
Z - Zero flag
Set if the value is zero
F5 - undocumented flag
Copy of bit 5
H - Half Carry
Carry from bit 3 to bit 4
F3 - undocumented flag
Copy of bit 3
P/V - Parity or Overflow
Parity set if even number of bits set
Overflow set if the 2-complement result does not fit in the register
N - Subtract
Set if the last operation was a subtraction
C - Carry
Set if the result did not fit in the register	
*/

	return {
		assign,
		add,
		adc,
		sub,
		neg,
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
		isNegative : function() { return value & mask_msb ? true : false; },
		isOverflow : function() { return flagV; }
	};

}

// The left most N bits
emf.Number.maskLSB = function(bits) {
	return (1<<bits) - 1;
}

// The right most N bits, of a TOTAL bit word
emf.Number.maskMSB = function(bits, total) {
	var mask = (1<<bits) - 1;
	return mask << (total - bits);
}
