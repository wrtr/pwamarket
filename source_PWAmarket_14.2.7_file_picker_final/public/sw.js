// public-sw.js

importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v5';
var CACHE_DYNAMIC_NAME = 'dynamic-v5';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image_900x338.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
    .then(function(cache) {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  )
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length);
  } else {
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;
}

// Cache Strategies & Routing
self.addEventListener('fetch', function (event) {

  var url = 'https://pwamarket-acc37.firebaseio.com/posts.json';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function(data) {
            for (var key in data) {
              writeData('posts', data[key]);
            };
          });
        return res;
      })
    );

  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(function (res) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then(function (cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html');
                    }
                  });
              });
          }
        })
    );
  }
});

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
            postData.append('price', dt.price);
            postData.append('file', dt.picture, dt.id + '.png');
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

// before open url
// self.addEventListener('notificationclick', function(event) {
//   var notification = event.notification;
//   var action = event.action;

//   console.log(notification);

//   if (action === 'confirm') {
//     console.log('Confirm was chosen');
//     notification.close();
//   } else {
//     console.log('Not confirm button clicked');
//     notification.close();
//   }
// });

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

// Cache then Network with Offline Support
// self.addEventListener('fetch', function (event) {
//   var url = 'https://httpbin.org/get';

//   if (event.request.url.indexOf(url) > -1) {
//     event.respondWith(
//       caches.open(CACHE_DYNAMIC_NAME)
//         .then(function (cache) {
//           return fetch(event.request)
//             .then(function (res) {
//               cache.put(event.request, res.clone());
//               return res;
//             });
//         })
//     );
//   } else {
//     event.respondWith(
//       caches.match(event.request)
//         .then(function (response) {
//           if (response) {
//             return response;
//           } else {
//             return fetch(event.request)
//               .then(function (res) {
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                   .then(function (cache) {
//                     cache.put(event.request.url, res.clone());
//                     return res;
//                   })
//               })
//               .catch(function (err) {
//                 return caches.open(CACHE_STATIC_NAME)
//                   .then(function (cache) {
//                     return cache.match('/offline.html');
//                   });
//               });
//           }
//         })
//     );
//   }
// });


// cache then network & dynamic caching
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME)
//       .then(function(cache) {
//         return fetch(event.request)
//           .then(function(res) {
//             cache.put(event.request, res.clone());
//             return res;
//           });
//       })
//   );
// });


// Network with Cache Fallback
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });


// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });


// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });


// Cache with Network Fallback
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//       caches.match(event.request)
//         .then(function(response) {
//           if (response) {
//             return response;
//           } else {
//             return fetch(event.request)
//               .then(function(res) {
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                   .then(function(cache) {
//                     cache.put(event.request.url, res.clone());
//                     return res;
//                   })
//               })
//               .catch(function (err) {
//                 return caches.open(CACHE_STATIC_NAME)
//                   .then(function (cache) {
//                     if (event.request.headers.get('accept').includes('text/html')) {
//                       return cache.match('/offline.html');
//                     }
//                   });
//               });
//           }
//         })
//   );
// });


// various offline fallbacks
// .catch(function (err) {
//   return caches.open(CACHE_STATIC_NAME)
//     .then(function (cache) {
//       return cache.match('/offline.html');
//     });
// });

// .catch(function (err) {
//   return caches.open(CACHE_STATIC_NAME)
//     .then(function (cache) {
//       if (event.request.url.indexOf('/about') > -1) {
//         return cache.match('/offline.html');
//       }
//     });
// });

// .catch(function (err) {
//   return caches.open(CACHE_STATIC_NAME)
//     .then(function (cache) {
//       if (event.request.headers.get('accept').includes('text/html')) {
//         return cache.match('/offline.html');
//       }
//     });
// });