/* File: user.js */
/* Author: Nguyen-Hanh Nong */
/* Purpose: This file is the client-side javascript that has to deal with users which include switching the account type and getting the liked artwork of the user */

let user;

/* This function sends a request to the server to change the account type of the user (to patron or artist) */
function switchAccountType() {
  /* Check if the user is an artist or not */
  if (user.result.is_artist == false) {
    /* Check if the user has any artwork added in the past or not */
    if (user.result.artwork.length == 0) {
      /* If the user has no artwork, then alert the user of this and send a GET request to the add artwork page so the user can add artwork before becoming an artist */
      alert("You currently have added no artwork. You will have to add artwork first before becoming an artist. You will now be redirected to the add artwork page!");
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        /* If the GET request was successful, then redirect the user to the rendered page */
        if (this.readyState == 4 && this.status == 200) {
          location.href = "/artwork/new/";
        }
      }
      xhttp.open("GET", "/artwork/new");
      xhttp.setRequestHeader('Content-Type', 'text/html'); 
      xhttp.send();
    }
    else {
      /* If they have already added artwork, then create an object to contain the new is_artist property of the user */
      let sendObject = {};
      sendObject["is_artist"] = true;
      const sendObjectJSON = JSON.stringify(sendObject);

      /* Send a PUT request to the server to update the is_artist property of the user to become an artist */
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        /* If the request was successful then alert the user that it was successful, and then re-initialize the account-home page to display the changes */
        if (this.readyState == 4 && this.status == 200) {
          alert("Your account is now an artist account!");
          init();
        }
      };
      
      xhttp.open("PUT", "/user/artist/");
      xhttp.setRequestHeader('Content-Type', 'application/json');
      xhttp.send(sendObjectJSON);
    }
  }
  else {
    /* If the user is currently a patron, then create an object to store the new is_artist property */
    let sendObject = {};
    sendObject["is_artist"] = false;
    const sendObjectJSON = JSON.stringify(sendObject);

    /* Send a PUT request to the server to update the is_artist property of the user to become a patron */
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      /* If the request was successful, then send an alert indicating the changes and then re-initialize the page to display the new changes */
      if (this.readyState == 4 && this.status == 200) {
        alert("Your account is now a patron/user account!");
        init();
      }
    };
    
    xhttp.open("PUT", "/user/artist/");
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(sendObjectJSON);
  }
}

/* This function initializes the information on the account-home page */
function init() {
  /* Send a GET request to the server to get all types of data about the user (the people the user follows, reviews, etc.) */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then save the data in the user variable and then render the page with the new data */
    if (this.readyState == 4 && this.status == 200) {
      user = JSON.parse(this.responseText);
      renderPage();
    }
  };

  xhttp.open("GET", location.href);
  xhttp.setRequestHeader('Accept', 'application/json'); 
	xhttp.send();
}

/* This function renders the page with the data of the user  */
function renderPage() {
  /* Depending on if the user is or is not an artist, then change the button and account-privilege-header on the webpage to display certain data */
  if (user.result.is_artist == false) {
    document.getElementById("login-button").innerHTML = "Click to Switch to Become an Artist"
    document.getElementById("account-privilege-header").innerHTML = "Your current privilege level for this account is: Patron/User";
  }
  else {
    document.getElementById("login-button").innerHTML = "Click to Switch to Become an Patron"
    document.getElementById("account-privilege-header").innerHTML = "Your current privilege level for this account is: Artist";
  }

  /* Call 4 different functions to get the liked/reviewd artwork, notifications and followed artists and display them on the webpage */
  getLikedArtwork();
  getReviewedArtwork();
  getNotifications();
  getFollowedArtists();
}

