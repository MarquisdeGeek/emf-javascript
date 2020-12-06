emf.eaas = {};

emf.eaas.root = `http://em.ulat.es/archive/`;

emf.eaas.getResourceURL = function(id) {
  return `${emf.eaas.root}/get.php?id=${id}`;
}

emf.eaas.getResourceMetadataURL = function(id) {
  return `${emf.eaas.root}/get.php?meta=${id}`;
}
