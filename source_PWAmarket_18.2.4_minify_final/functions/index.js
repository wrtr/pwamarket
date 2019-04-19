// functions-index.js

var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({origin: true});
var webpush = require('web-push');

var fs = require("fs");
var UUID = require("uuid-v4");
var os = require("os");
var Busboy = require("busboy");
var path = require("path");

var serviceAccount = require("./pwamarket-fb-key.json");

var {Storage} = require("@google-cloud/storage");

const storage = new Storage({
  projectId: "pwamarket-acc37",
  keyFilename: "pwamarket-fb-key.json"
});

// var gcconfig = {
//   projectId: "pwamarket-acc37",
//   keyFilename: "pwamarket-fb-key.json"
// };

// var gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwamarket-acc37.firebaseio.com/'
});

// storePostData_v3, busboy 사용한 storePostData code
exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    var uuid = UUID();

    const busboy = new Busboy({ headers: request.headers });
    let upload;
    const fields = {};

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("finish", () => {
      var bucket = storage.bucket("pwamarket-acc37.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                item: fields.item,
                location: fields.location,
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                },
                price: fields.price,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid
              })
              .then(function() {
                webpush.setVapidDetails(
                  "mailto:xxx@gmail.com",
                  "BIHN51NsIQT-hToS7GOM7MVTIIOmTo09E0BOmHxJ5w5PFb38iHIgioP4fLuwF3T85pAN0yIwenzLbxy4yehm5Tk",
                  "1KrNCZg1nR7EiPFfM8kEFsJT9UDEow2W0TCGMXQARFw"
                );
                return admin
                  .database()
                  .ref("subscriptions")
                  .once("value");
              })
              .then(function(subscriptions) {
                subscriptions.forEach(function(sub) {
                  var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  };

                  webpush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/about"
                      })
                    )
                    .catch(function(err) {
                      console.log(err);
                    });
                });
                response
                  .status(201)
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function(err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      );
    });
    busboy.end(request.rawBody);
  });
});

// storePostData_v2, before busboy
// exports.storePostData = functions.https.onRequest(function (request, response) {
//   cors(request, response, function () {
//     admin.database().ref('posts').push({
//       id: request.body.id,
//       item: request.body.item,
//       location: request.body.location,
//       price: request.body.price,
//       image: request.body.image
//     })
//       .then(function () {
//         webpush.setVapidDetails('mailto:xxx@gmail.com',
//         'BIHN51NsIQT-hToS7GOM7MVTIIOmTo09E0BOmHxJ5w5PFb38iHIgioP4fLuwF3T85pAN0yIwenzLbxy4yehm5Tk',
//         '1KrNCZg1nR7EiPFfM8kEFsJT9UDEow2W0TCGMXQARFw');
//         return admin.database().ref('subscriptions').once('value');
//       })
//       .then(function (subscriptions) {
//         subscriptions.forEach(function (sub) {
//           var pushConfig = {
//             endpoint: sub.val().endpoint,
//             keys: {
//               auth: sub.val().keys.auth,
//               p256dh: sub.val().keys.p256dh
//             }
//           };
//           webpush.sendNotification(pushConfig, JSON.stringify({
//             title: 'New Post', 
//             content: 'New Post added!',
//             openUrl: '/about'
//           }))
//             .catch(function(err) {
//               console.log(err);
//             })
//         });
//         response.status(201).json({message: 'Data stored', id: request.body.id});
//       })
//       .catch(function (err) {
//         response.status(500).json({error: err});
//       });
//   });
// });

// storePostData_v1, before push message
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