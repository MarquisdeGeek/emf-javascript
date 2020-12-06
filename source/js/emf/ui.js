emf.ui = {};

emf.ui.CURSOR_WAIT = 'wait';
emf.ui.CURSOR_ARROW = 'auto';

emf.ui.setCursor = function(type) {
  document.body.style.cursor = type;
}
