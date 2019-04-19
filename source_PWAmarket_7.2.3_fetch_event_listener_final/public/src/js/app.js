// public-src-js-app.js

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function() {
        console.log('Service worker registered!');
      })
      .catch(function(err) {
        console.log(err);
      });
}