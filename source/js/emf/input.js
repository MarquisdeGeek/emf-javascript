//
emf.input = {};
emf.input.ACTION_KEYDOWN = 'keydown';
emf.input.ACTION_KEYUP = 'keyup';


let listenerList = {
  keyDown: [],
  keyUp: []
};
let keyStateList = [];
let supportAutoRepeat = false;

(function ctor() {

  function handleKeyEvent(evt) {
    // Don't send the keypresses when the user is typing in an input field
    if (document.activeElement.type === 'text' || document.activeElement.type === 'textarea') {
      return;
    }

    handleKey(evt.type, evt.keyCode);

    // Don't pass arrows or space to the browser, since that'll move the window
    if([32, 37, 38, 39, 40].indexOf(evt.keyCode) > -1) {
      evt.preventDefault();
    }
  }

  function handleKey(type, keyCode) {
    const isKeyPressed = type === 'keydown';
    const callbackList = type === 'keydown' ? listenerList.keyDown : listenerList.keyUp;

    if (keyStateList[keyCode] && isKeyPressed && !supportAutoRepeat) {
      // NOP
    } else {
      // Handle the keypress
      keyStateList[keyCode] = isKeyPressed ? true : false;

      callbackList.forEach((cbfn) => {
        cbfn(keyCode);
      })
    }

  }

  document.addEventListener("keydown", function(evt) {
    handleKeyEvent(evt);
  });

  document.addEventListener("keyup", function(evt) {
    handleKeyEvent(evt);
  });

  emf.input.injectCursorUp = function(action) {
    emf.input.inject(action, 'up');
  }

  emf.input.injectCursorDown = function(action) {
    emf.input.inject(action, 'down');
  }

  emf.input.injectCursorLeft = function(action) {
    emf.input.inject(action, 'left');
  }

  emf.input.injectCursorDown = function(action) {
    emf.input.inject(action, 'right');
  }

  emf.input.inject = function(action, param) {
    let mappedWords = { 'up': 38, 'down': 40, 'left': 37, 'right': 39, 'return': 13, 'enter': 13, 'delete': 8};

    if (typeof mappedWords[param] !== typeof undefined) {
      param = mappedWords[param];
    } else if (typeof param === typeof 0) {
      // NOP - already a number
    } else {
      param = sgxASCII(param);
    }
    //
    switch(action) {
      case emf.input.ACTION_KEYDOWN:
      return handleKey('keydown', param);

      case emf.input.ACTION_KEYUP:
      return handleKey('keyup', param);
    }
  }

})();

emf.input.onKeyDown = function(cbfn) {
  listenerList.keyDown.push(cbfn);
}

emf.input.onKeyUp = function(cbfn) {
  listenerList.keyUp.push(cbfn);
}

emf.input.setAutoRepeat = function(autorepeatOn) {
  supportAutoRepeat = autorepeatOn;
}

