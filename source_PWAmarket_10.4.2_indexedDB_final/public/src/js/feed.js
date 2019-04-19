// public-src-js-feed.js

var postButton = document.querySelector('#post-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var itemsArea = document.querySelector('#items-area');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function () {
    createPostArea.style.transform = 'translateY(0)';
  }, 1);

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

// indexed DB 에서 data 를 찾아서 카드를 생성하는 code
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
  