emf.device = emf.device || {};

emf.device.PaperTape = function(contents_) {
  let contents;
  let pointer;

  (function ctor(contents_) {
    loadTape(contents_);
  })(contents_);

  function reset() {
    rewind();
  }

  function loadTape(contents_) {
    contents = contents_;
    reset();
  }

  function rewind() {
    seekTo(0);
  }

  function seekTo(idx) {
    if (idx < 0) {
      pointer = 0;
    } else if (idx >= contents.length) {
      pointer = contents.length - 1;
    } else {
      pointer = idx;
    }
  }

  function seekForward(idx) {
    seekTo(pointer + idx);
  }

  function seekBackward(idx) {
    seekTo(pointer - idx);
  }

  function getPointer() {
    return pointer;
  }

  function peek(idx) {
    if (contents === undefined) {
      return {
        error: "No tape loaded"
      };
    }
    let v = contents[idx === undefined ? pointer : idx];
    if (v === undefined) {
      return {
        error: "Tape index is invalid"
      };
    }
    let is_eof = idx >= contents.length;
    return {
      data: v,
      is_eof: is_eof,
      duration: 1
    };
  }

  function fetch() {
    let rt = peek();
    if (rt.error === undefined) {
      ++pointer;
    }
    return rt;
  }

  function getWidth() {
    return 2;
  }

  return {
    reset,
    loadTape,
    rewind,
    seekTo,
    seekForward,
    seekBackward,
    getPointer,
    peek,
    fetch,
    getWidth
  };

}
