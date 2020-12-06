emf.Maths = emf.Maths || {};

//
// 8-bit
//
emf.Maths.add_u8u8 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + v2 + v3) & 0xff;
}

emf.Maths.add_u8s8 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + (v2&0x80 ? (v2-256) : v2) + v3) & 0xff;
}

emf.Maths.eq8 = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 === v2;
}

emf.Maths.neq8 = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 !== v2;
}

emf.Maths.bit8or = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 | v2;
}

emf.Maths.bit8and = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 & v2;
}

emf.Maths.bit8xor = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 ^ v2;
}

//
// 16-bit
//
emf.Maths.add_u16u8 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + v2 + v3) & 0xffff;
}

emf.Maths.add_u16u16 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + v2 + v3) & 0xffff;
}

emf.Maths.add_u16s16 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + (v2&0x8000 ? (v2-65536) : v2) + v3) & 0xffff;
}

emf.Maths.add_u16s8 = function(v1, v2, v3 = 0) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 + (v2&0x80 ? (v2-256) : v2) + v3) & 0xffff;
}

emf.Maths.sub_u16u16 = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return (v1 - v2) & 0xffff;
}

emf.Maths.eq16 = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 === v2;
}

emf.Maths.neq16 = function(v1, v2) {
  v1 = v1.get ? v1.getUnsigned() : v1;
  v2 = v2.get ? v2.getUnsigned() : v2;

  return v1 !== v2;
}


//
// Misc
//
emf.Maths.random = function(mask) {
  return emf.Maths.random16(mask);
}

emf.Maths.random8 = function(mask) {
  let r = Math.floor(Math.random() * 0xff);

  return r & mask;
}

emf.Maths.random16 = function(mask) {
  let r = Math.floor(Math.random() * 0xffff);

  return r & mask;
}
