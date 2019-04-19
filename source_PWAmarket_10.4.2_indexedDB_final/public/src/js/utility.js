// public-src-js-utility.js

var dbPromise = idb.open('posts-store', 1, function (db) {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', {keyPath: 'id'});
  }
});

function writeData(st, data) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.put(data);
      return tx.complete;
    });
}

function readAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
    });
}

function clearAllData(st) {
  return dbPromise
    .then(function(db) {
      var tx = db.transaction(st, 'readwrite');
      var store = tx.objectStore(st);
      store.clear();
      return tx.complete;
    });
}
