emf.memory = (function() {

  function emfMemory() {
    let blocks = [];

    return {
      addBlock: function(start, size) {
        let newBlock = new emfMemoryBlock(start, size);
        blocks.push(newBlock);
      },

      addBlockFromData: function(start, data) {
        let newBlock = new emfMemoryBlock(start, data.length);
        for(let i=0;i<data.length;++i) {
          newBlock.write8(start + i, data[i]);
        }
        blocks.push(newBlock);
      },

      isValidAddress: function(a) {
        let valid = false;
        blocks.forEach((b) => {
          if (a >= b.start && a < b.start+b.size) {
            valid = true;
          }
        })
        return valid;
      },

      getAddressRanges: function() {
        return blocks;
      },

      read8: function(a) {
        let rt = undefined;
        blocks.forEach((b) => {
          if (a >= b.start && a < b.start+b.size) {
            rt = b.read8(a);
          }
        })
        return rt;
      },

      write8: function(a, d) {
        blocks.forEach((b) => {
          if (a >= b.start && a < b.start+b.size) {
            b.write8(a, d);
          }
        })
      },
    };
  }

  function emfMemoryBlock(start, size) {
    size = size || 1024;
    let data = new Array(size);
    return {
      name: 'block',
      start: start || 0,
      size: size,
      read: true,
      write: true,
      shadow: false,
      enabled: true,
      //
      read8: function(a) {
        return data[a - start];
      },
      write8: function(a,d) {
        data[a - start] = d;
      },
    }
  }

  function create(start, size) {
    let mem = new emfMemory();
    if (typeof start !== typeof undefined) {
      mem.addBlock(start, size);
    }
    return mem;
  }

  function createFromArray(start, data) {
    let mem = create(start, data.length);
    mem.addBlockFromData(start, data);

    return mem;
  }

  return {
    create,
    createFromArray,
  }
});
