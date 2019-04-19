// functions-index.js

var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpush = require('web-push');

var serviceAccount = require("./pwamarket-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwamarket-acc37.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin.database().ref('posts').push({
      id: request.body.id,
      item: request.body.item,
      location: request.body.location,
      price: request.body.price,
      image: request.body.image
    })
      .then(function () {
        webpush.setVapidDetails('mailto:xxx@gmail.com',
        'BIHN51NsIQT-hToS7GOM7MVTIIOmTo09E0BOmHxJ5w5PFb38iHIgioP4fLuwF3T85pAN0yIwenzLbxy4yehm5Tk',
        '1KrNCZg1nR7EiPFfM8kEFsJT9UDEow2W0TCGMXQARFw');
        return admin.database().ref('subscriptions').once('value');
      })
      .then(function (subscriptions) {
        subscriptions.forEach(function (sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          };
          webpush.sendNotification(pushConfig, JSON.stringify({
            title: 'New Post', 
            content: 'New Post added!',
            openUrl: '/about'
          }))
            .catch(function(err) {
              console.log(err);
            });
        });
        response.status(201).json({message: 'Data stored', id: request.body.id});
      })
      .catch(function (err) {
        response.status(500).json({error: err});
      });
  });
});

// before push message
// exports.storePostData = functions.https.onRequest(function(request, response) {
//  cors(request, response, function() {
//    admin.database().ref('posts').push({
//      id: request.body.id,
//      item: request.body.item,
//      location: request.body.location,
//      price: request.body.price,
//      image: request.body.image
//    })
//      .then(function() {
//        response.status(201).json({message: 'Data stored', id: request.body.id});
//      })
//      .catch(function(err) {
//        response.status(500).json({error: err});
//      });
//  });
// });