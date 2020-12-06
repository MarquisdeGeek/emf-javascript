emf.assembler = function(cpu) {
  (function ctor() {
    //
  })();

  function assemble(code, startAddress = 0) {
    let rt = {
      blocks: [],
      errorList: [],
      fullMap: []
    };

    cpu.assemble.start();
    cpu.assemble.clearEquateMap();

    let matched;
    let success;
    // We build the binary into this block, twice. 
    // The first time is to compute the basic code layout and instruction addresses
    // (with the necessary side effect that the symbol table is built)
    // The second time around it is kept
    let blocks;

    for (let phase = 0; phase < 2; ++phase) {
      let address = startAddress;

      blocks = [];
      blocks.push({
        start: startAddress,
        data: []
      });

      success = true;
      let lineidx = -1;
      code.forEach((line) => {
        ++lineidx;

        // Strip out comments
        let commentIdx = line.lastIndexOf(';');
        let comment;
        if (commentIdx !== -1) {
          comment = line.substr(commentIdx + 1);
          line = line.substr(0, commentIdx - 1);
        }

        // A standard thing?

        // A label
        if ((matched = line.match(/([^\s]+):(.*)/i)) != null) {
          cpu.assemble.setEquateValue(matched[1], address);
          line = matched[2];
        }

        // Equates/equivalence
        if ((matched = line.match(/([^\s]+)\s+equ\s+(.*)/i)) != null) {
          cpu.assemble.setEquateValue(matched[1], emf.utils.convertToDecimal(matched[2]));
          line = '';
        }

        // Origin of code
        if ((matched = line.match(/org\s+(.*)/i)) != null) {
          line = '';
          address = emf.utils.convertToDecimal(matched[1]);
          blocks.push({
            start: address,
            data: []
          });
        }

        // Code generation
        let asm = {};

        // General byte specification
        if ((matched = line.match(/dc.b\s+(.*)/i)) != null) {
          let entries = matched[1].split(',');
          asm.data = entries.map((d) => emf.utils.convertToDecimal(d));
          asm.errorList = [];

        } else if ((matched = line.match(/^\s*$/i)) != null) {
          // NOP - ignore blank lines

        } else {
          // A CPU-specific thing
          asm = cpu.assemble.assemble(line);

          if (phase === 1) {
            if (!asm) {
              rt.errorList = rt.errorList.concat({
                lineIdx: lineidx,
                text: "Unknown opcode or format"
              });
            }
            if (asm && asm.errorList) {
              rt.errorList = rt.errorList.concat({
                lineIdx: lineidx,
                text: asm.errorList
              });
            }
          }
        }

        if (asm && asm.data) {
          if (phase === 1) {
            rt.fullMap.push({
              address: address,
              data: asm.data,
              asm: code[lineidx]
            });
            blocks[blocks.length - 1].data = blocks[blocks.length - 1].data.concat(asm.data);
          }
          address += asm.data.length;
        }

      });
    }

    // Remove any zero-length blocks
    rt.blocks = blocks.filter((blk) => blk.data.length !== 0);

    rt.success = rt.errorList.length === 0;
    rt.equmap = cpu.assemble.getEquateMap();

    // Move this blocks into an EMF-friendly memory structure
    let memoryHandler = new emf.memory();
    rt.memory = memoryHandler.create();
    rt.blocks.forEach((blk) => {
      rt.memory.addBlockFromData(blk.start, blk.data);
    })

    return rt;
  }

  function showFullMap(div, fullmap) {
    let html = '';
    fullmap.forEach((row) => {
      html += emf.utils.padRight(emf.utils.hex16(row.address), 6);
      html += emf.utils.padRight(row.data.map((d) => emf.utils.hex8(d)).join(' '), 16);
      html += emf.utils.padRight(row.asm);
      html += "<br>";
    });

    html = html.replace(/\s/g, '&nbsp;');
    $(div).html(html);
  }

  function showErrorList(div, errorList) {
    let html = '';
    errorList.forEach((row) => {
      html += emf.utils.padRight(row.lineIdx, 6) + " : ";
      html += emf.utils.padRight(row.text);
      html += "<br>";
    });

    html = html.replace(/\s/g, '&nbsp;');
    $(div).html(html);
  }

  function showEquTable(div, equmap) {
    let html = '';
    Object.keys(equmap).forEach((key) => {
      html += emf.utils.padRight(key, 16);
      html += emf.utils.padRight(equmap[key]);
      html += "<br>";
    });

    html = html.replace(/\s/g, '&nbsp;');
    $(div).html(html);
  }

  return {
    assemble,
    showFullMap,
    showErrorList,
    showEquTable,
  };

}
