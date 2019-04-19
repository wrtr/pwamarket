// functions-index.js

var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});

var serviceAccount = require("./pwamarket-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwamarket-acc37.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest(function(request, response) {
 cors(request, response, function() {
   admin.database().ref('posts').push({
     id: request.body.id,
     item: request.body.item,
     location: request.body.location,
     price: request.body.price,
     image: request.body.image
   })
     .then(function() {
       response.status(201).json({message: 'Data stored', id: request.body.id});
     })
     .catch(function(err) {
       response.status(500).json({error: err});
     });
 });
});