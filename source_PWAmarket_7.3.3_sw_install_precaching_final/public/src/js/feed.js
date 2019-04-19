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

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'items-area-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("/src/images/sample_image.jpg")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);

  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'HEX: #4040a14';
  cardTitleTextElement.className = 'mdl-card__title-text price';
  cardTitleTextElement.textContent = 'Price : $' + '7,500';
  cardTitleTextElement.style.backgroundColor = '#92a8d1';
  cardTitle.appendChild(cardTitleTextElement);

  var cardSupportingText = document.createElement('div');
  cardSupportingText.style.backgroundColor = '#b2b2b2';
  cardSupportingText.style.color = '#50394c';
  cardSupportingText.className = 'item';
  cardSupportingText.textContent = 'Item : ' + 'My sample item';
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);

  var cardSupportingText2 = document.createElement('div');
  cardSupportingText2.style.color = '#618685';
  cardSupportingText2.className = 'location';
  cardSupportingText2.textContent = 'Location : ' + 'My sample location';
  cardSupportingText2.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText2);

  componentHandler.upgradeElement(cardWrapper);
  itemsArea.appendChild(cardWrapper);
}

fetch('https://httpbin.org/get')
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    createCard();
  });
  