/* This function gets the artwork the user liked and display them on the webpage */
function getLikedArtwork() {
  /* Send a GET request to the server to get all the artwork the user liked */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then save the data from the server */
    if (this.readyState == 4 && this.status == 200) {
      let artworkObjects = JSON.parse(this.responseText);
      let listElements = "";

      /* Check if the user has any liked artwork. If they don't then just display a default message in the unoredered list, otherwise, iterate through each of the liked artwork and display them as a link to the artwork's page in the unoredered list. */
      if (artworkObjects.length != 0) { 
        artworkObjects.forEach(elements => {
          listElements += `<li><a href="/artwork/${elements._id}">${elements.name}</a></li>`
        })
      }
      else {
        listElements += `<li>You have currently liked no pieces of artwork!</li>`;
      }

      document.getElementById("liked-list").innerHTML = listElements;
    }
  };
  xhttp.open("GET", "/artwork/likes/");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
	xhttp.send();
}

/* This function gets the reviews the user has created and display them on the webpage */
function getReviewedArtwork() {
  /* Send a GET request to the server to get all the reviews the user has made */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then save the data from the server */
    if (this.readyState == 4 && this.status == 200) {
      let reviewObjects = JSON.parse(this.responseText);
      let listElements = "";

      /* Check if the user has any reviews. If they don't then just display a default message in the unoredered list, otherwise, iterate through each of the reviews and display them as a link to the review's page in the unoredered list. */
      if (reviewObjects.length != 0) { 
        reviewObjects.forEach(reviews => {
          listElements += `<li><a href="/review/${reviews._id}">Review For ${reviews.artwork_id}</a><button type="button" value=${reviews._id} onclick="removeReview(this)">Remove Review</button></li>`
        })
      }
      else {
        listElements += `<li>You have currently no reviews!</li>`;
      }
      document.getElementById("reviewed-list").innerHTML = listElements;
    }
  };
  xhttp.open("GET", "/review/");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
	xhttp.send();
}

/* This function is the onclick event for the remove review buttons, next to the reviews on the webpage and sends a request to the server to review the review from the server */
function removeReview(reviewID) {
  /* Create an object to store the id of the review we want to remove so that it can be sent to the server */
  let sendObject = {};
  sendObject["review_id"] = reviewID.value;
  const sendObjectJSON = JSON.stringify(sendObject)

  /* Send a DELETE request to the server so that the server can delete the review */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then re-intiialize the page with the new data */
    if (this.readyState == 4 && this.status == 200) {
      init();
    }
  };

  xhttp.open("DELETE", "/review/");
  xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(sendObjectJSON);
}

/* This function gets the notifications the user has received and display them on the webpage */
function getNotifications() {
  /* Send a GET request to the server to get all the notifications the user has received */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then save the data from the server */
    if (this.readyState == 4 && this.status == 200) {
      const notificationObjects = JSON.parse(this.responseText);
      let listElements = "";

      /* Check if the user has any notifications. If they don't then just display a default message in the unoredered list, otherwise, iterate through each of the notifications and display the notifications content in the unoredered list. */
      if (notificationObjects.length > 0) {
        notificationObjects.forEach(notification => {
          listElements += `<li>${notification.content}</li>`;
        }); 
      }
      else {
        listElements += `<li>You have currently no notifications!</li>`;
      }

      document.getElementById("notifications-list").innerHTML = listElements;
    }
  };
  xhttp.open("GET", "/user/notification");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
	xhttp.send();
}

/* This function gets the artists the user has followed and display them on the webpage */
function getFollowedArtists() {
  /* Send a GET request to the server to get all the artists the user has followed */
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    /* If the request was successful, then save the data from the server */
    if (this.readyState == 4 && this.status == 200) {
      const followedArray = JSON.parse(this.responseText);
      let listElements = "";

      /* Check if the user has any artists they follow. If they don't then just display a default message in the unoredered list, otherwise, iterate through each of the artists and display the artists a link to their page in the unoredered list. */
      if (followedArray.length != 0) { 
        followedArray.forEach(artist => {
          listElements += `<li><a href="/artist/${artist._id}">${artist.username}</a></li>`;
        });
      }
      else {
        listElements += `<li>You have currently have no followed artists!</li>`;
      }
      document.getElementById("followed-list").innerHTML = listElements;
    }
  };
  xhttp.open("GET", "/user/following");
  xhttp.setRequestHeader('Content-Type', 'application/json'); 
	xhttp.send();
}