importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.0.0-rc.0/workbox-sw.js");
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

workbox.routing.registerRoute(/.*(?:fonts\.googleapis|gstatic)\.com.*$/, new workbox.strategies.StaleWhileRevalidate({
  cacheName: 'google-fonts',
  plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 30
      }),
    ]
}));

workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css', new workbox.strategies.StaleWhileRevalidate({
cacheName: 'material-css'
}));

workbox.routing.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/, new workbox.strategies.StaleWhileRevalidate({
cacheName: 'post-images'
}));

workbox.routing.registerRoute('https://pwamarket-acc37.firebaseio.com/posts.json', function(args) {
  return fetch(args.event.request)
    .then(function (res) {
      var clonedRes = res.clone();
      clearAllData('posts')
        .then(function () {
          return clonedRes.json();
        })
        .then(function (data) {
          for (var key in data) {
            writeData('posts', data[key])
          }
        });
      return res;
    });
});

// workbox.routing.registerRoute(function (routeData) {
//   return (routeData.event.request.headers.get('accept').includes('text/html'));
// }, function(args) {
//   return caches.match(args.event.request)
//     .then(function (response) {
//       if (response) {
//         return response;
//       } else {
//         return fetch(args.event.request)
//           .then(function (res) {
//             return caches.open('dynamic_wb')
//               .then(function (cache) {
//                 cache.put(args.event.request.url, res.clone());
//                 return res;
//               })
//           })
//           .catch(function (err) {
//             return caches.match('/offline.html')
//               .then(function (res) {
//                 return res;
//               });
//           });
//       }
//     })
// });

workbox.routing.registerRoute(function (routeData) {
  return (routeData.event.request.headers.get('accept').includes('text/html'));
}, function(args) {
  return caches.match(args.event.request)
    .then(function (response) {
      if (response) {
        return response;
      } else {

        caches.match('offline.html')
        .then(function (response) {
           if (response) {
           } else {
            fetch('offline.html')
            .then(function(res){
              caches.open('dynamic_wb')
              .then(function(cache) {cache.put('offline.html', res);})
            })
           }
          })

        return fetch(args.event.request)
          .then(function (res) {
            return caches.open('dynamic_wb')
              .then(function (cache) {
                cache.put(args.event.request.url, res.clone());
                return res;
              })
          })
          .catch(function (err) {
            return caches.match('offline.html');
          });
          
      }
    })
});

workbox.precaching.precacheAndRoute([
  {
    "url": "about/index.html",
    "revision": "6b9b40add0e0a8467b3187b82a53e02d"
  },
  {
    "url": "favicon.ico",
    "revision": "96dd075f56763140f937f56641965d2f"
  },
  {
    "url": "index.html",
    "revision": "3af236f8f7dca940c619c0abbed61931"
  },
  {
    "url": "manifest.json",
    "revision": "13a0fef2096586df68814479beb661a5"
  },
  {
    "url": "offline.html",
    "revision": "3d5c2febd377f8c84ce28448853b0907"
  },
  {
    "url": "src/css/about.css",
    "revision": "63fbb7be4e9207fee9383cb997f17246"
  },
  {
    "url": "src/css/app.css",
    "revision": "58d4c56693b0735799080657c5c197ca"
  },
  {
    "url": "src/css/feed.css",
    "revision": "077512976ac98c03117e0b43730c3516"
  },
  {
    "url": "src/images/main-image_1200x450.jpg",
    "revision": "998d9961e1ef6ac46158b2fe7340e5a1"
  },
  {
    "url": "src/images/main-image_900x338.jpg",
    "revision": "d5869b54344d27b3b6f780e254c2b919"
  },
  {
    "url": "src/images/sample_image.jpg",
    "revision": "571ea6e137acad9a064be8d7efba9d7c"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "cc5f8f78e66e59abad884880c71b1a1d"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "7bcf7b485908e23fecd0964825c4e876"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "f044946c220164eed257b4e2fcb39234"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "88ae80318659221e372dd0d1da3ecf9a"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "3468ef1e50a211ea36c24d4abd41062b"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "a4d4cb3fb469d7c5e563403c9bac634c"
  }
]);

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(function(data) {
          for (var dt of data) {
            var postData = new FormData();
            postData.append('id', dt.id);
            postData.append('item', dt.item);
            postData.append('location', dt.location);
            postData.append('rawLocationLat', dt.rawLocation.lat);
            postData.append('rawLocationLng', dt.rawLocation.lng);
            postData.append('price', dt.price);
            postData.append('file', dt.picture, dt.id + '.png');
            console.log('tt'+postData);
            fetch('https://us-central1-pwamarket-acc37.cloudfunctions.net/storePostData', {
              method: 'POST',
              body: postData
            })
            .then(function(res) {
              console.log('Sent data', res);
              if (res.ok) {
                res.json()
                  .then(function(resData) {
                    deleteItemFromData('sync-posts', resData.id);
                  });
              }
            })
              .catch(function(err) {
                console.log('Error while sending data', err);
              });
          }
        })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
    notification.close();
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then(function(clis) {
          var client = clis.find(function(c) {
            return c.visibilityState === 'visible';
          });

          if (client !== undefined) {
            // client.navigate('http://localhost:8080');
            client.navigate(notification.data.url);
            client.focus();
          } else {
            // clients.openWindow('http://localhost:8080');
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification was closed &', event);
});

self.addEventListener('push', function(event) {
  console.log('Push Notification received', event);

  var data = {title: 'New!', content: 'Something new happened!', openUrl: '/'};

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/src/images/icons/android-icon-96x96.png',
    badge: '/src/images/icons/android-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});