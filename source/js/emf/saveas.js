emf.saveAs = (function() {

  (function ctor() {
  })();

  function saveAs(filename, state) {
    let stateAsString = JSON.stringify(state, null, 2);
    let element = document.createElement('a');

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(stateAsString));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  return {
    saveAs
  }
});
