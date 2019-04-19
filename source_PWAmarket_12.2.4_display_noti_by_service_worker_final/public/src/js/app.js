// public-src-js-app.js

var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
    window.Promise = Promise;
}

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

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

// display notification (by service worker)
function displayConfirmNotification() {
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our Notification service!',
      icon: '/src/images/icons/android-icon-96x96.png',
      image: '/src/images/sample_image.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47,
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/android-icon-96x96.png'
    };

    navigator.serviceWorker.ready
      .then(function(swreg) {
        swreg.showNotification('Successfully subscribed (from Service Worker) !', options);
      });
  }
}

// display notification (javascript way)
// function displayConfirmNotification() {
//   var options = {
//     body: 'You successfully subscribed to our Notification service!',
//   };
//   new Notification('Successfully subscfribed!', options);
// }

function askForNotificationPermission() {
  Notification.requestPermission(function(result) {
    console.log('User Choice', result);
    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      displayConfirmNotification();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission);
  }
}