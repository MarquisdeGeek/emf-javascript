emf.comparator = (function(options) {
  let isEnabled = true;

  (function ctor() {
    options = options || {};

    options.checkRegisters = typeof options.checkRegisters === typeof undefined ? true : options.checkRegisters;
    options.checkFlags = typeof options.checkFlags === typeof undefined ? true : options.checkFlags;
    options.checkMemory = typeof options.checkMemory === typeof undefined ? true : options.checkMemory;
  })();

  function enable() {
    isEnabled = true;
  }

  function disable() {
    isEnabled = false;
  }

  function report(diffList) {
    Object.keys(diffList.differences).forEach((diffkey) => {
      let diff = diffList.differences[diffkey];
      if (diff.different && !diff.reported) {
        let dis = diffList.m1.bus.cpu.disassemble.disassemble(diffList.m1.bus, diffList.pc);
        let errInfo = `PC: ${emf.utils.hex16(diffList.pc)} : ${dis.instruction}`;

        errInfo += ` : ${diffkey} => ${diff.v1}  !=  ${diff.v2} `;

        console.log(errInfo);

        diff.reported = true;
      }
    });
  }

  function initDifferenceList(diffList) {
    diffList = diffList || {};
    diffList.differences = diffList.differences || {};
    return diffList;
  }

  function applyDifference(diffList, diffref, v1, v2) {
    if (typeof v1 !== typeof undefined && typeof v2 !== typeof undefined) {
      diffList.differences[diffref] = diffList.differences[diffref] || {};
      if (v1 == v2) {
        diffList.differences[diffref].different = false;
        diffList.differences[diffref].reported = false;

      } else if (diffList.differences[diffref].v1 !== v1 || diffList.differences[diffref].v2 !== v2) { // difference
        diffList.differences[diffref].v1 = v1;
        diffList.differences[diffref].v2 = v2;

        if (!diffList.differences[diffref].different) {
          diffList.differences[diffref].reported = false;
          diffList.changes |= true;
        }

        diffList.differences[diffref].different = true;
      }
    }
  }

  function compare(previousPC, m1, m2, diffList) {
    if (!isEnabled) {
      return true;
    }
    diffList = initDifferenceList(diffList);
    diffList.pc = previousPC;
    diffList.m1 = m1;
    diffList.m2 = m2;
    diffList.changes = false;
    //
    let m1State = m1.bus.cpu.emulate.getState();
    let m2State = m2.bus.cpu.emulate.getState();

    let m1Registers = m1State.registers;
    let m2Registers = m2State.registers;

    let errMsg = '';
    let errList = [];

    if (options.checkRegisters) {
      Object.keys(m2Registers).forEach(function(reg_name) {
        let v1 = m1Registers[reg_name];
        let v2 = m2Registers[reg_name];

        if (typeof v1 !== typeof undefined && typeof v2 !== typeof undefined) {
          applyDifference(diffList, `cpu_reg_${reg_name}`, v1.getUnsigned(), v2.getUnsigned());
        }
      });
    }

    //
    let m1Flags = m1State.flags;
    let m2Flags = m2State.flags;

    if (options.checkFlags) {
      Object.keys(m2Flags).forEach(function(flag_name) {
        let v1 = m1Flags[flag_name];
        let v2 = m2Flags[flag_name];

        if (typeof v1 !== typeof undefined && typeof v2 !== typeof undefined) {
          applyDifference(diffList, `cpu_flg_${flag_name}`, v1, v2);
        }
      });
    }
    //
    return diffList.changes === 0; // true means continue, false means stop since comparison failed
  }

  return {
    enable,
    disable,
    compare,
    report,
  }
});
