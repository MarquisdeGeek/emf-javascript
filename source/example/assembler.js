let assembler = (function(bus, options) {
  let equateMap = {};

  /*
   **
   ** Equates table
   **
   */
  function clearEquateMap() {
    equateMap = {};
  }

  function setEquateValue(name, value) {
    name = name.toLowerCase();
    equateMap[name] = value;
  }

  function getEquateValue(name) {
    name = name.toLowerCase();
    return equateMap[name];
  }

  function getEquateMap(n) {
    return equateMap;
  }

  // General
  function start() {
  }

  function assemble() {
    return null; // not implemented
  }

  return {
    clearEquateMap,
    setEquateValue,
    getEquateMap,
    getEquateValue,

    start,
    assemble
  }
});
