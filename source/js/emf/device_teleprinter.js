emf.device = emf.device || {};

emf.device.Teleprinter = function(id) {
  let dom_id;

  (function ctor(id) {
    dom_id = id;
    reset();
  })(id);

  function reset() {
    $(dom_id).html('');
  }

  function onCharacterPrint(c) {
    $(dom_id).append(c);
  }

  function onCharacterRead() {
    return 0;
  }

  function onLinePrint(text) {
    $(dom_id).append(text);
    $(dom_id).append("<br>");
  }

  return {
    reset,
    onCharacterRead,
    onCharacterPrint,
    onLinePrint
  };
}
