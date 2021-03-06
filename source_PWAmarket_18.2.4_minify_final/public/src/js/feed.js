// public-src-js-feed.js

var postButton = document.querySelector('#post-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var itemsArea = document.querySelector('#items-area');
var form = document.querySelector('form');
var itemInput = document.querySelector('#item');
var locationInput = document.querySelector('#location');
var priceInput = document.querySelector('#price');

var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture = null;

var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener('click', function(event) {
  if (!('geolocation' in navigator)) {
    return;
  }

  var sawAlert = false;

  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(function(position) {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    fetchedLocation = {lat: position.coords.latitude, lng: position.coords.longitude};
    locationInput.value = 'lat : ' + position.coords.latitude + '   |   lng : ' + position.coords.longitude;
    document.querySelector('#location-main').classList.add('is-focused');
  }, function(err) {
    console.log(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (!sawAlert) {
      alert('Failed to get location information, please enter manually!');
      sawAlert = true;
    }
    fetchedLocation = {lat: 0, lng: 0};
  }, {timeout: 7000});
});

function initializeLocation() {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}

function initializeMedia() {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
 
  navigator.mediaDevices.getUserMedia({video: true})
    .then(function(stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function(err) {
      imagePickerArea.style.display = 'block';
    });
}

captureButton.addEventListener('click', function(event) {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', function(event) {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);
  initializeMedia();
  initializeLocation();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  captureButton.style.display = 'inline';
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  }
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(100vh)';
  }, 1);
  // createPostArea.style.display = 'none';
}

postButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  while(itemsArea.hasChildNodes()) {
    itemsArea.removeChild(itemsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'items-area-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'HEX: #4040a14';
  cardTitleTextElement.className = 'mdl-card__title-text price';
  cardTitleTextElement.textContent = 'Price : $' + data.price;
  cardTitleTextElement.style.backgroundColor = '#92a8d1';
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement('div');
  cardSupportingText.style.backgroundColor = '#b2b2b2';
  cardSupportingText.style.color = '#50394c';
  cardSupportingText.className = 'item';
  cardSupportingText.textContent = 'Item : ' + data.item;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);

  var cardSupportingText2 = document.createElement('div');
  cardSupportingText2.style.color = '#618685';
  cardSupportingText2.className = 'location';
  cardSupportingText2.textContent = 'Location : ' + data.location;
  cardSupportingText2.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText2);

  componentHandler.upgradeElement(cardWrapper);
  itemsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  for (var i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
}

// Cache then Network
var url = 'https://pwamarket-acc37.firebaseio.com/posts.json';
var networkDataReceived = false;

// After firebase apply
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

// After firebase apply, caches 에서 data 를 찾아서 카드를 생성하는 코드
// if ('caches' in window) {
//   caches.match(url)
//     .then(function(response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function(data) {
//       console.log('From cache', data);
//       if (!networkDataReceived) {
//         var dataArray = [];
//         for (var key in data) {
//           dataArray.push(data[key]);
//         }
//         updateUI(dataArray);
//       }
//     });
// }

// indexed DB 에서 data 를 찾아서 카드를 생성하는 코드
if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From indexedDB store', data);
        updateUI(data);
      }
    });
}


// firebase 적용 전
// fetch(url)
//   .then(function(res) {
//     return res.json();
//   })
//   .then(function(data) {
//     networkDataReceived = true;
//     console.log('From web', data);
//     clearCards();
//     createCard();
//   });


// firebase 적용 전
// if ('caches' in window) {
//   caches.match(url)
//     .then(function(response) {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then(function(data) {
//       console.log('From cache', data);
//       if (!networkDataReceived) {
//         clearCards();
//         createCard();
//       }
//     });
// }

// test fetch
// fetch('https://httpbin.org/get')
//   .then(function(res) {
//     return res.json();
//   })
//   .then(function(data) {
//     createCard();
//     createCard();
//     createCard();
//   });

function sendData() {
  var id = new Date().toISOString();
  var postData = new FormData();
  postData.append('id', id);
  postData.append('item', itemInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('price', priceInput.value);
  postData.append('file', picture, id + '.png');

  fetch('https://us-central1-pwamarket-acc37.cloudfunctions.net/storePostData', {
    method: 'POST',
    body: postData
  })
    .then(function(res) {
      console.log('Sent data(direct, not_by_sync)', res);
    })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (itemInput.value.trim() === '' || locationInput.value.trim() === '' || priceInput.value.trim() === '' || picture === null) {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        var post = {
          id: new Date().toISOString(),
          item: itemInput.value,
          location: locationInput.value,
          price: priceInput.value,
          picture: picture,
          rawLocation: fetchedLocation
        };
        writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your Post was saved for syncing!'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
  } else {
    sendData();
  }

});
