emf.dragDrop = (function(element, machine, onLoadCallback) {

  (function ctor() {
    let dropZone = document.getElementById(element);
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
  })();

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    let files = evt.dataTransfer.files;
    let output = [];
    for (let i = 0, f; f = files[i]; i++) {

      let reader = new FileReader();
      reader.onload = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          onLoadCallback && onLoadCallback(f.name, new Uint8Array(evt.target.result));
        }
      };

      // Read in the image file as a data URL.
      reader.readAsArrayBuffer(f);

      break; // first file only
    }
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  return {}
});
