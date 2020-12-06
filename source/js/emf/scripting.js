emf.scripting = {};


emf.scripting.createEventList = function() {
  let eventList = [];

  function addEvent(timeat, evt) {
  	eventList.push({condition: { at: timeat }, action: evt })
  }

  function clearList() {
  	eventList = [];
  }

  function runList(machine, controller) {
    return new Promise(function(resolve, reject) {
      // TODO
    	resolve();
    });
  }

  function stopList() {
    return new Promise(function(resolve, reject) {
    	resolve();
    });
  }

  return {
  	addEvent,
  	clearList,
  	runList,
  	stopList,
  };
};

/*

.execute(instruction/a string or an object*)); 
// Q. since this is static, can debugger call this method?!?! YES YES YES YES YES YES


addEvent might be a tuple,... will be  atuple. COming from a file, let the
 importer parseJSON before calling scripting.. in which case. 
 emf.importer.()=>scripting type:: esl (EMF scripting language)


e.g. 
condition: {at: 10}, process: {input: 'keydown', key:'A'}} /keypress adds two events
emf.input.inject('keydown', 'A')

input:keydown/up
cpu:step/start/stop/reset

Q. is the action only a callback (to something? with bind())
*/
