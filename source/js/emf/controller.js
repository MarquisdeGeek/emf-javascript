emf.controller = (function(machine, options) {
  let runningState = {};
  let maximumFPS = 60;
  let maximumTStatesPerTick = 256750;
  let breakpointList = [];
  let runUntilPC;
  let handlers = {};
  let tracer = {};
  let externalSyncController;
  let comparisonList = [];


  (function ctor() {
    options = options || {};
    options.onStart = options.onStart || function(m) {}
    options.onStop = options.onStop || function(m) {}
    options.onUpdate = options.onUpdate || function(m) {}
  })();

  function coldStart() {
    reset();
  }

  function coldLoadData(filename, data, loadOptions) {
    loadOptions = loadOptions || {};

    let wasRunning = isRunning();

    stopRunning();
    coldStart();

    let atAddress = 0;
    if (loadOptions.startAddress) {
      atAddress = loadOptions.startAddress;
    }

    let importer = new emf.importer();
    importer.byFilename(filename, machine, atAddress, data);

    if (loadOptions.patch) {
      loadOptions.patch(machine, loadOptions);
    }

    options.onUpdate(machine);

    if (wasRunning) {
      startRunning();
    }
  }

  function reset() { // aka warmStart
    machine.reset();
    //
    comparisonList.forEach((comp) => {
      comp.machine.reset();
    });
  }

  function clearComparisonMachine() {
    comparisonList = [];
  }

  function addComparisonMachine(machine, comparator) {
    comparisonList.push({
      machine: machine,
      comparator: comparator
    });
  }

  function startRunning(fps) {
    stopRunning();
    //
    fps = Math.min(fps || 20, maximumFPS);

    runningState.lastTime = Date.now();
    runningState.interval = setInterval(() => {
      updateMachineByStep({
        state: runningState
      });
    }, 1000 / fps);

    dispatch('start');
    options.onStart(machine);
  }

  function stopRunning() {
    clearInterval(runningState.interval);
    runningState.interval = undefined;
    dispatch('stop');
    options.onStop(machine);
  }

  function dispatch(name) {
    if (handlers[name]) {
      handlers[name].forEach((cbfn) => {
        cbfn();
      })
    }
  }

  function step(n) {
    stopRunning();
    //
    let tstates = 0;
    n = n || 1;

    updateMachineByStep({
      steps: n
    });

    return tstates;
  }

  function isRunning() {
    return runningState.interval ? true : false;
  }

  function updateMachineByStep(how) {
    let currentTime = Date.now();
    let steps = 0;
    let tstates;
    let maxtstates;
    let maxSteps = 0; // i.e. as many as you can do
    let cpuRate = machine.clock.cpu.getFrequency();
    let cpuPeriod = 1 / cpuRate;

    if (how.state) {
      let duration = (currentTime - how.state.lastTime) / 1000; // in seconds
      duration = Math.min(duration, 1 / 10); // lock to min of 10 fps

      maxtstates = cpuRate * duration;
    } else {
      maxtstates = how.steps * 100;
      maxSteps = how.steps;
    }
    //
    tstates = 0;
    do {
      let whatProcessed;

      tracePulse();

      // Run the comparison engine(s) first in case there is controlling
      // data or events (e.g. interupts) that we wish to use in our engine
      comparisonList.forEach((comp) => {
        whatProcessed = comp.machine.update({
          steps: 1
        });
      })

      let previousPC = machine.bus.cpu.emulate.getRegisterValuePC();

      whatProcessed = machine.update({
        steps: 1
      });
      tstates += whatProcessed.cpu;
      ++steps;

      let tickDuration = cpuPeriod * whatProcessed.cpu;
      Object.keys(machine.bus.clock).forEach((clkname) => {
        machine.bus.clock[clkname].tick(tickDuration);
      })

      comparisonList.forEach((comp) => {
        if (!comp.comparator.compare(previousPC, machine, comp.machine)) {
          // comparison failed - let's stop!
          stopRunning();
        }
      })

      let currentPC = machine.bus.cpu.emulate.getRegisterValuePC();
      if (runUntilPC === currentPC) {
        runUntil(undefined);
        stopRunning();
      } else if (breakpointList.indexOf(currentPC) !== -1) {
        stopRunning();
      }

    } while ((tstates < maxtstates || (maxSteps && steps < maxSteps)) && isRunning());

    if (how.state) {
      how.state.lastTime = currentTime;
    }

    options.onUpdate(machine);
    //
    comparisonList.forEach((comp) => {
      options.onUpdate(comp.machine);
    });
  }

  function runUntil(addr) {
    runUntilPC = addr;
  }

  function addBreakpointAt(addr) {
    let idx = breakpointList.indexOf(addr);
    if (idx === -1) {
      breakpointList.push(addr);
    }
  }

  function getBreakpointList() {
    return breakpointList;
  }

  function clearBreakpointAt(addr) {
    let idx = breakpointList.indexOf(addr);
    if (idx !== -1) {
      breakpointList.splice(idx, 1)
    }
  }

  function clearBreakpointList() {
    breakpointList = [];
  }

  function on(name, cbfn) {
    handlers[name] = handlers[name] || [];
    handlers[name].push(cbfn);
  }

  //
  // Automatic state tracing
  //
  function traceBetween(startAt, endAt, options) {
    tracer.startAt = startAt;
    tracer.endAt = endAt;
    tracer.isTracing = false;
    tracer.options = options || {};
  }

  function traceStart(options) {
    tracer.isTracing = true;
    tracer.options = options || {};
  }

  function traceEnd() {
    tracer.isTracing = false;
  }

  function tracePulse() {
    // Early out optimisation
    if (!tracer.isTracing && typeof tracer.startAt === typeof undefined) {
      return;
    }
    // TODO: this doesn't work if there's > 1 CPU
    // So move the code to CPU, and let it return {trace: } data 
    let pc = machine.device.cpu.emulate.getRegisterValuePC();

    if (tracer.isTracing) {
      let state = machine.device.cpu.emulate.getState();

      Object.keys(state.registers).forEach((r) => {
        state.registers[r] = state.registers[r].getUnsigned();
      });

      if (tracer.options.traceIf) {
        if (tracer.options.traceIf(state)) {
          return;
        }
      }

      if (tracer.options.traceFilter) {
        tracer.options.traceFilter(state);
      }

      if (tracer.options.traceOutput) {
        tracer.options.traceOutput(state);
      } else {
        console.log(JSON.stringify(state))
      }
      //
      if (pc === tracer.endAt) {
        traceEnd();
      }

    } else {
      if (pc === tracer.startAt) {
        traceStart(tracer.options);
      }
    }
  }


  return {
    coldStart,
    coldLoadData,
    //
    reset,
    //
    startRunning,
    stopRunning,
    isRunning,
    //
    step,
    //
    addBreakpointAt,
    clearBreakpointAt,
    clearBreakpointList,
    getBreakpointList,
    runUntil,
    //
    clearComparisonMachine,
    addComparisonMachine,
    //
    traceBetween,
    traceStart,
    traceEnd,
    //
    on,
  }
});
