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
            fetch('https://pwamarket-acc37.firebaseio.com/posts.json', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                item: dt.item,
                location: dt.location,
                price: dt.price,
                image: 'https://firebasestorage.googleapis.com/v0/b/pwamarket-acc37.appspot.com/o/sample_image.jpg?alt=media&token=74a4fd91-b1cb-403a-92aa-d5c9c7d20bf8'
              })
            })
            .then(function(res) {
              console.log('Sent data', res);
              if (res.ok) {
                res.json()
                  .then(function(resData) {
                    deleteItemFromData('sync-posts', dt.id); // must fix (using ResData.id)
                    console.log('confirm deleted item', dt.id);
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